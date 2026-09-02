import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { registerSessionCleanupHandler, useUserStore } from "@/stores/user.ts";
import type {MenuItem} from "@/types";
import {menuApi, permissionApi} from "@/api/modules/permission";
import Layout from "@/layout/Layout.vue";

// 在文件顶部，在函数外部定义
const modules = import.meta.glob('../views/**/*.vue')

/**
 * 只保留当前前端构建中真实存在的菜单组件。
 * 后端数据库仍残留已裁剪模块的菜单时，侧边栏不会展示一个只能落到 404 的入口。
 */
const filterAvailableMenus = (menus: MenuItem[]): MenuItem[] =>
  menus.reduce<MenuItem[]>((availableMenus, menu) => {
    const children = filterAvailableMenus(menu.children || [])
    const isContainer = !menu.component || menu.component === 'Layout'
    const componentExists = menu.component === 'Layout' ||
      Boolean(menu.component && modules[`../views/${menu.component}.vue`])

    if ((!isContainer && !componentExists) || (isContainer && children.length === 0)) {
      console.warn(`忽略无可用前端组件的菜单: ${menu.name} (${menu.component || menu.path})`)
      return availableMenus
    }

    availableMenus.push({ ...menu, children })
    return availableMenus
  }, [])

// 定义静态路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/profile',
    component: Layout,
    meta: { title: '个人中心', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/views/base/profile/index.vue'),
        meta: { title: '个人中心' }
      }
    ]
  },
  {
    path: '/dashboard',
    component: Layout,
    meta: { title: '仪表盘', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/base/dashboard/index.vue'),
        meta: { title: '系统信息' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes
})

const dynamicRouteRemoveCallbacks: Array<() => void> = []
let dynamicRoutesRegistered = false
let authorizationLoadPromise: Promise<void> | null = null

class StaleSessionError extends Error {}

/** 移除当前会话注册的所有动态路由（包括动态 404）。 */
export const resetDynamicRoutes = () => {
  let removeRoute = dynamicRouteRemoveCallbacks.pop()
  while (removeRoute) {
    removeRoute()
    removeRoute = dynamicRouteRemoveCallbacks.pop()
  }
  dynamicRoutesRegistered = false
  // 已在执行的请求无法取消，但 sessionRevision 会阻止旧响应写回新会话。
  authorizationLoadPromise = null
}

registerSessionCleanupHandler(resetDynamicRoutes)

// 优化后的路由转换函数
const convertMenuToRoute = (menu: MenuItem, parentPath = ''): RouteRecordRaw => {
  // 构建完整路径
  let fullPath = menu.path
  if (parentPath && !menu.path.startsWith('/')) {
    fullPath = `${parentPath}/${menu.path}`
  }

  // 递归处理子菜单
  let children: RouteRecordRaw[] = []
  if (menu.children && menu.children.length > 0) {
    children = menu.children.map(child => convertMenuToRoute(child, fullPath))
  }

  // 处理组件导入
  let component: any
  if (menu.component === 'Layout') {
    component = Layout
  } else if (menu.component) {
    const componentPath = `../views/${menu.component}.vue`
    if (modules[componentPath]) {
      component = modules[componentPath]
    } else {
      component = () => import('@/views/error/404.vue')
    }
  } else if (children.length > 0) {
    // 如果有子路由但没有指定组件，使用 router-view
    component = { template: '<router-view />' }
  }

  // 构建路由配置
  const routeConfig: any = {
    path: fullPath,
    name: menu.code || menu.name || menu.id as string,
    meta: {
      title: menu.name,
      icon: menu.icon,
      requiresAuth: true
    }
  }

  // 添加组件（如果有）
  if (component) {
    routeConfig.component = component
  }

  // 如果是布局组件且有子路由，添加重定向到第一个子路由
  if (menu.component === 'Layout' && children.length > 0) {
    const firstChild = children[0]
    if (firstChild && firstChild.path) {
      routeConfig.redirect = firstChild.path
    }
  }

  // 添加子路由（如果有）
  if (children.length > 0) {
    routeConfig.children = children
  }

  return routeConfig as RouteRecordRaw
}

// 动态添加路由
function addDynamicRoutes(menus: MenuItem[]) {
  if (dynamicRoutesRegistered) {
    return
  }

  try {
    // 空菜单也是合法结果；此时只注册兜底路由。
    const dynamicRoutes = Array.isArray(menus)
      ? menus.map(menu => convertMenuToRoute(menu))
      : []

    dynamicRoutes.forEach(route => {
      dynamicRouteRemoveCallbacks.push(router.addRoute(route))
    })

    dynamicRouteRemoveCallbacks.push(router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'DynamicNotFound',
      redirect: '/404'
    }))
    dynamicRoutesRegistered = true
  } catch (error) {
    resetDynamicRoutes()
    throw error
  }
}

