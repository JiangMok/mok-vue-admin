// 1. 导入类型定义：这些是 TypeScript 的类型声明，用于在编写代码时提供智能提示和类型检查
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
// 2. 导入 axios 核心库，用于发送 HTTP 请求
import axios from 'axios';
// 3. 导入 Element Plus 的消息提示组件，用于在页面上弹出错误/成功提示
import { ElMessage } from 'element-plus';
import type { ApiResponse, LoginResponse, UserInfo } from '@/types';
import {
  beginAuthLoginAttempt,
  cancelAuthLoginAttempt,
  AUTH_SESSION_STORAGE_KEY,
  isAuthLogoutInProgress,
  readAuthLoginAttempt,
  readAuthSessionId,
  readPersistedAuthSession,
  waitForAuthLogoutCompletion,
  writePersistedAuthSession,
  withAuthLogoutLock,
  withAuthSessionLock
} from '@/utils/auth-session';
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  _authSessionId?: string
  _authOperationId?: string
  _authLockHeld?: boolean
}

interface PendingRequest {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

interface StoredSessionSnapshot {
  sessionId: string
  token: string
  refreshToken: string
  roles: string[]
  userInfo: UserInfo
}

interface AdoptedSession {
  token: string
  accountChanged: boolean
  sessionChanged: boolean
  authorizationChanged: boolean
}

interface RefreshExecutionResult {
  token: string
  navigateToSafePage: boolean
}

interface RefreshSessionEvent {
  type: 'refresh-complete' | 'refresh-failed'
  userId: string
  occurredAt: number
}

class SessionChangedError extends Error {}

const REQUEST_TIMEOUT = 10000;
const AUTH_SESSION_CHANNEL = 'mok-auth-session';
const AUTH_REFRESH_EVENT_KEY = 'authRefreshEvent';

// 6. 配置接口的基础地址：优先从环境变量中读取，如果没配置则默认使用 '/api'
//    环境变量通常定义在 .env.development 或 .env.production 文件中
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

// 7. 创建主请求实例 service，后续所有业务接口都通过它来发送
//    AxiosInstance 是 axios 实例的类型
const service: AxiosInstance = axios.create({
  baseURL,                  // 所有请求都会自动拼接这个基础路径
  timeout: REQUEST_TIMEOUT, // 请求超时时间设置为 10 秒，超时后请求会自动失败
  headers: {
    'Content-Type': 'application/json', // 默认告诉服务器我们发送的是 JSON 格式的数据
  },
});

// 8. 创建一个专门用于刷新 token 的独立 axios 实例
//    为什么要独立？因为主实例 service 上挂载了拦截器，如果刷新请求也走 service，
//    当刷新请求返回 401 时又会触发刷新逻辑，造成无限循环。
//    这个实例没有任何拦截器，是最纯净的 axios 实例。
const refreshAxios = axios.create({
  baseURL,                  // 使用相同的基础地址
  timeout: REQUEST_TIMEOUT, // 同样的超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 9. 全局状态变量（定义在模块顶层，在整个应用生命周期内共享）
let isRefreshing = false;                         // 标记是否正在刷新 token，防止同时发送多个刷新请求
let requests: PendingRequest[] = [];              // 刷新期间等待重试的请求
const authSessionChannel = typeof BroadcastChannel === 'undefined'
  ? null
  : new BroadcastChannel(AUTH_SESSION_CHANNEL);

function applyRefreshedCredentials(originalRequest: RetryableRequestConfig, newToken: string) {
  originalRequest.headers.Authorization = `Bearer ${newToken}`;
  // 退出请求触发刷新后，原请求体中的 refreshToken 已被轮换，必须替换为最新值。
  if (originalRequest.url?.endsWith('/auth/logout')) {
    const latestRefreshToken = readPersistedAuthSession()?.refreshToken ||
      localStorage.getItem('refreshToken');
    if (latestRefreshToken) {
      originalRequest.data = JSON.stringify({ refreshToken: latestRefreshToken });
    }
  }
}

async function clearSessionAndRedirectToLogin(expectedSessionId = readAuthSessionId()) {
  const [{ useUserStore }, { default: router }] = await Promise.all([
    import('@/stores/user'),
    import('@/router')
  ])
  const userStore = useUserStore()
  const cleared = await userStore.clearIfCurrent(expectedSessionId)
  if (!cleared) {
    const syncResult = await withAuthSessionLock(async () => {
      const latestSession = readStoredSession()
      return latestSession
        ? synchronizeStoredSession(latestSession, '', '', false)
        : null
    })
    if (syncResult?.authorizationChanged) {
      await navigateToSafePage()
    }
    return false
  }
  delete service.defaults.headers.Authorization
  if (router.currentRoute.value.path !== '/login') {
    await router.replace('/login')
  }
  return true
}

function readStoredSession(): StoredSessionSnapshot | null {
  const persistedSession = readPersistedAuthSession();
  if (persistedSession) return persistedSession;

  const sessionId = readAuthSessionId();
  const token = localStorage.getItem('token') || '';
  const refreshToken = localStorage.getItem('refreshToken') || '';
  if (!sessionId || !token || !refreshToken) return null;

  try {
    const rolesValue: unknown = JSON.parse(localStorage.getItem('roles') || '[]');
    const userInfoValue: unknown = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (!userInfoValue || typeof userInfoValue !== 'object' ||
      typeof (userInfoValue as Partial<UserInfo>).id !== 'string') {
      return null;
    }

    const roles = Array.isArray(rolesValue)
      ? rolesValue.filter((role): role is string => typeof role === 'string')
      : [];
    return {
      sessionId,
      token,
      refreshToken,
      roles,
      userInfo: userInfoValue as UserInfo
    };
  } catch {
    return null;
  }
}

function publishRefreshSessionEvent(type: RefreshSessionEvent['type'], userId: string) {
  const event = { type, userId, occurredAt: Date.now() } satisfies RefreshSessionEvent;
  authSessionChannel?.postMessage(event);
  // BroadcastChannel 不可用时，storage 事件仍可作为跨标签完成信号。
  localStorage.setItem(AUTH_REFRESH_EVENT_KEY, JSON.stringify(event));
}

async function synchronizeStoredSession(
  snapshot: StoredSessionSnapshot,
  expectedUserId = '',
  expectedSessionId = '',
  navigateAfterSync = true
): Promise<AdoptedSession> {
  const { useUserStore } = await import('@/stores/user');
  const userStore = useUserStore();
  const previousUserId = expectedUserId || userStore.userInfo?.id || '';
  const previousSessionId = expectedSessionId || userStore.authSessionId || '';
  const accountChanged = Boolean(previousUserId && previousUserId !== snapshot.userInfo.id);
  const sessionChanged = previousSessionId !== snapshot.sessionId;
  const rolesChanged = userStore.roles.length !== snapshot.roles.length ||
    userStore.roles.some(role => !snapshot.roles.includes(role));

  if (accountChanged && !userStore.userInfo?.id) {
    userStore.resetAuthorizationState();
  }
  userStore.synchronizeStoredSession(snapshot);
  service.defaults.headers.Authorization = `Bearer ${snapshot.token}`;

  if (navigateAfterSync && (accountChanged || sessionChanged || rolesChanged)) {
    await navigateToSafePage();
  }
  return {
    token: snapshot.token,
    accountChanged,
    sessionChanged,
    authorizationChanged: accountChanged || sessionChanged || rolesChanged
  };
}

async function navigateToSafePage() {
  const { default: router } = await import('@/router');
  // force 确保当前已在 dashboard 时也重新执行守卫并加载新会话权限。
  await router.replace({ path: '/dashboard', force: true });
}

async function adoptRotatedCredentials(
  attemptedRefreshToken: string,
  expectedUserId: string,
  expectedSessionId: string
): Promise<AdoptedSession | null> {
  // 在同一把锁内完成读取和 Pinia 同步，防止旧快照反向覆盖刚提交的新会话。
  const adoptedSession = await withAuthSessionLock(async () => {
    const snapshot = readStoredSession();
    if (!snapshot || snapshot.refreshToken === attemptedRefreshToken) return null;
    return synchronizeStoredSession(snapshot, expectedUserId, expectedSessionId, false);
  });
  if (adoptedSession?.authorizationChanged) {
    await navigateToSafePage();
  }
  return adoptedSession;
}

let storageSyncTimer: number | undefined;
const scheduleStoredSessionSync = (expectedSessionId = readAuthSessionId()) => {
  window.clearTimeout(storageSyncTimer);
  storageSyncTimer = window.setTimeout(async () => {
    const syncResult = await withAuthSessionLock(async () => {
      const snapshot = readStoredSession();
      if (!snapshot) return null;
      return synchronizeStoredSession(snapshot, '', '', false);
    });
    if (syncResult) {
      if (syncResult.authorizationChanged) {
        await navigateToSafePage();
      }
      return;
    }

    if (!localStorage.getItem('token') && !localStorage.getItem('refreshToken')) {
      await clearSessionAndRedirectToLogin(expectedSessionId);
    }
  }, 0);
};

window.addEventListener('storage', (event: StorageEvent) => {
  if (event.key === AUTH_SESSION_STORAGE_KEY) {
    let previousSessionId = '';
    try {
      previousSessionId = event.oldValue
        ? (JSON.parse(event.oldValue) as Partial<StoredSessionSnapshot>).sessionId || ''
        : '';
    } catch {
      previousSessionId = '';
    }
    scheduleStoredSessionSync(previousSessionId);
    return;
  }
  if (event.key === AUTH_REFRESH_EVENT_KEY && event.newValue) {
    try {
      const refreshEvent = JSON.parse(event.newValue) as RefreshSessionEvent;
      if (refreshEvent.type === 'refresh-complete') scheduleStoredSessionSync();
    } catch {
      // 忽略其他脚本写入的无效事件。
    }
  }
});

authSessionChannel?.addEventListener('message', (event: MessageEvent<RefreshSessionEvent>) => {
  if (event.data?.type === 'refresh-complete') scheduleStoredSessionSync();
});

/**
 * 10. 刷新 token 函数
 *     功能：携带本地存储的 refreshToken 去后端换取新的 accessToken
 *     返回值：Promise<string>，成功时返回新的 accessToken，失败时抛出异常
 */
async function refreshToken(originalRequest: RetryableRequestConfig): Promise<string> {
  // 10.1 原子快照无需等待写锁；失败请求携带的 accessToken 才是并发刷新基线。
  const initialSession = readStoredSession();
  let refreshTokenStr = initialSession?.refreshToken || '';
  const expectedUserId = initialSession?.userInfo.id || '';
  const expectedSessionId = originalRequest._authSessionId || initialSession?.sessionId || '';
  const authorization = originalRequest.headers?.Authorization;
  const failedAccessToken = typeof authorization === 'string'
    ? authorization.replace(/^Bearer\s+/i, '')
    : '';
  // 10.2 如果没有 refreshToken，说明用户从未登录或已经被清空，直接抛出错误
  if (!refreshTokenStr) {
    throw new Error('没有 refreshToken');
  }
  if (typeof navigator === 'undefined' || !navigator.locks) {
    // 缺少跨标签原子锁时不写轮换凭据，避免旧刷新响应覆盖刚登录的新账号。
    throw new Error('当前浏览器不支持安全的登录续期，请重新登录');
  }

  try {
    const refreshResult = await withAuthSessionLock<RefreshExecutionResult>(async () => {
      // 等待跨标签锁后先接管已轮换的凭据，避免再次消费同一个 refreshToken。
      const sessionBeforeRefresh = readStoredSession();
      if (sessionBeforeRefresh && sessionBeforeRefresh.sessionId !== expectedSessionId) {
        await synchronizeStoredSession(
          sessionBeforeRefresh, expectedUserId, expectedSessionId, false);
        throw new SessionChangedError('其他标签页已经切换登录会话');
      }
      if (!sessionBeforeRefresh || readAuthSessionId() !== expectedSessionId) {
        throw new SessionChangedError('登录会话已经发生变化');
      }
      if (failedAccessToken && sessionBeforeRefresh.token !== failedAccessToken) {
        const adoptedSession = await synchronizeStoredSession(
          sessionBeforeRefresh, expectedUserId, expectedSessionId, false);
        return {
          token: sessionBeforeRefresh.token,
          navigateToSafePage: adoptedSession.authorizationChanged
        };
      }
      refreshTokenStr = sessionBeforeRefresh.refreshToken;

      // 10.3 使用独立实例刷新，跨标签写锁会一直持有到凭据完整写入。
      const [{ useUserStore }, response] = await Promise.all([
        import('@/stores/user'),
        refreshAxios.post<unknown, AxiosResponse<ApiResponse<LoginResponse>>>(
          '/auth/refresh',
          { refreshToken: refreshTokenStr }
        )
      ]);

      // 10.4 HTTP 成功后仍需检查业务状态码。
      if (response.data.code !== 200) {
        throw new Error(response.data.msg || '刷新token失败');
      }

      const loginData = response.data.data;
      if (!loginData || (expectedUserId && loginData.userId !== expectedUserId)) {
        throw new Error('刷新令牌所属用户不一致');
      }

      // 不支持 Web Locks 时依靠会话标识二次校验，防止旧响应覆盖新登录。
      if (readAuthSessionId() !== expectedSessionId ||
        (readPersistedAuthSession()?.refreshToken || localStorage.getItem('refreshToken')) !==
          refreshTokenStr) {
        throw new SessionChangedError('登录会话已经发生变化');
      }

      const userStore = useUserStore();
      const nextRoles = loginData.roles || [];
      const rolesChanged = userStore.roles.length !== nextRoles.length ||
        userStore.roles.some(role => !nextRoles.includes(role));
      if (rolesChanged) {
        userStore.resetAuthorizationState();
      }
      userStore.setRoles(nextRoles);
      userStore.setToken(loginData.token);
      if (!userStore.userInfo) {
        userStore.setUserInfo({
          id: loginData.userId,
          username: loginData.username,
          nickname: loginData.nickname,
          phone: '',
          email: '',
          avatar: loginData.avatar || null,
          status: 1,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        });
      }
      // 先更新兼容字段，再用完整快照作为跨标签页的原子提交点。
      userStore.setRefreshToken(loginData.refreshToken);
      writePersistedAuthSession({
        sessionId: expectedSessionId,
        token: loginData.token,
        refreshToken: loginData.refreshToken,
        roles: nextRoles,
        userInfo: userStore.userInfo as UserInfo
      });

      service.defaults.headers.Authorization = `Bearer ${loginData.token}`;
      publishRefreshSessionEvent('refresh-complete', loginData.userId);
      return { token: loginData.token, navigateToSafePage: rolesChanged };
    });
    if (refreshResult.navigateToSafePage) {
      await navigateToSafePage();
    }
    return refreshResult.token;
  } catch (refreshError) {
    if (refreshError instanceof SessionChangedError) {
      throw refreshError;
    }

    const rotatedSession = await adoptRotatedCredentials(
      refreshTokenStr, expectedUserId, expectedSessionId);
    if (rotatedSession) {
      if (rotatedSession.sessionChanged) {
        throw new SessionChangedError('其他标签页已经切换登录会话');
      }
      return rotatedSession.token;
    }
    publishRefreshSessionEvent('refresh-failed', expectedUserId);
    throw refreshError;
  }
}

/**
 * 11. 处理 token 刷新并重试请求的通用逻辑
 *     参数 originalRequest：原始的失败请求配置对象（包含 url、headers、data 等）
 *     返回值：Promise<any>，即重试请求的结果
 */
async function handleTokenRefreshAndRetry(originalRequest: RetryableRequestConfig): Promise<unknown> {
  // 11.1 如果当前正在刷新 token，那么就不能再发起新的刷新请求
  if (isRefreshing) {
    // 11.2 返回一个 Promise，并将当前请求加入等待队列
    return new Promise((resolve, reject) => {
      // 11.3 往队列中添加一个回调函数，该回调会在刷新成功后被执行，参数是新 token
      requests.push({
        resolve: (newToken: string) => {
          applyRefreshedCredentials(originalRequest, newToken);
          resolve(service(originalRequest));
        },
        reject
      });
    });
  }

  // 11.6 将刷新状态标记为 true，表示开始刷新流程
  isRefreshing = true;

  try {
    // 11.7 调用 refreshToken 函数获取新 token
    const newToken = await refreshToken(originalRequest);

    // 11.8 刷新成功：遍历请求队列，依次执行队列中的每一个回调函数，传入新 token
    requests.forEach(request => request.resolve(newToken));
    // 11.9 清空请求队列（所有等待的请求都已经用新 token 重发了）
    requests = [];

    // 11.10 重试当前这个原始的失败请求，注意要用 service 实例发送，确保走完整的拦截器
    applyRefreshedCredentials(originalRequest, newToken);
    return service(originalRequest);
  } catch (refreshError) {
    // 其他标签页已经切换账号时，保留接管后的新会话，但绝不能用新身份重放旧请求。
    if (refreshError instanceof SessionChangedError) {
      requests.forEach(request => request.reject(refreshError));
      requests = [];
      return Promise.reject(refreshError);
    }

    // 11.11 刷新失败（例如 refreshToken 也过期了）
    //      弹出友好的提示信息，告诉用户需要重新登录
    ElMessage.error("登录信息失效,请重新登录")

    // 11.12 清空请求队列（这些请求已经没有重试的必要了，因为刷新失败了）
    requests.forEach(request => request.reject(refreshError));
    requests = []; // 清空队列，防止内存泄漏

    // 11.13 清除 Pinia store 中的用户状态（token、用户信息、权限菜单等）
    await clearSessionAndRedirectToLogin(originalRequest._authSessionId);

    // 11.15 将刷新失败的错误继续向上抛出，让调用方知道本次请求已失败
    return Promise.reject(refreshError);
  } finally {
    // 11.16 无论刷新成功还是失败，最终都要将刷新状态标记为 false
    isRefreshing = false;
  }
}

// ==================== 请求拦截器 ====================
// 作用：在请求发送之前对请求配置进行统一处理，比如自动添加 token
service.interceptors.request.use(
  // 第一个参数：请求成功的处理函数（对 config 做修改后必须返回 config）
  async (config: InternalAxiosRequestConfig) => {
    const retryableConfig = config as RetryableRequestConfig;
    const isLoginRequest = config.url?.includes('/auth/login') === true;
    if (isLoginRequest) {
      retryableConfig._authOperationId = await withAuthLogoutLock(async () => {
        let loginAttemptId = '';
        while (!loginAttemptId) {
          await waitForAuthLogoutCompletion();
          loginAttemptId = await withAuthSessionLock(() =>
            isAuthLogoutInProgress() ? '' : beginAuthLoginAttempt());
        }
        return loginAttemptId;
      });
    }
    const readAuthSnapshot = () => {
      const persistedSession = readPersistedAuthSession();
      return {
        sessionId: persistedSession?.sessionId || readAuthSessionId(),
        token: persistedSession?.token || localStorage.getItem('token') || ''
      };
    };
    const authSnapshot = retryableConfig._authLockHeld
      ? readAuthSnapshot()
      : await withAuthSessionLock(readAuthSnapshot);
    const currentSessionId = authSnapshot.sessionId;
    if (retryableConfig._authSessionId &&
      retryableConfig._authSessionId !== currentSessionId) {
      throw new SessionChangedError('请求所属登录会话已经切换');
    }
    // 从本地存储获取 accessToken
    const token = authSnapshot.token;
    // 如果存在 token，则将其添加到请求头的 Authorization 字段中，格式为 "Bearer <token>"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      retryableConfig._authSessionId ||= currentSessionId;
    }
    // 特殊处理：登录接口和获取验证码接口不需要 token，所以如果检测到是这些接口，就删除 Authorization 头
    // 为什么要删除？因为有些后端接口如果携带了无效 token 会直接报错
    if (isLoginRequest || config.url?.includes('/captcha/generate')) {
      delete config.headers.Authorization;
      delete retryableConfig._authSessionId;
    }
    // 必须返回 config，否则请求会被挂起
    return config;
  },
  // 第二个参数：请求失败的处理函数（一般发生在网络错误或配置错误时）
  (error) => {
    console.error('请求拦截错误', error);
    // 将错误继续抛出，让调用方可以捕获
    return Promise.reject(error);
  }
);

// ==================== 响应拦截器 ====================
// 作用：对服务器返回的数据进行统一处理，包括业务错误提示、token 过期自动刷新等
service.interceptors.response.use(
  // 第一个参数：响应成功的处理函数（HTTP 状态码为 2xx 时进入）
  (response: AxiosResponse) => {
    const responseConfig = response.config as RetryableRequestConfig;
    if (responseConfig._authOperationId &&
      responseConfig._authOperationId !== readAuthLoginAttempt()) {
      return Promise.reject(new SessionChangedError('登录响应已被更新的操作取代'));
    }
    if (responseConfig._authSessionId &&
      responseConfig._authSessionId !== readAuthSessionId()) {
      return Promise.reject(new SessionChangedError('请求所属登录会话已经切换'));
    }
    const data = response.data;   // 后端返回的实际数据体
    if (responseConfig._authOperationId && data?.code === 200 && data.data) {
      data.data.authOperationId = responseConfig._authOperationId;
    }

    // 检查业务状态码：如果 code 存在且不等于 200，说明业务逻辑上出错了
    if (data.code !== undefined && data.code !== 200) {
      // 和后端约定：当 code 为 3002 时，表示 accessToken 过期了，需要刷新 token
      if (data.code === 3002) {
        const originalRequest = response.config as RetryableRequestConfig;
        // 添加 _retry 标记，防止同一个请求因为刷新后再次失败而陷入无限重试
        if (!originalRequest._retry && !originalRequest._authLockHeld) {
          originalRequest._retry = true;
          // 调用刷新并重试的逻辑
          return handleTokenRefreshAndRetry(originalRequest);
        }
      }
      ElMessage.error(data.msg || '请求失败')
      // 其他业务错误码（如参数错误、权限不足等），在控制台打印错误信息
      console.error('业务错误:', data.msg || '请求失败');
      // 将错误数据 reject 出去，这样调用方可以通过 try...catch 或 .catch() 捕获到
      return Promise.reject(data);
    }

    // 一切正常（code 为 200 或没有 code 字段），返回业务数据部分（剥离了 axios 的包装层）
    return response.data;
  },
  // 第二个参数：响应失败的处理函数（HTTP 状态码非 2xx，如 401、404、500 等）
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (originalRequest?._authOperationId) {
      if (originalRequest._authOperationId !== readAuthLoginAttempt()) {
        return Promise.reject(new SessionChangedError('登录请求已被更新的操作取代'));
      }
      await withAuthSessionLock(() => {
        if (originalRequest._authOperationId === readAuthLoginAttempt()) {
          cancelAuthLoginAttempt();
        }
      });
    }

    if (originalRequest?._authSessionId &&
      originalRequest._authSessionId !== readAuthSessionId()) {
      return Promise.reject(new SessionChangedError('请求所属登录会话已经切换'));
    }

    // 如果 HTTP 状态码是 401（Unauthorized）或者 3002（后端自定义），都视为 token 无效/过期
    // 并且该请求还没有被标记为已重试
    if ((error.response?.status === 401 || error.response?.status === 3002)
        && originalRequest && !originalRequest._retry && !originalRequest._authLockHeld) {
      originalRequest._retry = true;   // 标记已重试，防止死循环

      // 再次检查本地是否有 token 和 refreshToken
      const persistedSession = readPersistedAuthSession();
      const token = persistedSession?.token || localStorage.getItem('token');
      const refreshTokenStr = persistedSession?.refreshToken ||
        localStorage.getItem('refreshToken');
      if (!token || !refreshTokenStr) {
        // 如果登录凭据不完整，清空完整会话并跳转登录页
        await clearSessionAndRedirectToLogin(originalRequest._authSessionId);
        return Promise.reject(error);
      }

      // 有 refreshToken，尝试刷新 token 并重试请求
      return handleTokenRefreshAndRetry(originalRequest);
    }

    // 以下是对其他 HTTP 错误状态码的统一提示处理
    if (error.response?.status === 403) {
      ElMessage.error('没有权限访问');          // 403 禁止访问
    } else if (error.response?.status === 404) {
      ElMessage.error('请求的资源不存在');       // 404 未找到
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器内部错误');         // 500 服务器错误
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络');    // 请求超时
    } else if (error.message.includes('Network Error')) {
      ElMessage.error('网络错误，请检查网络连接'); // 网络断开
    } else {
      // 其他未知错误，尝试使用后端返回的错误信息，如果没有则用默认文案
      ElMessage.error(error.response?.data?.msg || '请求失败');
    }

    // 将错误继续抛出，让调用方知道请求失败了
    return Promise.reject(error);
  }
);

// 12. 导出封装好的 axios 实例，其他模块（如 api 文件）会引入它来发送请求
export default service;
