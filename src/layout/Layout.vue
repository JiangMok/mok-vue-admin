<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left">
        <div class="logo">
          <h2>后台管理系统</h2>
        </div>
      </div>
      <div class="header-center">
        <!-- 时间显示（带图标） -->
        <el-tooltip content="点击同步时间" placement="bottom">
          <div class="time-display" @click="updateTime">
            <span>{{ currentTime }}</span>
          </div>
        </el-tooltip>

        <!-- 其他功能（通知、全屏等）可以放在这里 -->
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :src="avatar" :size="32">
              {{ nickname?.charAt(0) || username?.charAt(0) || 'U' }}
            </el-avatar>
            <span class="username">{{ nickname }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="main-container">
      <!-- 左侧菜单 -->
      <div class="sidebar" v-if="hasMenu">
        <el-menu
          :default-active="activeMenu"
          :router="true"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <!-- 递归渲染菜单 -->
          <menu-item
            v-for="menu in menus"
            :key="menu.id"
            :menu="menu"
          />
        </el-menu>
      </div>

      <!-- 右侧内容区域 -->
      <div class="content" :class="{ 'no-sidebar': !hasMenu }">
        <!-- 内容头部（面包屑）可保留，也可移入标签栏上方 -->
        <div class="content-header" v-if="false"> <!-- 可选隐藏，由标签栏替代 -->
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentRoute.meta?.title }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>
        <!-- 标签栏 -->
        <TabsView />
        <div class="content-body">
          <!-- 路由出口 -->
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <keep-alive :include="cachedTabs">
                <component :is="Component" :key="route.fullPath" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import MenuItem from '@/components/MenuItem.vue'
import { useUserStore } from '@/stores/user'
import { useTabsStore } from '@/stores/tabs'
import TabsView from '@/components/TabsView.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { Clock } from '@element-plus/icons-vue' // 引入时钟图标

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const tabsStore = useTabsStore()

// 需要缓存的组件列表
const cachedTabs = computed(() => tabsStore.cachedTabs)

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 当前路由信息
const currentRoute = computed(() => {
  return route
})

// 菜单数据
const menus = computed(() => {
  // console.log('Layout获取菜单:', userStore.menus)
  return userStore.menus
})

// 是否有菜单显示
const hasMenu = computed(() => {
  return menus.value && menus.value.length > 0
})

// 用户昵称
const nickname = computed(() => {
  return userStore.nickname || '用户'
})

const username = computed(() => {
  return userStore.nickname || '用户'
})

const avatar = computed(() => {
  return userStore.avatar
})

