import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from "@/stores/user.ts";
import type {MenuItem} from "@/types";
import {menuApi, permissionApi} from "@/api";
import Layout from "@/layout/Layout.vue";

// 在文件顶部，在函数外部定义
const modules = import.meta.glob('../views/**/*.vue')
/**
 * 创建静态路由 - 所有用户都可以访问
 * 作用:定义无需权限验证的公共路由
 * RouteRecordRaw : 这是 vue router 的路由记录类型,确保路由配置格式正确
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',                    // 根路径
    redirect: '/dashboard'            // 重定向到登录页
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
        meta: { title: '仪表盘' }
      }
    ]
  },
  {
    path: '/login',               // 路径
    name: 'Login',                // 路由名称,用于编程式导航
    component: () => import('@/views/Login.vue'),  // 修正了多余的斜杠
    meta: {                       // 路由元信息,可以存放任意自定义数据
      title: '登录'               // 页面标题
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
  // ,{
  //   path: '/dashboard',
  //   name: 'Dashboard',
  //   component: () => import('@/views/system/dashboard/index.vue'),  // 需要创建这个组件
  //   meta: {
  //     title: '控制台',
  //   }
  // }
]

/**
 * 创建路由实例
 * 作用 : 创建并配置vue router 实例
 * 为什么 : 管理页面中的所有页面路由
 */
const router = createRouter({
  // 使用html5历史模式
  // 作用 : 路由url看起来更像普通url,没有#号
  history: createWebHistory(import.meta.env.BASE_URL),
  // 初始化路由表
  routes: constantRoutes
})

/**
 * 路由守卫
 *
 * 路由守卫是什么?
 *  路由守卫是vue router提供的导航守卫,用于在路由跳转前后执行特定逻辑
 *  比如 : 就像进入大楼安检,检查你是否能进入特定楼层
 *
 * 三种类型的路由守卫
 *  1.全局守卫(本文件使用的):影响所路由跳转
 *  2.路由独享守卫:只影响特定路由
 *  3.组件内守卫:在组件自定义
 *
 * 执行时机:
 *  路由跳转 -> beforeEach(全局前置守卫) -> 组件加载 -> afterEach(全局后置守卫)
 */

/**
 * 全局前置守卫 - router.beforeEach
 * 作用 : 在路由跳转前执行,用于鉴权,数据获取等
 * 为什么 : 统一管理路由权限,确保只有有权限的用户才能访问
 * 参数 :
 *      to:即将要进入的路由对象
 *      from:当前导航正要离开的路由对象
 *      next:控制跳转的函数,必须调用
 */
router.beforeEach(async (to, from, next) => {
  console.log('======跳转到:', to.path)
  console.log('======当前所有路由:', router.getRoutes().map(r => r.path))
  // 获取用户状态存储实例
  const userStore = useUserStore()
  // 调试日志,显示路由跳转信息
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
console.log("权限接口返回信息:{}",permRes)
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

/**
 * 动态添加路由
 * 作用:根据用户权限动态生成路由表
 */
// 动态添加路由
function addDynamicRoutes(menus: MenuItem[]) {
  console.log('开始添加动态路由，菜单数据:', menus)

  if (!menus || menus.length === 0) {
    console.warn('菜单数据为空，无法添加动态路由')
    return
  }

  // 动态路由数组
  const dynamicRoutes: RouteRecordRaw[] = []

  // 递归转换菜单为路由
  const convertMenuToRoute = (menu: MenuItem, parentPath = ''): RouteRecordRaw => {
    // 构建完整路径
    let fullPath = menu.path
    console.log(`处理菜单: ${menu.name}, 原始path: ${menu.path}, parentPath: ${parentPath}`)

    // 如果是子菜单，拼接父路径
    if (parentPath && !menu.path.startsWith('/')) {
      fullPath = `${parentPath}/${menu.path}`
    }

    console.log(`转换菜单: ${menu.name}, 完整path: ${fullPath}, component: ${menu.component}`)

    // 路由配置
    const route: RouteRecordRaw = {
      path: fullPath,
      name: menu.code || menu.name || menu.id,
      meta: {
        title: menu.name,
        icon: menu.icon,
        requiresAuth: true
      }
    }

    // 处理组件
    if (menu.component === 'Layout') {
      // 布局组件（包含左侧菜单）
      console.log(`加载布局组件: ${menu.name}`)
      route.component = () => import('@/layout/Layout.vue')

      // 如果有子菜单，设置重定向到第一个子菜单
      if (menu.children && menu.children.length > 0) {
        const firstChild = menu.children[0]
        let redirectPath = firstChild.path
        if (!redirectPath.startsWith('/')) {
          redirectPath = `${fullPath}/${redirectPath}`
        }
        route.redirect = redirectPath
        console.log(`设置重定向: ${fullPath} -> ${redirectPath}`)
      }
    } else if (menu.component) {
      // 普通页面组件 - 使用 import.meta.glob 进行动态导入
      console.log(`尝试加载组件: ${menu.component}.vue`)

      // 构建组件路径
      const componentPath = `../views/${menu.component}.vue`

      // 检查是否在 modules 中
      if (modules[componentPath]) {
        // 使用 modules 中的导入函数
        route.component = modules[componentPath]
      } else {
        console.error(`组件加载失败: ${menu.component}, 路径: ${componentPath}`)
        // 加载失败，使用404组件
        route.component = () => import('@/views/error/404.vue')
      }
    } else {
      // 如果没有组件，设置一个空的component或者重定向
      console.warn(`菜单 ${menu.name} 没有component属性，设置为空组件`)
      route.component = { template: '<router-view />' }
    }

    // 如果有子菜单，递归处理
    if (menu.children && menu.children.length > 0) {
      console.log(`菜单 ${menu.name} 有 ${menu.children.length} 个子菜单`)
      route.children = menu.children.map(child => convertMenuToRoute(child, fullPath))
    }

    return route
  }

  // 遍历菜单，生成路由
  menus.forEach(menu => {
    const route = convertMenuToRoute(menu)
    dynamicRoutes.push(route)
  })

  // 添加动态路由到路由实例
  dynamicRoutes.forEach(route => {
    console.log(`添加路由: ${route.path} (${route.name})`)
    router.addRoute(route)
  })

  // 添加404页面，确保放在最后
  router.addRoute({
    path: '/:catchAll(.*)',
    redirect: '/404'
  })

  // 打印当前所有路由
  console.log('当前所有路由:')
  router.getRoutes().forEach(route => {
    console.log(`  ${route.path} - ${route.name}`)
  })
}

export default router
