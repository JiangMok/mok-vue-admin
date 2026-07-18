<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <el-icon :size="22" color="#5b7fbc"><Monitor /></el-icon>
          <h2>MOK 后台管理</h2>
        </div>
      </div>

      <div class="header-actions">
        <el-tooltip content="刷新当前页面" placement="bottom">
          <div class="action-btn" @click="refreshCurrentPage">
            <el-icon :size="16" :class="{ 'is-spinning': isRefreshing }">
              <RefreshRight />
            </el-icon>
          </div>
        </el-tooltip>
      </div>

      <div class="header-center">
        <div class="time-display" @click="updateTime">
          <el-icon :size="14"><Clock /></el-icon>
          <span>{{ currentTime }}</span>
        </div>
      </div>

      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <div class="user-info">
            <el-avatar :src="avatar" :size="32">
              {{ nickname?.charAt(0) || username?.charAt(0) || 'U' }}
            </el-avatar>
            <span class="username">{{ nickname }}</span>
            <el-icon :size="12"><ArrowDown /></el-icon>
          </div>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="main-container">
      <!-- 左侧菜单 -->
      <aside class="sidebar" v-if="hasMenu">
        <el-menu
          :default-active="activeMenu"
          :router="true"
          background-color="transparent"
          text-color="#94a3b8"
          active-text-color="#e2e8f0"
        >
          <menu-item
            v-for="menu in menus"
            :key="menu.id"
            :menu="menu"
          />
        </el-menu>
      </aside>

      <!-- 右侧内容 -->
      <main class="content" :class="{ 'no-sidebar': !hasMenu }">
        <TabsView />
        <div class="content-body">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <keep-alive :include="cachedTabs">
                <component :is="Component" :key="route.fullPath" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowDown, Clock, Monitor, RefreshRight } from '@element-plus/icons-vue'
import MenuItem from '@/components/MenuItem.vue'
import { useUserStore } from '@/stores/user'
import { useTabsStore } from '@/stores/tabs'
import TabsView from '@/components/TabsView.vue'
import { ref, onMounted, onUnmounted } from 'vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const tabsStore = useTabsStore()

const cachedTabs = computed(() => tabsStore.cachedTabs)
const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)
const menus = computed(() => userStore.menus)
const hasMenu = computed(() => menus.value && menus.value.length > 0)

const nickname = computed(() => userStore.nickname || '用户')
const username = computed(() => userStore.nickname || '用户')
const avatar = computed(() => userStore.avatar)

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    await userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

// 刷新当前页面
const isRefreshing = ref(false)
const refreshCurrentPage = () => {
  const currentRoute = router.currentRoute.value
  // 通过追加 _t 时间戳改变 fullPath，触发 keep-alive 组件重新渲染
  const newQuery = { ...currentRoute.query, _t: Date.now() }
  router.replace({ path: currentRoute.path, query: newQuery })

  // 旋转动画
  isRefreshing.value = true
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}

watch(
  () => route.fullPath,
  () => {
    tabsStore.addTab(route)
  },
  { immediate: true }
)

// 当前时间
const currentTime = ref('')
let timer: ReturnType<typeof setInterval>

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
  if (route.path !== '/') {
    router.push('/')
  }
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
/* ===================================================================
   Layout — "Precision Console"
   深色顶栏+侧边栏 → 高对比度，让内容区成为焦点
   =================================================================== */

.layout-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--app-bg);
  color: var(--app-text);
}

/* ---- Header ---- */
.header {
  height: 56px;
  min-height: 56px;
  background: var(--app-bg-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left .logo h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #e2e8f0;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

/* 顶栏操作按钮 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.06);
}

.action-btn:active {
  transform: scale(0.92);
}

.is-spinning {
  animation: spin 0.6s ease;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* 时间显示 */
.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;
  font-family: var(--font-mono);
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all var(--transition-fast);
  letter-spacing: 0.3px;
}

.time-display:hover {
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.05);
}