// 下拉菜单命令处理
const handleCommand = async (command: string) => {
  if (command === 'logout') {
    await userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
// 监听路由变化，自动添加标签
watch(
  () => route.fullPath,
  () => {
    tabsStore.addTab(route)
  },
  { immediate: true }
)
// 监听路由变化
// watch(() => route.path, (newPath) => {
//   console.log('路由变化:', newPath)
// })

// onMounted(() => {
//   console.log('布局组件加载完成')
//   console.log('当前菜单:', menus.value)
//   console.log('当前路由:', route.path)
//   console.log('用户是否登录:', userStore.isLoggedIn)
// })
// 当前时间显示（包含星期）
const currentTime = ref('')
let timer: NodeJS.Timer

// 格式化日期时间：YYYY年MM月DD日 星期X HH:MM:SS
const formatDateTime = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekday = weekdays[date.getDay()]
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}年${month}月${day}日 ${weekday} ${hours}:${minutes}:${seconds}`
}

const updateTime = () => {
  currentTime.value = formatDateTime(new Date())
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  tabsStore.closeAllTabs()
  // 3. 如果当前不在首页，则跳转到首页
  if (route.path !== '/') {
    router.push('/')
  }
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
/* ===== 布局容器 - 纯浅色渐变背景（无动画、无光斑） ===== */
.layout-container {
  height: 100vh;
  overflow: hidden; /* 禁止浏览器滚动条，所有滚动在内部处理 */
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #eef2f6, #d9e2ef, #f0f4fa, #e6ecf5);
  color: #1e2b3a;
}

/* ===== 顶部导航栏 ===== */
.header {
  height: 64px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* Logo */
.header-left .logo h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #7b9cff, #b08cff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}

/* 中间区域（时间显示） */
.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.time-display {
  font-size: 16px;
  color: #1e2b3a;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 20px;
  border-radius: 40px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.time-display:hover {
  background: #ffffff;
  border-color: #7b9cff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(123, 156, 255, 0.2);
}

/* 右侧用户信息 */
.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 10px;
  padding: 4px 12px 4px 8px;
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.9);
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.user-info:hover {
  background: #ffffff;
  border-color: #b08cff;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #1e2b3a;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 头像 */
:deep(.el-avatar) {
  background: linear-gradient(135deg, #7b9cff, #b08cff);
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: white;
  font-weight: 600;
}

/* 下拉菜单图标 */
.user-info .el-icon {
  color: #7f8c8d;
  font-size: 14px;
  transition: transform 0.2s;
}

.user-info:hover .el-icon {
  transform: rotate(180deg);
  color: #b08cff;
}

/* ===== 主容器 ===== */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden; /* 防止内部溢出产生浏览器滚动条 */
}

/* ===== 左侧菜单 ===== */
.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.8);
  overflow-y: auto; /* 菜单过多时内部滚动 */
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.02);
}

/* Element Plus 菜单覆盖 - 浅色主题 */
:deep(.el-menu) {
  border-right: none !important;
  background: transparent !important;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  color: #5a6a7a !important;
  background: transparent !important;
  border-left: 3px solid transparent;
  transition: all 0.2s;
  margin: 4px 8px;
  border-radius: 8px;
}

:deep(.el-menu-item.is-active) {
  color: #7b9cff !important;
  background: linear-gradient(90deg, rgba(123, 156, 255, 0.1), transparent) !important;
  border-left-color: #7b9cff;
}

:deep(.el-menu-item:hover) {
  color: #1e2b3a !important;
  background: rgba(255, 255, 255, 0.8) !important;
}

:deep(.el-sub-menu__title) {
  color: #5a6a7a !important;
  background: transparent !important;
  height: 50px;
  line-height: 50px;
  border-radius: 8px;
  margin: 4px 8px;
}

:deep(.el-sub-menu__title:hover) {
  color: #1e2b3a !important;
  background: rgba(255, 255, 255, 0.8) !important;
}

:deep(.el-menu--inline) {
  background: rgba(0, 0, 0, 0.02) !important;
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu .el-icon) {
  color: inherit;
}

/* 滚动条美化 - 浅色 */
.sidebar::-webkit-scrollbar {
  width: 6px;
}
.sidebar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

/* ===== 右侧内容区域 ===== */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出产生浏览器滚动条 */
  background: rgba(255, 255, 255, 0.2);
}

/* 标签栏区域（TabsView 样式穿透） */
:deep(.tabs-view) {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8) !important;
  padding: 4px 16px 0;
}

:deep(.tabs-view .el-tabs__header) {
  margin: 0 !important;
  border-bottom: none !important;
}

:deep(.tabs-view .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.tabs-view .el-tabs__item) {
  color: #5a6a7a !important;
  height: 40px;
  line-height: 40px;
  border-radius: 20px 20px 0 0;
  transition: all 0.2s;
}

:deep(.tabs-view .el-tabs__item.is-active) {
  color: #7b9cff !important;
  background: rgba(123, 156, 255, 0.1);
}

:deep(.tabs-view .el-tabs__item:hover) {
  color: #1e2b3a !important;
  background: rgba(255, 255, 255, 0.8);
}

:deep(.tabs-view .el-tabs__active-bar) {
  background: linear-gradient(90deg, #7b9cff, #b08cff);
  height: 3px;
}

/* 内容主体 - 允许内部滚动 */
.content-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto; /* 只有这里可以滚动，不会触发浏览器滚动条 */
  background: transparent;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 隐藏原面包屑 */
.content-header {
  display: none;
}

/* 无菜单时的内容区域 */
.content.no-sidebar {
  margin-left: 0;
}

/* ===== 响应式调整 ===== */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }

  .header-left .logo h2 {
    font-size: 18px;
  }

  .time-display {
    font-size: 14px;
    padding: 6px 12px;
  }

  .username {
    max-width: 80px;
  }

  .sidebar {
    width: 200px;
  }
}

@media (max-width: 576px) {
  .username {
    display: none;
  }

  .time-display {
    display: none;
  }
}
</style>
