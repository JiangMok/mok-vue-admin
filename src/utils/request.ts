// 1. 导入类型定义：这些是 TypeScript 的类型声明，用于在编写代码时提供智能提示和类型检查
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
// 2. 导入 axios 核心库，用于发送 HTTP 请求
import axios from 'axios';
// 3. 导入 Element Plus 的消息提示组件，用于在页面上弹出错误/成功提示
import { ElMessage } from 'element-plus';
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface PendingRequest {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

// 6. 配置接口的基础地址：优先从环境变量中读取，如果没配置则默认使用 '/api'
//    环境变量通常定义在 .env.development 或 .env.production 文件中
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

// 7. 创建主请求实例 service，后续所有业务接口都通过它来发送
//    AxiosInstance 是 axios 实例的类型
const service: AxiosInstance = axios.create({
  baseURL,                  // 所有请求都会自动拼接这个基础路径
  timeout: 10000,           // 请求超时时间设置为 10 秒，超时后请求会自动失败
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
  timeout: 10000,           // 同样的超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 9. 全局状态变量（定义在模块顶层，在整个应用生命周期内共享）
let isRefreshing = false;                         // 标记是否正在刷新 token，防止同时发送多个刷新请求
let requests: PendingRequest[] = [];              // 刷新期间等待重试的请求

function clearSessionAndRedirectToLogin() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  window.location.assign('/login')
}

/**
 * 10. 刷新 token 函数
 *     功能：携带本地存储的 refreshToken 去后端换取新的 accessToken
 *     返回值：Promise<string>，成功时返回新的 accessToken，失败时抛出异常
 */
async function refreshToken(): Promise<string> {
  // 10.1 从 localStorage 中取出 refreshToken（刷新令牌）
  const refreshTokenStr = localStorage.getItem('refreshToken');
  // 10.2 如果没有 refreshToken，说明用户从未登录或已经被清空，直接抛出错误
  if (!refreshTokenStr) {
    throw new Error('没有 refreshToken');
  }

  // 10.3 使用独立的 refreshAxios 实例调用刷新接口，将 refreshToken 作为 URL 参数传递
  const response = await refreshAxios.post(`/auth/refresh?refreshToken=${refreshTokenStr}`);

  // 10.4 检查后端返回的业务状态码。即便 HTTP 状态码是 200，业务上也可能失败（例如 refreshToken 过期）
  //     后端约定 code 为 200 才算成功，其他值都表示失败。
  if (response.data.code !== 200) {
    // 抛出错误，将后端的错误信息带出去，外层会捕获并跳转登录页
    throw new Error(response.data.msg || '刷新token失败');
  }

  // 10.5 从响应数据中解构出新的 accessToken 和 refreshToken
  const newToken = response.data.data.token;
  const newRefreshToken = response.data.data.refreshToken;

  // 10.6 将新 token 保存到 localStorage 中，覆盖旧的 token
  localStorage.setItem('token', newToken);
  localStorage.setItem('refreshToken', newRefreshToken);

  // 10.7 更新主实例 service 的默认请求头，让后续所有请求自动携带新的 accessToken
  service.defaults.headers.Authorization = `Bearer ${newToken}`;

  // 10.8 返回新的 accessToken
  return newToken;
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
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
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
    const newToken = await refreshToken();

    // 11.8 刷新成功：遍历请求队列，依次执行队列中的每一个回调函数，传入新 token
    requests.forEach(request => request.resolve(newToken));
    // 11.9 清空请求队列（所有等待的请求都已经用新 token 重发了）
    requests = [];

    // 11.10 重试当前这个原始的失败请求，注意要用 service 实例发送，确保走完整的拦截器
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return service(originalRequest);
  } catch (refreshError) {
    // 11.11 刷新失败（例如 refreshToken 也过期了）
    //      弹出友好的提示信息，告诉用户需要重新登录
    ElMessage.error("登录信息失效,请重新登录")

    // 11.12 清空请求队列（这些请求已经没有重试的必要了，因为刷新失败了）
    requests.forEach(request => request.reject(refreshError));
    requests = []; // 清空队列，防止内存泄漏

    // 11.13 清除 Pinia store 中的用户状态（token、用户信息、权限菜单等）
    await clearSessionAndRedirectToLogin();

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
  (config: InternalAxiosRequestConfig) => {
    // 从本地存储获取 accessToken
    const token = localStorage.getItem('token');
    // 如果存在 token，则将其添加到请求头的 Authorization 字段中，格式为 "Bearer <token>"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 特殊处理：登录接口和获取验证码接口不需要 token，所以如果检测到是这些接口，就删除 Authorization 头
    // 为什么要删除？因为有些后端接口如果携带了无效 token 会直接报错
    if (config.url?.includes('/auth/login') || config.url?.includes('/captcha/generate')) {
      delete config.headers.Authorization;
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
    const data = response.data;   // 后端返回的实际数据体

    // 检查业务状态码：如果 code 存在且不等于 200，说明业务逻辑上出错了
    if (data.code !== undefined && data.code !== 200) {
      // 和后端约定：当 code 为 3002 时，表示 accessToken 过期了，需要刷新 token
      if (data.code === 3002) {
        const originalRequest = response.config as RetryableRequestConfig;
        // 添加 _retry 标记，防止同一个请求因为刷新后再次失败而陷入无限重试
        if (!originalRequest._retry) {
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

    // 如果 HTTP 状态码是 401（Unauthorized）或者 3002（后端自定义），都视为 token 无效/过期
    // 并且该请求还没有被标记为已重试
    if ((error.response?.status === 401 || error.response?.status === 3002)
        && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;   // 标记已重试，防止死循环

      // 再次检查本地是否有 token 和 refreshToken
      const token = localStorage.getItem('token');
      const refreshTokenStr = localStorage.getItem('refreshToken');
      if (!token || !refreshTokenStr) {
        // 如果连 token 都没有，说明用户确实未登录，直接清空存储并跳转登录
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        await clearSessionAndRedirectToLogin();
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