/* 用户信息 */
.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px 4px 6px;
  border-radius: 8px;
  transition: all var(--transition-fast);
  color: #cbd5e1;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
}

.username {
  font-size: 13px;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.header .el-avatar) {
  background: var(--app-accent);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}

/* ---- Main Container ---- */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ---- Sidebar ---- */
.sidebar {
  width: 232px;
  min-width: 232px;
  background: var(--app-bg-sidebar);
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
}

/* ---- Menu Overrides ---- */
:deep(.sidebar .el-menu) {
  border-right: none !important;
  background: transparent !important;
  padding: 8px 0;
}

:deep(.sidebar .el-menu-item) {
  height: 44px;
  line-height: 44px;
  color: #94a3b8 !important;
  background: transparent !important;
  margin: 2px 8px;
  border-radius: var(--radius);
  font-size: 14px;
  transition: all var(--transition-fast);
  padding-left: 16px !important;
}

:deep(.sidebar .el-menu-item:hover) {
  color: #cbd5e1 !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

:deep(.sidebar .el-menu-item.is-active) {
  color: #e2e8f0 !important;
  background: rgba(59, 89, 152, 0.25) !important;
  font-weight: 500;
}

:deep(.sidebar .el-sub-menu__title) {
  color: #94a3b8 !important;
  background: transparent !important;
  height: 44px;
  line-height: 44px;
  margin: 2px 8px;
  border-radius: var(--radius);
  font-size: 14px;
  padding-left: 16px !important;
}

:deep(.sidebar .el-sub-menu__title:hover) {
  color: #cbd5e1 !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

:deep(.sidebar .el-sub-menu.is-active > .el-sub-menu__title) {
  color: #e2e8f0 !important;
}

:deep(.sidebar .el-menu--inline) {
  background: rgba(0, 0, 0, 0.15) !important;
  border-radius: 0 0 var(--radius) var(--radius);
}

:deep(.sidebar .el-menu--inline .el-menu-item) {
  padding-left: 40px !important;
}

:deep(.sidebar .el-menu-item .el-icon),
:deep(.sidebar .el-sub-menu .el-icon) {
  color: inherit;
  font-size: 16px;
}

/* Sidebar scrollbar */
.sidebar::-webkit-scrollbar {
  width: 4px;
}
.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}

/* ---- Content Area ---- */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--app-bg);
}

.content.no-sidebar {
  /* full width when no menu */
}

/* ---- Tabs Bar ---- */
:deep(.tabs-container) {
  background: var(--app-bg-surface) !important;
  border-bottom: 1px solid var(--app-border) !important;
  padding: 0 12px;
}

:deep(.tabs-container .el-tabs__header) {
  margin: 0 !important;
  border-bottom: none !important;
}

:deep(.tabs-container .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.tabs-container .el-tabs__item) {
  color: var(--app-text-secondary) !important;
  height: 36px;
  line-height: 36px;
  font-size: 13px;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  transition: all var(--transition-fast);
  border: none !important;
}

:deep(.tabs-container .el-tabs__item.is-active) {
  color: var(--app-accent) !important;
  font-weight: 600;
  background: var(--app-accent-light);
}

:deep(.tabs-container .el-tabs__item:hover) {
  color: var(--app-text) !important;
  background: var(--app-bg-elevated);
}

:deep(.tabs-container .el-tabs__active-bar) {
  background: var(--app-accent);
  height: 2px;
}

/* ---- Content Body ---- */
.content-body {
  flex: 1;
  overflow-y: auto;
  background: var(--app-bg);
}

/* ---- Route Transition ---- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .header {
    padding: 0 12px;
  }

  .header-left .logo h2 {
    font-size: 15px;
  }

  .time-display {
    font-size: 12px;
    padding: 4px 8px;
  }

  .username {
    max-width: 60px;
  }

  .sidebar {
    width: 200px;
    min-width: 200px;
  }
}

@media (max-width: 576px) {
  .username,
  .time-display {
    display: none;
  }
}
</style>
