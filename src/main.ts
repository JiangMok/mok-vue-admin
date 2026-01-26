/**
 * 导入Vue 3的createApp函数
 * 作用：用于创建Vue应用实例
 */
import {createApp} from 'vue'
/**
 * 导入Pinia状态管理的createPinia函数
 * 作用：创建Pinia实例，用于状态管理
 * 为什么：Pinia是Vue官方推荐的状态管理库，替代Vuex
 */
import {createPinia} from 'pinia'
/**
 * 导入Element Plus组件库及其样式
 * ElementPlus: Element Plus组件库的主对象
 * 作用：提供丰富的UI组件
 * 为什么：使用现成的UI组件库可以快速开发，保持界面一致性
 */
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
/**
 * 导入Element Plus的所有图标组件
 * * as ElementPlusIconsVue: 将所有图标组件作为一个对象导入
 * 作用：注册所有Element Plus图标，以便在应用中使用
 * 为什么：图标是UI的重要组成部分，统一管理方便使用
 */
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
/**
 * 导入根组件
 * App: 应用的根组件，是应用的主要入口组件
 * 作用：作为整个Vue应用的根组件
 */
import App from './App.vue'
/**
 * 导入路由配置
 * router: 我们在router/index.ts中定义的路由实例
 * 作用：管理应用的路由和页面导航
 */
import router from './router'
import {useUserStore} from "@/stores/user.ts";
// 引入中文语言包
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

/**
 * 创建Vue应用实例
 * 参数App: 根组件
 * 作用：创建Vue应用的核心实例，后续所有插件和配置都挂载到这个实例上
 */
const app = createApp(App)
/**
 * 全局注册所有Element Plus图标组件
 * 作用：将Element Plus的所有图标注册为全局组件
 * 为什么：这样在任何组件中都可以直接使用图标，无需单独导入
 * 遍历ElementPlusIconsVue对象的每一个键值对
 */
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  // 注册为全局组件
  // key: 图标组件的名称（如：Plus, Edit, Delete等）
  // component: 图标组件本身
  app.component(key, component)
}


/**
 * 使用Pinia状态管理插件
 * 作用：将Pinia状态管理库集成到Vue应用中
 * 为什么：让整个应用都能访问到状态管理
 * 注意：这里先创建Pinia实例，然后通过app.use()使用
 */
app.use(createPinia())
/**
 * 使用路由插件
 * 作用：将路由配置集成到Vue应用中
 * 为什么：使应用支持路由功能，实现单页应用(SPA)的页面切换
 */
app.use(router)
/**
 * 使用Element Plus UI组件库
 * 作用：将Element Plus组件库集成到Vue应用中
 * 为什么：让应用可以使用Element Plus提供的所有UI组件
 */
app.use(ElementPlus, {
  locale: zhCn, // 设置中文
  // 如果使用按需导入，这个配置可能无效，需要使用ElConfigProvider
})
/**
 *  初始化用户状态
 *  作用：在应用启动时从localStorage恢复用户登录状态
 *  为什么：用户刷新页面后，仍然保持登录状态
 *  注意：必须在app.use(createPinia())之后才能使用useUserStore()
 */
const userStore = useUserStore()
userStore.init()  // 调用init方法从localStorage恢复token和用户信息
/**
 * 将Vue应用挂载到DOM元素
 * 参数'#app': HTML中id为"app"的元素
 * 作用：将Vue应用渲染到页面中，替换id为"app"的元素
 * 为什么：Vue需要一个DOM元素作为渲染的根节点
 */
app.mount('#app')

// // 添加全局错误处理
// window.addEventListener('error', (event) => {
//   console.error('全局错误:', event.error)
// })
// // 添加Vue错误处理
// app.config.errorHandler = (err, vm, info) => {
//   console.error('Vue错误:', err)
//   console.error('错误信息:', info)
// }
