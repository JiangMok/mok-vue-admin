import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from "@/stores/user.ts";
import type {MenuItem} from "@/types";
import {menuApi, permissionApi} from "@/api";
import Layout from "@/layout/Layout.vue";

// 在文件顶部，在函数外部定义
const modules = import.meta.glob('../views/**/*.vue')

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
      title: '登录'
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
  if (!menus || menus.length === 0) {
    console.warn('菜单数据为空，无法添加动态路由')
    return
  }

  // 转换菜单为路由
  const dynamicRoutes = menus.map(menu => convertMenuToRoute(menu))

  // 添加动态路由
  dynamicRoutes.forEach(route => {
    router.addRoute(route)
  })

  // 添加404页面
  router.addRoute({
    path: '/:catchAll(.*)',
    redirect: '/404'
  })
}

// 路由守卫保持不变
router.beforeEach(async (to, from, next) => {
  console.log('======跳转到:', to.path)
  console.log('======当前所有路由:', router.getRoutes().map(r => r.path))
  // 获取用户状态存储实例
  const userStore = useUserStore()
  //调试日志,显示路由跳转信息
  console.log('路由守卫: from', from.path, " to", to.path)

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
  if (userStore.menus.length === 0 || userStore.apiPermissions.length === 0) {
    try {
      // 使用Promise.all同时获取菜单和权限
      const [menuRes, permRes] = await Promise.all([
        menuApi.getUserMenus(),
        permissionApi.getUserApiPermissions().catch(() => ({ data: [] })) // 避免权限接口失败影响菜单
      ])
      // console.log("权限接口返回信息:{}",permRes)
      // console.log("菜单接口返回信息:{}",menuRes)
      // 设置菜单
      userStore.setMenus(menuRes.data || [])

      // 设置API权限
      if (permRes) {
        userStore.setApiPermissions(permRes.data || [])
      }

      // 动态添加路由
      addDynamicRoutes(menuRes.data)

      // 重新跳转
      next({ ...to, replace: true })
    } catch (error) {
      console.error('权限获取失败:', error)
      // 即使失败也继续，可能有缓存权限
      next()
    }
  } else {
    next()
  }
  })

export default router
