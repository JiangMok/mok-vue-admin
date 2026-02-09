<!-- src/views/base/welcome/index.vue -->
<template>
  <div class="welcome-container">
    <div class="welcome-content">
      <!-- 欢迎标题 -->
      <div class="welcome-header">
        <el-icon size="80" color="#409eff" class="welcome-icon">
          <HomeFilled />
        </el-icon>
        <h1 class="welcome-title">欢迎使用后台管理系统</h1>
        <p class="welcome-subtitle">Welcome to Background Management System</p>
      </div>

      <!-- 核心信息展示 -->
      <div class="welcome-body">
        <el-row :gutter="30" class="info-cards">
          <el-col :span="8" v-for="card in infoCards" :key="card.title">
            <div class="info-card">
              <div class="card-icon">
                <component :is="card.icon" :size="40" :color="card.color" />
              </div>
              <div class="card-content">
                <h3>{{ card.title }}</h3>
                <p class="card-value">{{ card.value }}</p>
                <p class="card-desc">{{ card.desc }}</p>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 欢迎信息 -->
        <div class="welcome-message">
          <h3>欢迎回来，{{ userName }}！</h3>
          <p>当前时间：{{ currentTime }}</p>
          <p>登录IP：{{ loginIP }}</p>
          <p>系统版本：v1.0.0</p>
        </div>

        <!-- 快速入口 -->
        <div class="quick-links">
          <el-button
            v-for="link in quickLinks"
            :key="link.label"
            :type="link.type"
            :icon="link.icon"
            @click="goToLink(link.path)"
            size="large"
            class="link-btn"
          >
            {{ link.label }}
          </el-button>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="welcome-footer">
        <p>请从左侧菜单选择功能模块开始使用</p>
        <p class="copyright">© 2026 后台管理系统</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  HomeFilled,
  UserFilled,
  Lock,
  User,
  Bell
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 当前时间
const currentTime = ref('')
// 登录IP
const loginIP = ref('192.168.1.100')

// 信息卡片数据
const infoCards = [
  {
    title: '用户总数',
    value: '128',
    desc: '注册用户数',
    icon: UserFilled,
    color: '#409eff'
  },
  {
    title: '在线用户',
    value: '24',
    desc: '当前在线数',
    icon: User,
    color: '#67c23a'
  },
  {
    title: '待办任务',
    value: '12',
    desc: '未处理任务',
    icon: Bell,
    color: '#e6a23c'
  }
]

// 快速链接
const quickLinks = [
  {
    label: '用户管理',
    icon: UserFilled,
    type: 'primary',
    path: '/system/user'
  },
  {
    label: '角色管理',
    icon: User,
    type: 'success',
    path: '/system/role'
  },
  {
    label: '权限管理',
    icon: Lock,
    type: 'warning',
    path: '/system/permission'
  }
]

// 获取用户名称
const userName = computed(() => {
  return userStore.nickname || userStore.userInfo?.username || '尊敬的访客'
})

// 更新时间函数
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 跳转函数
const goToLink = (path: string) => {
  router.push(path)
}

// 生命周期钩子
onMounted(() => {
  updateTime()
  // 每分钟更新一次时间
  const timer = setInterval(updateTime, 60000)
  onUnmounted(() => clearInterval(timer))

  // 模拟获取IP
  loginIP.value = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
})
</script>

<style scoped>
.welcome-container {
  height: calc(100vh - 140px); /* 减去顶部导航和面包屑的高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  overflow: hidden; /* 禁止滚动 */
}

.welcome-content {
  width: 100%;
  max-width: 1000px;
  text-align: center;
}

.welcome-header {
  margin-bottom: 50px;
}

.welcome-icon {
  margin-bottom: 20px;
}

.welcome-title {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
}

.welcome-subtitle {
  font-size: 18px;
  color: #666;
  margin-bottom: 0;
}

.welcome-body {
  margin-bottom: 40px;
}

/* 信息卡片 */
.info-cards {
  margin-bottom: 50px;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 30px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
}

.card-icon {
  margin-bottom: 20px;
}

.card-content h3 {
  font-size: 18px;
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.card-value {
  font-size: 36px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.card-desc {
  font-size: 14px;
  color: #999;
}

/* 欢迎信息 */
.welcome-message {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.welcome-message h3 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.welcome-message p {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
}

.welcome-message p:last-child {
  margin-bottom: 0;
}

/* 快速链接 */
.quick-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.link-btn {
  padding: 15px 30px;
  font-size: 16px;
  border-radius: 10px;
  min-width: 150px;
}

/* 底部 */
.welcome-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.welcome-footer p {
  color: #999;
  font-size: 14px;
  margin-bottom: 5px;
}

.welcome-footer .copyright {
  font-size: 12px;
  color: #bbb;
  margin-top: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-container {
    height: calc(100vh - 120px);
    padding: 15px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .welcome-subtitle {
    font-size: 16px;
  }

  .info-cards {
    margin-bottom: 30px;
  }

  .info-card {
    padding: 20px 15px;
    margin-bottom: 15px;
  }

  .card-value {
    font-size: 28px;
  }

  .welcome-message {
    padding: 20px;
  }

  .welcome-message h3 {
    font-size: 20px;
  }

  .quick-links {
    flex-direction: column;
    align-items: center;
  }

  .link-btn {
    width: 100%;
    max-width: 300px;
  }
}

/* 确保内容不超出容器 */
.welcome-content,
.welcome-header,
.welcome-body,
.welcome-footer {
  max-width: 100%;
  overflow: hidden;
}
</style>
