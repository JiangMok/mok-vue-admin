<!-- src/views/base/welcome/index.vue -->
<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">系统监控仪表盘</h1>
      <p class="page-subtitle">实时监控系统运行状态与性能指标</p>
    </div>

    <!-- 系统状态概览 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <!-- 应用状态 -->
        <el-col :xs="24" :sm="8">
          <el-card class="overview-card status-card">
            <div class="card-content">
              <div class="status-icon">
                <el-icon :size="40" color="#409eff">
                  <Tools />
                </el-icon>
              </div>
              <div class="status-info">
                <h3>应用状态</h3>
                <div class="status-value">
                  <el-tag type="success" size="large" effect="dark">运行正常</el-tag>
                </div>
                <p class="status-desc">{{ systemInfo.appName }}</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 运行时间 -->
        <el-col :xs="24" :sm="8">
          <el-card class="overview-card uptime-card">
            <div class="card-content">
              <div class="status-icon">
                <el-icon :size="40" color="#67c23a">
                  <Clock />
                </el-icon>
              </div>
              <div class="status-info">
                <h3>运行时间</h3>
                <div class="status-value uptime-value">{{ systemInfo.upTime || '正在获取...' }}</div>
                <p class="status-desc">系统持续运行时长</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 系统版本 -->
        <el-col :xs="24" :sm="8">
          <el-card class="overview-card version-card">
            <div class="card-content">
              <div class="status-icon">
                <el-icon :size="40" color="#e6a23c">
                  <Monitor />
                </el-icon>
              </div>
              <div class="status-info">
                <h3>系统版本</h3>
                <div class="status-value version-value">v{{ systemInfo.version || '1.0.0' }}</div>
                <p class="status-desc">当前应用版本</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 系统健康检查 -->
    <div class="health-section">
      <el-card class="health-card">
        <template #header>
          <div class="card-header">
            <span>系统健康状态</span>
            <el-button type="primary" size="small" @click="refreshHealth" :loading="healthLoading">
              <el-icon><Refresh /></el-icon> 刷新状态
            </el-button>
          </div>
        </template>

        <div class="health-grid">
          <!-- 数据库状态 -->
          <div class="health-item" :class="healthData.database?.up ? 'healthy' : 'unhealthy'">
            <div class="health-icon">
              <el-icon :size="32">
                <Coin v-if="healthData.database?.up" />
                <Warning v-else />
              </el-icon>
            </div>
            <div class="health-content">
              <h4>数据库</h4>
              <div class="health-status">
                <el-tag :type="healthData.database?.up ? 'success' : 'danger'" size="small">
                  {{ healthData.database?.status || '未知' }}
                </el-tag>
              </div>
              <div class="health-details">
                <div class="detail-item">
                  <span class="detail-label">响应时间：</span>
                  <span class="detail-value">{{ healthData.database?.details?.responseTime || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">用户数：</span>
                  <span class="detail-value">{{ healthData.database?.details?.userCount || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">版本：</span>
                  <span class="detail-value">{{ healthData.database?.details?.version || '--' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 内存状态 -->
          <div class="health-item" :class="healthData.memory?.up ? 'healthy' : 'unhealthy'">
            <div class="health-icon">
              <el-icon :size="32">
                <Cpu v-if="healthData.memory?.up" />
                <Warning v-else />
              </el-icon>
            </div>
            <div class="health-content">
              <h4>内存使用</h4>
              <div class="health-status">
                <el-tag :type="healthData.memory?.up ? 'success' : 'danger'" size="small">
                  {{ healthData.memory?.status || '未知' }}
                </el-tag>
              </div>
              <div class="health-details">
                <div class="detail-item">
                  <span class="detail-label">使用率：</span>
                  <span class="detail-value">{{ healthData.memory?.details?.usedPercentage || '--' }}</span>
                  <el-tooltip placement="top">
                    <template #content>
                      <div style="max-width: 200px; font-size: 12px;">
                        相对于最大堆内存({{ healthData.memory?.details?.max }})的使用率
                      </div>
                    </template>
                    <el-icon style="margin-left: 4px; color: #999;" size="14">
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
                <div class="detail-item">
                  <span class="detail-label">已用内存：</span>
                  <span class="detail-value">{{ healthData.memory?.details?.used || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">可用内存：</span>
                  <span class="detail-value">{{ healthData.memory?.details?.free || '--' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Redis状态 -->
          <div class="health-item" :class="healthData.redis?.up ? 'healthy' : 'unhealthy'">
            <div class="health-icon">
              <el-icon :size="32">
                <Collection v-if="healthData.redis?.up" />
                <Warning v-else />
              </el-icon>
            </div>
            <div class="health-content">
              <h4>Redis缓存</h4>
              <div class="health-status">
                <el-tag :type="healthData.redis?.up ? 'success' : 'danger'" size="small">
                  {{ healthData.redis?.status || '未知' }}
                </el-tag>
              </div>
              <div class="health-details">
                <div class="detail-item">
                  <span class="detail-label">响应时间：</span>
                  <span class="detail-value">{{ healthData.redis?.details?.responseTime || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">连接状态：</span>
                  <span class="detail-value">{{ healthData.redis?.details?.info || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">响应：</span>
                  <span class="detail-value">{{ healthData.redis?.details?.response || '--' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 应用状态 -->
          <div class="health-item" :class="healthData.status === 'UP' ? 'healthy' : 'unhealthy'">
            <div class="health-icon">
              <el-icon :size="32">
                <SetUp v-if="healthData.status === 'UP'" />
                <Warning v-else />
              </el-icon>
            </div>
            <div class="health-content">
              <h4>应用服务</h4>
              <div class="health-status">
                <el-tag :type="healthData.status === 'UP' ? 'success' : 'danger'" size="small">
                  {{ healthData.status || '未知' }}
                </el-tag>
              </div>
              <div class="health-details">
                <div class="detail-item">
                  <span class="detail-label">应用名称：</span>
                  <span class="detail-value">{{ healthData.application || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">版本：</span>
                  <span class="detail-value">v{{ healthData.version || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">检测时间：</span>
                  <span class="detail-value">{{ formatTimestamp(healthData.timestamp) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 系统详细信息 -->
    <div class="details-section">
      <el-card class="details-card">
        <template #header>
          <div class="card-header">
            <span>系统环境信息</span>
          </div>
        </template>

        <div class="details-grid">
          <div class="info-row">
            <span class="info-label">操作系统：</span>
            <span class="info-value">{{ systemInfo.osName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">系统架构：</span>
            <span class="info-value">{{ systemInfo.osArch }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Java版本：</span>
            <span class="info-value">{{ systemInfo.javaVersion }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">用户目录：</span>
            <span class="info-value">{{ systemInfo.userHome }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">数据时间：</span>
            <span class="info-value">{{ formatTimestamp(systemInfo.timestamp) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 内存使用图表 -->
      <el-card class="details-card">
        <template #header>
          <div class="card-header">
            <span>内存使用情况</span>
          </div>
        </template>

        <div class="memory-chart">
          <div class="chart-container" v-if="memoryDetails.used && memoryDetails.total">
            <div class="memory-usage-section">
              <div class="usage-header">
                <span>当前堆内存使用率</span>
                <span class="usage-percent">{{ memoryDetails.currentUsage.toFixed(1) }}%</span>
              </div>
              <div class="memory-bar">
                <div
                  class="memory-used"
                  :style="{ width: memoryDetails.currentUsage + '%' }"
                >
                  <span class="bar-label">{{ memoryDetails.currentUsage.toFixed(1) }}%</span>
                </div>
              </div>
              <div class="usage-description">
                <el-icon><InfoFilled /></el-icon>
                <span>相对于当前堆内存({{ memoryDetails.total }})的使用率</span>
              </div>
            </div>

            <div class="memory-stats">
              <div class="stat-item">
                <div class="stat-label">已用内存</div>
                <div class="stat-value">{{ memoryDetails.used }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">可用内存</div>
                <div class="stat-value">{{ memoryDetails.free }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">当前堆内存</div>
                <div class="stat-value">{{ memoryDetails.total }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">最大堆内存</div>
                <div class="stat-value">{{ memoryDetails.max }}</div>
              </div>
            </div>

            <!-- 使用率对比 -->
            <div class="usage-comparison">
              <div class="comparison-item">
                <div class="comparison-label">相对于最大堆内存</div>
                <div class="comparison-value">{{ memoryDetails.relativeToMax }}</div>
              </div>
              <div class="comparison-item">
                <div class="comparison-label">相对于当前堆内存</div>
                <div class="comparison-value">{{ memoryDetails.currentUsage.toFixed(1) }}%</div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            <el-icon><DataLine /></el-icon>
            <p>等待健康检查数据...</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 页面底部 -->
    <div class="footer">
      <p>最后更新：{{ lastUpdateTime }}</p>
      <p class="copyright">© 2024 {{ systemInfo.appName || '系统监控' }} - v{{ systemInfo.version || '1.0.0' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  Clock,
  Coin,
  Refresh,
  Cpu,
  Collection,
  SetUp,
  Warning,
  DataLine,
  InfoFilled, Tools
} from '@element-plus/icons-vue'
import { sysInfoApi } from "@/api";

// 系统信息
const systemInfo = reactive({
  appName: '',
  userHome: '',
  osArch: '',
  upTime: '',
  version: '',
  timestamp: 0,
  javaVersion: '',
  osName: ''
})

// 健康检查数据
const healthData = reactive({
  database: {
    status: '',
    details: {
      responseTime: '',
      userCount: 0,
      version: '',
      connection: ''
    },
    up: false
  },
  memory: {
    status: '',
    details: {
      total: '',
      usedPercentage: '',
      max: '',
      used: '',
      free: ''
    },
    up: false
  },
  application: '',
  version: '',
  redis: {
    status: '',
    details: {
      info: '',
      response: '',
      responseTime: ''
    },
    up: false
  },
  timestamp: 0,
  status: ''
})

// 加载状态
const systemLoading = ref(false)
const healthLoading = ref(false)

// 最后更新时间
const lastUpdateTime = ref('')

// 计算内存详细信息
const memoryDetails = computed(() => {
  const details = healthData.memory?.details
  if (!details || !details.used || !details.total) {
    return {
      used: '0',
      total: '0',
      free: '0',
      max: '0',
      currentUsage: 0,
      relativeToMax: '0%'
    }
  }

  // 解析内存字符串为统一单位（MB）
  const parseToMB = (valueStr: string): number => {
    if (!valueStr) return 0

    const match = valueStr.match(/^([\d.]+)\s*([KMGT]?B)$/i)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()

    switch (unit) {
      case 'B': return value / (1024 * 1024)
      case 'KB': return value / 1024
      case 'MB': return value
      case 'GB': return value * 1024
      case 'TB': return value * 1024 * 1024
      default: return value
    }
  }

  const usedMB = parseToMB(details.used)
  const totalMB = parseToMB(details.total)
  const maxMB = parseToMB(details.max)

  // 计算两种使用率
  const currentUsage = totalMB > 0 ? (usedMB / totalMB) * 100 : 0
  const relativeToMax = maxMB > 0 ? ((usedMB / maxMB) * 100).toFixed(2) + '%' : '0%'

  return {
    used: details.used,
    total: details.total,
    free: details.free || '0',
    max: details.max || '0',
    currentUsage: currentUsage,
    relativeToMax: relativeToMax,
    usedMB,
    totalMB,
    maxMB
  }
})

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return '--'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 获取系统信息
const fetchSystemInfo = async () => {
  try {
    systemLoading.value = true
    const response = await sysInfoApi.info()

    if (response.code === 200 && response.data) {
      Object.assign(systemInfo, response.data)
    } else {
      ElMessage.error('获取系统信息失败：' + response.msg)
    }
  } catch (error) {
    console.error('获取系统信息失败:', error)
    ElMessage.error('获取系统信息失败，请检查网络连接')
  } finally {
    systemLoading.value = false
  }
}

// 获取健康检查数据
const fetchHealthData = async () => {
  try {
    healthLoading.value = true
    const response = await sysInfoApi.health()

    if (response.code === 200 && response.data) {
      Object.assign(healthData, response.data)
      lastUpdateTime.value = formatTimestamp(Date.now())
    } else {
      ElMessage.error('获取健康检查数据失败：' + response.msg)
    }
  } catch (error) {
    console.error('获取健康检查数据失败:', error)
    ElMessage.error('获取健康检查数据失败，请检查网络连接')
  } finally {
    healthLoading.value = false
  }
}

// 刷新健康检查
const refreshHealth = () => {
  fetchHealthData()
}

// 页面加载时获取数据
onMounted(() => {
  fetchSystemInfo()
  fetchHealthData()

  // // 每60秒自动刷新健康检查
  // setInterval(() => {
  //   fetchHealthData()
  // }, 60000)
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: calc(100vh - 120px);
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
}

/* 概览卡片 */
.overview-section {
  margin-bottom: 24px;
}

.overview-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 16px 0;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: rgba(64, 158, 255, 0.1);
  margin-right: 16px;
}

.uptime-card .status-icon {
  background: rgba(103, 194, 58, 0.1);
}

.version-card .status-icon {
  background: rgba(230, 162, 60, 0.1);
}

.status-info h3 {
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
}

.status-value {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.uptime-value {
  color: #67c23a;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
}

.version-value {
  color: #e6a23c;
}

.status-desc {
  font-size: 14px;
  color: #94a3b8;
}

/* 健康检查 */
.health-section {
  margin-bottom: 24px;
}

.health-card {
  border-radius: 12px;
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.health-item {
  padding: 20px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.health-item.healthy {
  border-left: 4px solid #10b981;
}

.health-item.unhealthy {
  border-left: 4px solid #ef4444;
}

.health-item:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.health-item.healthy .health-icon {
  color: #10b981;
}

.health-item.unhealthy .health-icon {
  color: #ef4444;
}

.health-content {
  margin-top: 12px;
}

.health-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.health-status {
  margin-bottom: 12px;
}

.health-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.detail-label {
  color: #64748b;
}

.detail-value {
  color: #1e293b;
  font-weight: 500;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
}

/* 详细信息 */
.details-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

@media (max-width: 992px) {
  .details-section {
    grid-template-columns: 1fr;
  }
}

.details-card {
  border-radius: 12px;
  border: none;
}

.details-grid {
  display: grid;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #64748b;
  font-size: 14px;
}

.info-value {
  color: #1e293b;
  font-weight: 500;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  text-align: right;
}

/* 内存图表 */
.memory-chart {
  padding: 20px 0;
}

.chart-container {
  max-width: 500px;
  margin: 0 auto;
}

/* 当前堆内存使用率部分 */
.memory-usage-section {
  margin-bottom: 24px;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.usage-header span {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.usage-percent {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.memory-bar {
  height: 28px;
  background: #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 8px;
  position: relative;
}

.memory-used {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 14px;
  transition: width 1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
}

.bar-label {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.usage-description {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.usage-description .el-icon {
  color: #3b82f6;
  font-size: 14px;
}

/* 内存统计信息 */
.memory-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 24px 0;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .memory-stats {
    grid-template-columns: 1fr;
  }
}

.stat-item {
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
}

/* 使用率对比 */
.usage-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

.comparison-item {
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.comparison-item:first-child {
  border-left: 4px solid #10b981;
}

.comparison-item:last-child {
  border-left: 4px solid #3b82f6;
}

.comparison-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.comparison-value {
  font-size: 18px;
  font-weight: 700;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
}

.comparison-item:first-child .comparison-value {
  color: #10b981;
}

.comparison-item:last-child .comparison-value {
  color: #3b82f6;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.no-data .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-data p {
  font-size: 14px;
}

/* 页脚 */
.footer {
  text-align: center;
  padding: 20px 0;
  color: #94a3b8;
  font-size: 14px;
  border-top: 1px solid #e2e8f0;
  margin-top: 20px;
}

.footer p {
  margin: 4px 0;
}

.copyright {
  font-size: 12px;
  color: #cbd5e1;
}
</style>
