<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-code mono">404</div>
      <h2 class="error-subtitle">页面不存在</h2>
      <p class="error-description">
        抱歉，您访问的页面不存在或已被移除
      </p>
      <div class="error-actions">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上一页
        </el-button>
        <el-button @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
      </div>
      <div class="error-tips">
        <p>可能的原因：</p>
        <ul>
          <li>页面地址输入错误</li>
          <li>页面已被删除或移动</li>
          <li>您没有访问权限</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { CircleCloseFilled, ArrowLeft, HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}

const goHome = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--app-bg);
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 480px;
  padding: 48px 40px;
  background: var(--app-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--app-border);
  box-shadow: var(--shadow-md);
  animation: fadeIn 0.4s ease;
}

.error-code {
  font-size: 96px;
  font-weight: 800;
  color: var(--app-accent);
  line-height: 1;
  margin-bottom: 8px;
  letter-spacing: -2px;
}

.error-subtitle {
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0 0 12px;
}

.error-description {
  font-size: 14px;
  color: var(--app-text-muted);
  margin: 0 0 28px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}

.error-tips {
  text-align: left;
  background: var(--app-bg-elevated);
  padding: 16px 20px;
  border-radius: var(--radius);
  border-left: 3px solid var(--app-accent);
}

.error-tips p {
  font-weight: 600;
  color: var(--app-text);
  margin: 0 0 8px;
  font-size: 13px;
}

.error-tips ul {
  margin: 0;
  padding-left: 18px;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.error-tips li {
  margin-bottom: 4px;
}

.error-tips li:last-child {
  margin-bottom: 0;
}

.mono {
  font-family: var(--font-mono);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .error-content {
    padding: 32px 24px;
  }

  .error-code {
    font-size: 72px;
  }

  .error-actions {
    flex-direction: column;
  }

  .error-actions .el-button {
    width: 100%;
  }
}
</style>
