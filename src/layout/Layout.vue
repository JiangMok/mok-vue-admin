<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left">
        <div class="logo">
          <h2>后台管理系统</h2>
        </div>
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
        <div class="content-header">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentRoute.meta?.title }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <div class="content-body">
          <!-- 路由出口 -->
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
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

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

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

.content-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f0f2f5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
