import { defineStore } from 'pinia'
import type { UserInfo, MenuItem, ApiPermission } from '@/types'
import { authApi, permissionApi } from "@/api"


export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null as UserInfo | null,
    token: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    menus: [] as MenuItem[],
    apiPermissions: [] as ApiPermission[],  // 新增：API权限列表
    permissions: [] as string[]  // 合并后的权限列表（包含菜单code和API权限code）
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    nickname: (state) => state.userInfo?.nickname || '',
    userId: (state) => state.userInfo?.id || '',
    avatar: (state) => state.userInfo?.avatar || ''
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
      // 给菜单权限添加前缀，以区分类型
      const menuPerms = menuCodes.map(code => `menu:${code}`)
      const apiPerms = apiCodes.map(code => `api:${code}`)

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

      // 先检查直接权限
      if (this.permissions.includes(`api:${perm}`) ||
        this.permissions.includes(`menu:${perm}`)) {
        return true
      }

      // 再检查是否有通配符权限
      // 例如：如果有 system:user:* 权限，则 system:user:list 也通过
      if (perm.includes(':')) {
        const parts = perm.split(':')
        for (let i = parts.length - 1; i > 0; i--) {
          const wildcardPerm = parts.slice(0, i).join(':') + ':*'
          if (this.permissions.includes(`api:${wildcardPerm}`)) {
            return true
          }
        }
      }

      return false
    },

    // 登录成功后的处理
    async afterLogin(data: any) {
      this.setToken(data.token)
      this.setRefreshToken(data.refreshToken)

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

      // 登录后获取API权限
      await this.fetchApiPermissions()
    },

    // 获取API权限
    async fetchApiPermissions() {
      try {
        const res = await permissionApi.getUserApiPermissions()
        if (res.code === 200) {
          this.setApiPermissions(res.data)
        }
      } catch (error) {
        console.error('获取API权限失败:', error)
      }
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

    async logout() {
      try {
        await authApi.logout()
      } catch (error) {
        console.error('退出登录失败:', error)
      } finally {
        this.clear()
        localStorage.clear()
        window.location.reload()
      }
    },

    clear() {
      this.token = ''
      this.refreshToken = ''
      this.userInfo = null
      this.menus = []
      this.apiPermissions = []
      this.permissions = []
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

      // 初始化时也尝试获取API权限（如果有token的话）
      if (this.token) {
        this.fetchApiPermissions().catch(console.error)
      }
    }
  }
})
