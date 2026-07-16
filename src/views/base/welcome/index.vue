<!-- src/views/base/welcome/index.vue -->
<template>
  <div class="welcome-container">
    <div class="welcome-content">
      <div class="welcome-header">
        <el-icon size="64" color="#3b5998" class="welcome-icon">
          <HomeFilled />
        </el-icon>
        <h1 class="welcome-title">欢迎使用 MOK 后台管理系统</h1>
        <p class="welcome-subtitle">请从左侧菜单选择功能模块</p>
      </div>

      <div class="welcome-body">
        <el-row :gutter="24" class="info-cards">
          <el-col :span="8" v-for="card in infoCards" :key="card.title">
            <div class="info-card">
              <div class="card-icon">
                <component :is="card.icon" :size="32" :color="card.color" />
              </div>
              <div class="card-content">
                <h3>{{ card.title }}</h3>
                <p class="card-value mono">{{ card.value }}</p>
                <p class="card-desc">{{ card.desc }}</p>
              </div>
            </div>
          </el-col>
        </el-row>

        <div class="welcome-message">
          <h3>欢迎回来，{{ userName }}！</h3>
          <div class="message-grid">
            <div class="message-item">
              <span class="msg-label">当前时间</span>
              <span class="msg-value mono">{{ currentTime }}</span>
            </div>
            <div class="message-item">
              <span class="msg-label">登录 IP</span>
              <span class="msg-value mono">{{ loginIP }}</span>
            </div>
            <div class="message-item">
              <span class="msg-label">系统版本</span>
              <span class="msg-value">v1.0.0</span>
            </div>
          </div>
        </div>

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

      <div class="welcome-footer">
        <p class="copyright">© 2026 MOK 后台管理系统</p>
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

const currentTime = ref('')
const loginIP = ref('192.168.1.100')

const infoCards = [
  {
    title: '用户总数',
    value: '128',
    desc: '注册用户数',
    icon: UserFilled,
    color: '#3b5998'
  },
  {
    title: '在线用户',
    value: '24',
    desc: '当前在线数',
    icon: User,
    color: '#16a34a'
  },
  {
    title: '待办任务',
    value: '12',
    desc: '未处理任务',
    icon: Bell,
    color: '#d97706'
  }
]

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

const userName = computed(() => {
  return userStore.nickname || userStore.userInfo?.username || '访客'
})

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

const goToLink = (path: string) => {
  router.push(path)
}

onMounted(() => {
  updateTime()
  const timer = setInterval(updateTime, 60000)
  onUnmounted(() => clearInterval(timer))
  loginIP.value = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
})
</script>

<style scoped>
.welcome-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--app-bg);
}

.welcome-content {
  width: 100%;
  max-width: 800px;
  text-align: center;
}

.welcome-header {
  margin-bottom: 40px;
}

.welcome-icon {
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 28px;
  color: var(--app-text);
  margin-bottom: 8px;
  font-weight: 700;
}

.welcome-subtitle {
  font-size: 15px;
  color: var(--app-text-muted);
}

/* Info Cards */
.info-cards {
  margin-bottom: 32px;
}

.info-card {
  background: var(--app-bg-surface);
  border-radius: var(--radius-lg);
  padding: 28px 20px;
  border: 1px solid var(--app-border);
  transition: all var(--transition-fast);
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-icon {
  margin-bottom: 16px;
}

.card-content h3 {
  font-size: 14px;
  color: var(--app-text-muted);
  margin-bottom: 6px;
  font-weight: 500;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--app-text);
  margin-bottom: 4px;
}

.mono {
  font-family: var(--font-mono);
}

.card-desc {
  font-size: 12px;
  color: var(--app-text-muted);
}

/* Welcome Message */
.welcome-message {
  background: var(--app-bg-surface);
  border-radius: var(--radius-lg);
  padding: 24px 32px;
  margin-bottom: 32px;
  border: 1px solid var(--app-border);
}

.welcome-message h3 {
  font-size: 18px;
  color: var(--app-text);
  margin-bottom: 16px;
  font-weight: 600;
}

.message-grid {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg-label {
  font-size: 11px;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.msg-value {
  font-size: 14px;
  color: var(--app-text);
  font-weight: 500;
}

/* Quick Links */
.quick-links {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.link-btn {
  padding: 12px 28px;
  font-size: 14px;
  border-radius: var(--radius);
  min-width: 140px;
}

/* Footer */
.welcome-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--app-border);
}

.copyright {
  font-size: 12px;
  color: var(--app-text-muted);
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 22px;
  }

  .info-card {
    padding: 20px 16px;
    margin-bottom: 12px;
  }

  .card-value {
    font-size: 24px;
  }

  .message-grid {
    flex-direction: column;
    gap: 12px;
  }

  .quick-links {
    flex-direction: column;
    align-items: center;
  }

  .link-btn {
    width: 100%;
    max-width: 280px;
  }
}
</style>