const ensureAuthorizationReady = async (userStore: ReturnType<typeof useUserStore>) => {
  if (userStore.permissionsLoaded) {
    if (!userStore.dynamicRoutesLoaded || !dynamicRoutesRegistered) {
      addDynamicRoutes(userStore.menus)
      userStore.setDynamicRoutesLoaded(true)
    }
    return
  }

  if (!authorizationLoadPromise) {
    const sessionRevision = userStore.sessionRevision
    userStore.setPermissionsLoading(true)

    const currentLoadPromise: Promise<void> = (async () => {
      const [menuRes, permRes] = await Promise.all([
        menuApi.getUserMenus(),
        permissionApi.getUserApiPermissions().catch(error => {
          console.warn('API权限获取失败，将按空权限处理:', error)
          return { data: [] }
        })
      ])

      if (!userStore.isLoggedIn || userStore.sessionRevision !== sessionRevision) {
        throw new StaleSessionError('登录会话已切换，忽略旧权限响应')
      }

      const rawMenus = Array.isArray(menuRes.data) ? menuRes.data : []
      const menus = filterAvailableMenus(rawMenus)
      const apiPermissions = Array.isArray(permRes.data) ? permRes.data : []
      userStore.setMenus(menus)
      userStore.setApiPermissions(apiPermissions)
      userStore.setPermissionsLoaded(true)

      addDynamicRoutes(menus)
      userStore.setDynamicRoutesLoaded(true)
    })().finally(() => {
      // 清理时只修改自己对应的请求，避免旧会话覆盖新会话的 loading 状态。
      if (authorizationLoadPromise === currentLoadPromise) {
        authorizationLoadPromise = null
        userStore.setPermissionsLoading(false)
      }
    })

    authorizationLoadPromise = currentLoadPromise
  }

  await authorizationLoadPromise
}

// 路由守卫保持不变
router.beforeEach(async (to, from, next) => {
  // console.log('======跳转到:', to.path)
  // console.log('======当前所有路由:', router.getRoutes().map(r => r.path))
  // 获取用户状态存储实例
  const userStore = useUserStore()
  //调试日志,显示路由跳转信息
  // console.log('路由守卫: from', from.path, " to", to.path)

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - MOK基础后台框架`
  }

  /**
   * 登录页特殊处理
   * 场景 : 如果用户已经登录,访问登陆页面应该跳转到首页
   * 为什么 : 避免已登录用户重复登录
   */
  if (to.path === '/login') {
    // 已经登录,跳转到仪表盘页
    if (userStore.isLoggedIn) {
      next('/dashboard')
    } else {
      // 未登录,允许访问登录页
      next()
    }
    return  // 结束本次守卫
  }

  /**
   * 检查用户是否登录
   * 作用：保护需要登录才能访问的路由
   * 为什么：防止未登录用户直接访问受保护页面
   */
  if (!userStore.isLoggedIn) {
    // 未登录,重定向到登录页
    next('/login')
    return
  }

  /**
   * 动态路由加载
   * 场景 : 用户已登录,但应用还没有加载用户的菜单权限
   * 为什么 : 实现权限控制,不同用户看到不同的菜单
   */
  if (!userStore.permissionsLoaded ||
    !userStore.dynamicRoutesLoaded ||
    !dynamicRoutesRegistered) {
    try {
      await ensureAuthorizationReady(userStore)

      if (!userStore.isLoggedIn) {
        next('/login')
        return
      }

      // 首次注册动态路由后重新解析当前地址，支持刷新和直接打开深层路由。
      next({ ...to, replace: true })
    } catch (error) {
      if (error instanceof StaleSessionError) {
        next(userStore.isLoggedIn ? { ...to, replace: true } : '/login')
        return
      }
      console.error('权限获取失败:', error)
      // 如果 token 已被拦截器清空（登录过期），直接跳转登录页
      if (!userStore.isLoggedIn) {
        next('/login')
        return
      }
      // 即使失败也继续，可能有缓存权限
      next()
    }
  } else {
    // 已有菜单，但检查 token 是否仍然有效（可能被其他 API 调用清空）
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }
    next()
  }
  })

export default router
