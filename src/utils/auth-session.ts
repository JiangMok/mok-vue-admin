import type { UserInfo } from '@/types'

export const AUTH_SESSION_ID_KEY = 'authSessionId'
export const AUTH_LOGIN_ATTEMPT_KEY = 'authLoginAttemptId'
export const AUTH_SESSION_STORAGE_KEY = 'authSession'
export const AUTH_LOGOUT_OPERATION_KEY = 'authLogoutOperationId'
const AUTH_SESSION_LOCK_NAME = 'mok-auth-session-write'
const AUTH_LOGOUT_LOCK_NAME = 'mok-auth-logout'
const AUTH_LOGOUT_LEASE_MILLIS = 45000

interface AuthLogoutOperation {
  id: string
  expiresAt: number
}

export interface PersistedAuthSession {
  sessionId: string
  token: string
  refreshToken: string
  roles: string[]
  userInfo: UserInfo
}

/** 创建一次登录会话的唯一标识，用于隔离跨标签页的异步请求。 */
export const createAuthSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const readPersistedAuthSession = (): PersistedAuthSession | null => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(AUTH_SESSION_STORAGE_KEY) || 'null')
    if (!value || typeof value !== 'object') return null
    const session = value as Partial<PersistedAuthSession>
    if (!session.sessionId || !session.token || !session.refreshToken ||
      !session.userInfo?.id || !Array.isArray(session.roles)) {
      return null
    }
    return session as PersistedAuthSession
  } catch {
    return null
  }
}

export const writePersistedAuthSession = (session: PersistedAuthSession) => {
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export const readAuthSessionId = () =>
  readPersistedAuthSession()?.sessionId || localStorage.getItem(AUTH_SESSION_ID_KEY) || ''

export const beginAuthLoginAttempt = () => {
  const attemptId = createAuthSessionId()
  localStorage.setItem(AUTH_LOGIN_ATTEMPT_KEY, attemptId)
  return attemptId
}

export const readAuthLoginAttempt = () => localStorage.getItem(AUTH_LOGIN_ATTEMPT_KEY) || ''

export const cancelAuthLoginAttempt = () => localStorage.removeItem(AUTH_LOGIN_ATTEMPT_KEY)

export const beginAuthLogoutOperation = () => {
  const operationId = createAuthSessionId()
  const operation: AuthLogoutOperation = {
    id: operationId,
    expiresAt: Date.now() + AUTH_LOGOUT_LEASE_MILLIS
  }
  localStorage.setItem(AUTH_LOGOUT_OPERATION_KEY, JSON.stringify(operation))
  return operationId
}

export const finishAuthLogoutOperation = (operationId: string) => {
  const operation = readAuthLogoutOperation()
  if (operation?.id === operationId) {
    localStorage.removeItem(AUTH_LOGOUT_OPERATION_KEY)
  }
}

export const renewAuthLogoutOperation = (operationId: string) => {
  const operation = readAuthLogoutOperation()
  if (operation?.id === operationId) {
    localStorage.setItem(AUTH_LOGOUT_OPERATION_KEY, JSON.stringify({
      id: operationId,
      expiresAt: Date.now() + AUTH_LOGOUT_LEASE_MILLIS
    } satisfies AuthLogoutOperation))
  }
}

const readAuthLogoutOperation = (): AuthLogoutOperation | null => {
  try {
    const operation = JSON.parse(
      localStorage.getItem(AUTH_LOGOUT_OPERATION_KEY) || 'null') as AuthLogoutOperation | null
    return operation?.id && Number.isFinite(operation.expiresAt) ? operation : null
  } catch {
    return null
  }
}

export const isAuthLogoutInProgress = () => {
  const operation = readAuthLogoutOperation()
  if (!operation) return false
  if (operation.expiresAt <= Date.now()) {
    finishAuthLogoutOperation(operation.id)
    return false
  }
  return true
}

export const waitForAuthLogoutCompletion = async () => {
  const operation = readAuthLogoutOperation()
  if (!operation) return
  const remainingMillis = operation.expiresAt - Date.now()
  if (remainingMillis <= 0) {
    finishAuthLogoutOperation(operation.id)
    return
  }
  await new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('storage', handleStorage)
      resolve()
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_LOGOUT_OPERATION_KEY && !event.newValue) finish()
    }
    const timeoutId = window.setTimeout(() => {
      finishAuthLogoutOperation(operation.id)
      finish()
    }, remainingMillis)
    window.addEventListener('storage', handleStorage)
  })
  if (readAuthLogoutOperation()) {
    await waitForAuthLogoutCompletion()
  }
}

/**
 * 串行化同源标签页的登录、刷新和退出写操作。
 * 不支持 Web Locks 的浏览器仍由会话标识的二次校验阻止旧响应覆盖新会话。
 */
export const withAuthSessionLock = async <T>(callback: () => T | Promise<T>): Promise<T> => {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return callback()
  }
  return navigator.locks.request(AUTH_SESSION_LOCK_NAME, callback)
}

/** 登录通过该屏障与完整的服务端注销生命周期互斥，刷新仍可独立获取会话写锁。 */
export const withAuthLogoutLock = async <T>(callback: () => T | Promise<T>): Promise<T> => {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return callback()
  }
  return navigator.locks.request(AUTH_LOGOUT_LOCK_NAME, callback)
}
