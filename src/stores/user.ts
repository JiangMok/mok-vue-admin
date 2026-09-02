import { defineStore } from 'pinia'
import type { UserInfo, MenuItem, ApiPermission, LoginResponse } from '@/types'

type SessionCleanupHandler = () => void

const sessionCleanupHandlers = new Set<SessionCleanupHandler>()

/**
 * 注册与当前登录会话绑定的清理逻辑（例如移除动态路由）。
 * 放在 store 模块中可以避免 user store 与 router 之间的循环导入。
 */
export const registerSessionCleanupHandler = (handler: SessionCleanupHandler) => {
  sessionCleanupHandlers.add(handler)
  return () => sessionCleanupHandlers.delete(handler)
}

const runSessionCleanupHandlers = () => {
  sessionCleanupHandlers.forEach(handler => {
    try {
      handler()
    } catch (error) {
      console.error('清理登录会话资源失败:', error)
    }
  })
}

const readStoredRoles = (): string[] => {
  try {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    return Array.isArray(roles)
      ? roles.filter((role): role is string => typeof role === 'string')
      : []
  } catch {
    return []
  }
}


export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null as UserInfo | null,
    token: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    roles: readStoredRoles(),
    menus: [] as MenuItem[],
    apiPermissions: [] as ApiPermission[],  // 新增：API权限列表
    permissions: [] as string[],  // 合并后的权限列表（包含菜单code和API权限code）
    permissionsLoaded: false,     // 菜单和API权限是否已完成加载（允许结果为空）
    permissionsLoading: false,
    dynamicRoutesLoaded: false,
    sessionRevision: 0            // 会话切换时递增，用于丢弃旧会话的异步响应
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    nickname: (state) => state.userInfo?.nickname || '',
    userId: (state) => state.userInfo?.id || '',
    avatar: (state) => state.userInfo?.avatar || '',
    isGuest: (state) => state.roles.includes('ROLE_GUEST'),
    isAdmin: (state) => state.roles.includes('ROLE_ADMIN')
  },

  actions: {
    // 设置菜单
    setMenus(menus: MenuItem[]) {
      // console.log('开始设置菜单:', menus)

      // 对菜单进行排序
      const sortMenus = (menuList: MenuItem[]): MenuItem[] => {
        if (!menuList || !Array.isArray(menuList)) return []

        return menuList
          .sort((a, b) => (a.sort || 0) - (b.sort || 0))
          .map(menu => ({
            ...menu,
            children: menu.children ? sortMenus(menu.children) : []
          }))
      }

      this.menus = sortMenus(menus)
      // console.log('排序后的菜单:', this.menus)

      // 提取菜单权限（code字段）
      this.extractMenuPermissions(menus)
    },

    // 设置API权限
    setApiPermissions(permissions: ApiPermission[]) {
      // console.log('设置API权限:', permissions)
      this.apiPermissions = permissions

      // 提取API权限
      this.extractApiPermissions(permissions)
    },

    // 从菜单中提取权限（页面访问权限）
    extractMenuPermissions(menus: MenuItem[]) {
      const menuCodes: string[] = []

      const extract = (items: MenuItem[]) => {
        if (!items || !Array.isArray(items)) return

        items.forEach(item => {
          // 所有菜单的code都作为权限标识
          if (item.code) {
            menuCodes.push(item.code)
          }
          if (item.children && item.children.length > 0) {
            extract(item.children)
          }
        })
      }

      extract(menus)
      // console.log('菜单权限:', menuCodes)

      // 合并权限
      this.mergePermissions(menuCodes, this.permissions.filter(p => !p.startsWith('menu:')))
    },

    // 从API权限中提取权限（按钮/接口权限）
    extractApiPermissions(apiPermissions: ApiPermission[]) {
      const apiCodes: string[] = apiPermissions
        .filter(p => p.permissionCode && p.status === 1)  // 只提取启用状态的权限
        .map(p => p.permissionCode)

      // console.log('API权限:', apiCodes)

      // 合并权限
      this.mergePermissions(this.permissions.filter(p => p.startsWith('menu:')), apiCodes)
    },

    // 合并权限
    mergePermissions(menuCodes: string[], apiCodes: string[]) {
      const addPrefix = (code: string, prefix: 'menu' | 'api') =>
        code.startsWith(`${prefix}:`) ? code : `${prefix}:${code}`

      // 调用方可能传入已带命名空间的权限，避免生成 menu:menu:* / api:api:*。
      const menuPerms = menuCodes.filter(Boolean).map(code => addPrefix(code, 'menu'))
      const apiPerms = apiCodes.filter(Boolean).map(code => addPrefix(code, 'api'))

      // 合并并去重
      this.permissions = [...new Set([...menuPerms, ...apiPerms])]
      // console.log('合并后的所有权限:', this.permissions)
    },

    // 检查是否有权限（简化版，兼容现有代码）
    hasPermission(perm: string): boolean {
      // 支持多种格式的权限检查
      // 1. 直接检查（如 system:user:list）
      // 2. 带前缀检查（如 api:system:user:list）
      // 3. 菜单权限检查（如 menu:system:user）

      const normalizedPerm = perm.replace(/^(api|menu):/, '')

      // 先检查直接权限（兼容传入带 api:/menu: 前缀的权限）
      if (this.permissions.includes(perm) ||
        this.permissions.includes(`api:${normalizedPerm}`) ||
        this.permissions.includes(`menu:${normalizedPerm}`)) {
        return true
      }

      // 再检查是否有通配符权限
      // 例如：如果有 system:user:* 权限，则 system:user:list 也通过
      if (normalizedPerm.includes(':')) {
        const parts = normalizedPerm.split(':')
        for (let i = parts.length - 1; i > 0; i--) {
          const wildcardPerm = parts.slice(0, i).join(':') + ':*'
          if (this.permissions.includes(`api:${wildcardPerm}`)) {
            return true
          }
        }
      }

      return false
    },

    setPermissionsLoaded(loaded: boolean) {
      this.permissionsLoaded = loaded
    },

    setPermissionsLoading(loading: boolean) {
      this.permissionsLoading = loading
    },

    setDynamicRoutesLoaded(loaded: boolean) {
      this.dynamicRoutesLoaded = loaded
    },

    resetAuthorizationState() {
      runSessionCleanupHandlers()
      this.menus = []
      this.apiPermissions = []
      this.permissions = []
      this.permissionsLoaded = false
      this.permissionsLoading = false
      this.dynamicRoutesLoaded = false
      this.sessionRevision += 1
    },

    // 登录成功后的处理
    afterLogin(data: LoginResponse) {
      // 防止同一 SPA 生命周期内切换账号时沿用上一个账号的菜单和动态路由。
      this.resetAuthorizationState()
      this.setToken(data.token)
      this.setRefreshToken(data.refreshToken)
      this.setRoles(data.roles || [])

      this.setUserInfo({
        id: data.userId,
        username: data.username,
        nickname: data.nickname,
        phone: '',
        email: '',
        avatar: data.avatar || null,
        status: 1,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      })

      localStorage.setItem('userInfo', JSON.stringify({
        id: data.userId,
        username: data.username,
        nickname: data.nickname,
        avatar: data.avatar
      }))
    },

    // 其他方法保持不变...
    setUserInfo(info: UserInfo | null) {
      this.userInfo = info
      localStorage.setItem('userInfo', JSON.stringify({
        id: info?.id,
        username: info?.username,
        nickname: info?.nickname,
        avatar: info?.avatar
      }))
    },

    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },

    setRefreshToken(refreshToken: string) {
      this.refreshToken = refreshToken
      localStorage.setItem('refreshToken', refreshToken)
    },

    setRoles(roles: string[]) {
      this.roles = [...new Set(roles)]
      localStorage.setItem('roles', JSON.stringify(this.roles))
    },

    async logout() {
      try {
        const { authApi } = await import('@/api/modules/auth')
        await authApi.logout()
      } catch (error) {
        console.error('退出登录失败:', error)
      } finally {
        this.clear()
      }
    },

    clear() {
      this.token = ''
      this.refreshToken = ''
      this.userInfo = null
      this.roles = []
      this.resetAuthorizationState()
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('roles')
    },

    init() {
      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      const userInfoStr = localStorage.getItem('userInfo')
      if (token) {
        this.token = token
      }

      if (refreshToken) {
        this.refreshToken = refreshToken
      }

      if (userInfoStr) {
        try {
          this.userInfo = JSON.parse(userInfoStr)
        } catch (error) {
          console.error('解析用户信息失败:', error)
        }
      }

      this.roles = readStoredRoles()
    }
  }
})
