<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-icon">
        <el-icon size="120"><CircleCloseFilled /></el-icon>
      </div>
      <h1 class="error-title">404</h1>
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

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}

// 返回首页
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 600px;
  padding: 40px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease;
}

.error-icon {
  margin-bottom: 20px;
}

.error-icon :deep(svg) {
  color: #f56c6c;
  opacity: 0.8;
}

.error-title {
  font-size: 80px;
  font-weight: 700;
  color: #f56c6c;
  margin: 0 0 10px;
  line-height: 1;
}

.error-subtitle {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px;
}

.error-description {
  font-size: 16px;
  color: #666;
  margin: 0 0 30px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.error-tips {
  text-align: left;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.error-tips p {
  font-weight: 600;
  color: #333;
  margin: 0 0 10px;
}

.error-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.error-tips li {
  margin-bottom: 8px;
}

.error-tips li:last-child {
  margin-bottom: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-content {
    padding: 30px 20px;
  }

  .error-title {
    font-size: 60px;
  }

  .error-subtitle {
    font-size: 20px;
  }

  .error-actions {
    flex-direction: column;
  }

  .error-actions .el-button {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>
