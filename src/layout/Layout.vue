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
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
}

.header-left .logo h2 {
  margin: 0;
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.username {
  font-size: 14px;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background-color: #304156;
  overflow-y: auto;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content.no-sidebar {
  margin-left: 0;
}

.content-header {
  height: 50px;
  background: white;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  display: flex;
  align-items: center;
}



.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.content-header {
  display: none; /* 如果不需要面包屑，直接隐藏；若需要，可保留并调整高度 */
}
.content-body {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  background: white;
}
.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
.current-time {
  font-size: 14px;
  color: #666;
}
</style>
