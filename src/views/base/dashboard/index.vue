<!-- src/views/base/dashboard/index.vue -->
<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">系统监控仪表盘</h1>
        <p class="page-subtitle">实时监控系统运行状态与性能指标</p>
      </div>
      <div class="page-header-actions">
        <span class="auto-refresh-label">自动刷新</span>
        <el-switch v-model="autoRefresh" size="small" @change="onAutoRefreshToggle" />
        <el-button size="small" @click="refreshData" :loading="healthLoading">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- 顶部：整体健康分数 + 概览卡片 -->
    <div class="top-section">
      <!-- 整体健康分数环形图 -->
      <div class="health-score-card">
        <div class="score-ring">
          <svg viewBox="0 0 100 100" class="ring-svg">
            <circle cx="50" cy="50" r="42" fill="none"
              stroke="var(--app-bg)" stroke-width="8" />
            <circle cx="50" cy="50" r="42" fill="none"
              :stroke="scoreColor"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="scoreOffset"
              class="ring-arc" />
          </svg>
          <div class="score-text">
            <span class="score-value" :style="{ color: scoreColor }">{{ healthScore }}%</span>
            <span class="score-label">健康度</span>
          </div>
        </div>
        <div class="score-summary">
          <span class="summary-up">{{ upCount }} 正常</span>
          <span v-if="warnCount" class="summary-warn">{{ warnCount }} 警告</span>
          <span v-if="downCount" class="summary-down">{{ downCount }} 异常</span>
        </div>
      </div>

      <!-- 概览卡片 -->
      <div class="overview-cards">
        <el-card class="stat-card" shadow="never">
          <div class="stat-icon status-bg"><el-icon :size="22"><CircleCheckFilled /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ healthData.status || '--' }}</span>
            <span class="stat-label">应用状态</span>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="never">
          <div class="stat-icon uptime-bg"><el-icon :size="22"><Clock /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value mono">{{ systemInfo.upTime || '--' }}</span>
            <span class="stat-label">运行时间</span>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="never">
          <div class="stat-icon version-bg"><el-icon :size="22"><Monitor /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value mono">v{{ systemInfo.version || '1.0.0' }}</span>
            <span class="stat-label">系统版本</span>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 核心服务 -->
    <div class="section">
      <div class="section-header"><h3>核心服务</h3></div>
      <div class="health-grid">
        <!-- 应用服务 -->
        <HealthCard icon="SetUp" label="应用服务" :item="appHealth">
          <template #details>
            <div class="detail-row"><span>应用名称</span><span>{{ healthData.application || '--' }}</span></div>
            <div class="detail-row"><span>版本</span><span class="mono">v{{ healthData.version || '--' }}</span></div>
            <div class="detail-row"><span>检测时间</span><span class="mono">{{ formatTimestamp(healthData.timestamp) }}</span></div>
          </template>
        </HealthCard>

        <!-- 数据库 -->
        <HealthCard icon="Coin" label="数据库" :item="healthData.database">
          <template #details>
            <div class="detail-row"><span>MySQL 版本</span><span class="mono">{{ healthData.database?.details?.version || '--' }}</span></div>
            <div class="detail-row"><span>用户数</span><span class="mono">{{ healthData.database?.details?.userCount || '--' }}</span></div>
            <div class="detail-row"><span>响应时间</span><RespTime :ms="getRespMs(healthData.database)" /></div>
          </template>
        </HealthCard>

        <!-- Redis -->
        <HealthCard icon="Collection" label="Redis 缓存" :item="healthData.redis">
          <template #details>
            <div class="detail-row"><span>PING</span><span class="mono">{{ healthData.redis?.details?.response || '--' }}</span></div>
            <div class="detail-row"><span>连接状态</span><span>{{ healthData.redis?.details?.info || '--' }}</span></div>
            <div class="detail-row"><span>响应时间</span><RespTime :ms="getRespMs(healthData.redis)" /></div>
          </template>
        </HealthCard>

        <!-- RabbitMQ -->
        <HealthCard icon="Connection" label="RabbitMQ" :item="healthData.rabbitmq">
          <template #details>
            <div class="detail-row"><span>地址</span><span class="mono">{{ healthData.rabbitmq?.details?.host }}:{{ healthData.rabbitmq?.details?.port }}</span></div>
            <div class="detail-row"><span>vHost</span><span class="mono">{{ healthData.rabbitmq?.details?.virtualHost || '--' }}</span></div>
            <div class="detail-row"><span>响应时间</span><RespTime :ms="getRespMs(healthData.rabbitmq)" /></div>
          </template>
        </HealthCard>
      </div>
    </div>

    <!-- 系统资源 -->
    <div class="section">
      <div class="section-header"><h3>系统资源</h3></div>
      <div class="health-grid">
        <!-- CPU -->
        <HealthCard icon="Cpu" label="CPU" :item="healthData.cpu">
          <template #details>
            <div class="detail-row"><span>处理器数</span><span class="mono">{{ healthData.cpu?.details?.processors || '--' }}</span></div>
            <div class="detail-row"><span>系统负载</span><span class="mono">{{ healthData.cpu?.details?.loadAverage || '--' }}</span></div>
            <div class="detail-row"><span>单核负载</span><span class="mono">{{ healthData.cpu?.details?.loadPerProcessor || '--' }}</span></div>
          </template>
        </HealthCard>

        <!-- 内存 — 带环形图 -->
        <el-card class="health-item" :class="healthData.memory?.up ? 'healthy' : 'unhealthy'" shadow="never">
          <div class="health-indicator"><span class="health-dot"></span><h4>内存使用</h4></div>
          <el-tag :type="statusTagType(healthData.memory)" size="small" effect="plain">{{ healthData.memory?.status || '未知' }}</el-tag>
          <div class="memory-ring-row">
            <svg viewBox="0 0 80 80" class="mini-ring">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--app-bg)" stroke-width="8" />
              <circle cx="40" cy="40" r="32" fill="none"
                :stroke="memoryUsedPercent > 90 ? 'var(--app-danger)' : memoryUsedPercent > 70 ? 'var(--app-warning)' : 'var(--app-accent)'"
                stroke-width="8" stroke-linecap="round"
                :stroke-dasharray="circumferenceMini"
                :stroke-dashoffset="memoryRingOffset"
                class="mini-ring-arc" />
            </svg>
            <div class="memory-nums">
              <span class="memory-pct">{{ memoryDetails.currentUsage.toFixed(1) }}%</span>
              <span class="memory-used-text">{{ memoryDetails.used }} / {{ memoryDetails.total }}</span>
            </div>
          </div>
          <div class="detail-grid-2col">
            <div class="detail-row"><span>最大堆</span><span class="mono">{{ memoryDetails.max }}</span></div>
            <div class="detail-row"><span>可用</span><span class="mono">{{ memoryDetails.free }}</span></div>
          </div>
        </el-card>

        <!-- 线程 -->
        <HealthCard icon="Operation" label="线程" :item="healthData.threads">
          <template #details>
            <div class="detail-row"><span>活跃线程</span><span class="mono">{{ healthData.threads?.details?.active || '--' }}</span></div>
            <div class="detail-row"><span>峰值线程</span><span class="mono">{{ healthData.threads?.details?.peak || '--' }}</span></div>
            <div class="detail-row"><span>守护线程</span><span class="mono">{{ healthData.threads?.details?.daemon || '--' }}</span></div>
            <div class="detail-row"><span>死锁</span><span class="mono" :class="{ 'text-danger': healthData.threads?.details?.deadlocked > 0 }">{{ healthData.threads?.details?.deadlocked || 0 }}</span></div>
          </template>
        </HealthCard>

        <!-- 磁盘 -->
        <HealthCard icon="Files" label="磁盘" :item="healthData.disk">
          <template #details>
            <div v-for="(info, path) in healthData.disk?.details || {}" :key="path" class="disk-item">
              <div class="detail-row"><span class="mono">{{ path }}</span><span class="mono">{{ info.usedPercent }}</span></div>
              <div class="disk-bar"><div class="disk-used" :style="{ width: info.usedPercent || '0%' }"></div></div>
              <div class="detail-row" style="font-size:11px"><span>空闲 {{ info.free }}</span><span>总计 {{ info.total }}</span></div>
            </div>
          </template>
        </HealthCard>
      </div>
    </div>

    <!-- JVM 运行时 -->
    <div class="section">
      <div class="section-header"><h3>JVM 运行时</h3></div>
      <div class="health-grid cols-2">
        <!-- GC -->
        <HealthCard icon="Delete" label="垃圾回收" :item="healthData.gc">
          <template #details>
            <div class="detail-row"><span>总回收次数</span><span class="mono">{{ healthData.gc?.details?.totalCollections || '--' }}</span></div>
            <div class="detail-row"><span>总耗时</span><span class="mono">{{ healthData.gc?.details?.totalTime || '--' }}</span></div>
          </template>
        </HealthCard>

        <!-- 连接池 -->
        <HealthCard icon="Link" label="连接池 HikariCP" :item="healthData.connectionPool">
          <template #details>
            <div class="detail-row"><span>活跃 / 空闲</span><span class="mono">{{ healthData.connectionPool?.details?.active || 0 }} / {{ healthData.connectionPool?.details?.idle || 0 }}</span></div>
            <div class="detail-row"><span>总连接数</span><span class="mono">{{ healthData.connectionPool?.details?.total || 0 }}</span></div>
            <div class="detail-row"><span>等待线程</span><span class="mono" :class="{ 'text-warning': healthData.connectionPool?.details?.pending > 0 }">{{ healthData.connectionPool?.details?.pending || 0 }}</span></div>
            <div class="detail-row"><span>最大连接数</span><span class="mono">{{ healthData.connectionPool?.details?.maxPoolSize || '--' }}</span></div>
          </template>
        </HealthCard>
      </div>
    </div>

    <!-- 系统环境 + 内存详情 -->
    <div class="section">
      <div class="section-header"><h3>系统环境</h3></div>
      <div class="env-cards">
        <div class="env-card">
          <el-icon :size="18"><Monitor /></el-icon>
          <span class="env-label">操作系统</span>
          <span class="env-value">{{ systemInfo.osName || '--' }}</span>
        </div>
        <div class="env-card">
          <el-icon :size="18"><Cpu /></el-icon>
          <span class="env-label">系统架构</span>
          <span class="env-value mono">{{ systemInfo.osArch || '--' }}</span>
        </div>
        <div class="env-card">
          <el-icon :size="18"><SetUp /></el-icon>
          <span class="env-label">Java 版本</span>
          <span class="env-value mono">{{ systemInfo.javaVersion || '--' }}</span>
        </div>
        <div class="env-card">
          <el-icon :size="18"><FolderOpened /></el-icon>
          <span class="env-label">用户目录</span>
          <span class="env-value mono">{{ systemInfo.userHome || '--' }}</span>
        </div>
        <div class="env-card">
          <el-icon :size="18"><Clock /></el-icon>
          <span class="env-label">数据时间</span>
          <span class="env-value mono">{{ formatTimestamp(systemInfo.timestamp) }}</span>
        </div>
        <div class="env-card">
          <el-icon :size="18"><Refresh /></el-icon>
          <span class="env-label">最后更新</span>
          <span class="env-value mono">{{ lastUpdateTime || '--' }}</span>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="footer">
      <p>© 2025 {{ systemInfo.appName || 'MOK 系统监控' }} · v{{ systemInfo.version || '1.0.0' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, h, watch } from 'vue'
import { ElMessage, ElTag } from 'element-plus'
import {
  Monitor, Clock, Cpu, Collection, SetUp, Refresh, CircleCheckFilled,
  Coin, Connection, Files, FolderOpened, Delete, Link, Operation
} from '@element-plus/icons-vue'
import { sysInfoApi } from "@/api"

// ────────────── 子组件：健康卡片 ──────────────
const RespTime = (props: { ms: number }) => {
  if (!props.ms) return h('span', { class: 'mono' }, '--')
  const color = props.ms < 50 ? 'var(--app-success)' : props.ms < 200 ? 'var(--app-warning)' : 'var(--app-danger)'
  return h('span', { class: 'mono', style: { color, fontWeight: 600 } }, props.ms + 'ms')
}
RespTime.props = { ms: Number }

const HealthCard = (props: any, { slots }: any) => {
  const item = props.item || {}
  const up = item.up !== false
  const status = item.status || '未知'

  return h('el-card', {
    class: ['health-item', up ? 'healthy' : 'unhealthy'],
    shadow: 'never'
  }, {
    default: () => [
      h('div', { class: 'health-indicator' }, [
        h('span', { class: 'health-dot' }),
        h('h4', {}, props.label)
      ]),
      h('el-tag', {
        type: up ? (status === 'WARNING' ? 'warning' : 'success') : 'danger',
        size: 'small',
        effect: 'plain'
      }, () => status),
      slots.details ? slots.details() : null
    ]
  })
}
HealthCard.props = { icon: String, label: String, item: Object }

// ────────────── 数据 ──────────────
const systemInfo = reactive<any>({
  appName: '', userHome: '', osArch: '', upTime: '', version: '', timestamp: 0, javaVersion: '', osName: ''
})
const healthData = reactive<any>({
  database: {}, redis: {}, memory: {}, rabbitmq: {}, cpu: {}, threads: {}, gc: {}, disk: {}, connectionPool: {},
  application: '', version: '', timestamp: 0, status: ''
})
const healthLoading = ref(false)
const lastUpdateTime = ref('')

// 自动刷新
const AUTO_KEY = 'dashboard_auto_refresh'
const autoRefresh = ref(localStorage.getItem(AUTO_KEY) === 'true')
let refreshTimer: ReturnType<typeof setInterval> | null = null
const REFRESH_INTERVAL = 30_000

const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshTimer = setInterval(fetchHealthData, REFRESH_INTERVAL)
}
const stopAutoRefresh = () => {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
}
const onAutoRefreshToggle = (val: boolean) => {
  localStorage.setItem(AUTO_KEY, String(val))
  if (val) startAutoRefresh()
  else stopAutoRefresh()
}
const refreshData = () => {
  fetchHealthData()
  // 手动刷新后重置计时器，避免刚刷完又自动刷
  if (autoRefresh.value) startAutoRefresh()
}

// ────────────── SVG 环形图常量 ──────────────
const circumference = 2 * Math.PI * 42
const circumferenceMini = 2 * Math.PI * 32

// ────────────── 计算属性 ──────────────
const allComponents = computed(() => [
  healthData.database, healthData.redis, healthData.memory, healthData.rabbitmq,
  healthData.cpu, healthData.threads, healthData.gc, healthData.disk, healthData.connectionPool
])

const upCount = computed(() => allComponents.value.filter(c => c?.status === 'UP').length)
const warnCount = computed(() => allComponents.value.filter(c => c?.status === 'WARNING').length)
const downCount = computed(() => allComponents.value.filter(c => c && c.status && c.status !== 'UP' && c.status !== 'WARNING').length)

const totalChecked = computed(() => allComponents.value.filter(c => c?.status).length)

const healthScore = computed(() => {
  if (totalChecked.value === 0) return 0
  const score = ((upCount.value * 100 + warnCount.value * 70) / (totalChecked.value * 100)) * 100
  return Math.round(score)
})

const scoreColor = computed(() => {
  if (healthScore.value >= 90) return 'var(--app-success)'
  if (healthScore.value >= 70) return 'var(--app-warning)'
  return 'var(--app-danger)'
})

const scoreOffset = computed(() => {
  return circumference - (healthScore.value / 100) * circumference
})

const appHealth = computed(() => ({
  status: healthData.status || '未知',
  up: healthData.status === 'UP',
  details: {}
}))

const memoryDetails = computed(() => {
  const d = healthData.memory?.details
  if (!d) return { used: '--', total: '--', free: '--', max: '--', currentUsage: 0 }
  return {
    used: d.used || '--',
    total: d.total || '--',
    free: d.free || '--',
    max: d.max || '--',
    currentUsage: parseFloat(d.usedPercentage) || 0
  }
})

const memoryUsedPercent = computed(() => memoryDetails.value.currentUsage)
const memoryRingOffset = computed(() => circumferenceMini - (memoryUsedPercent.value / 100) * circumferenceMini)

const statusTagType = (item: any) => {
  if (!item?.status) return 'info'
  if (item.status === 'UP') return 'success'
  if (item.status === 'WARNING') return 'warning'
  return 'danger'
}

// ────────────── 工具函数 ──────────────
const getRespMs = (item: any): number => {
  const rt = item?.details?.responseTime
  if (!rt) return 0
  const match = String(rt).match(/([\d.]+)/)
  return match?.[1] ? parseFloat(match[1]) : 0
}

const formatTimestamp = (ts: number) => {
  if (!ts) return '--'
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })
}

// ────────────── API 调用 ──────────────
const fetchSystemInfo = async () => {
  try {
    const res = await sysInfoApi.info()
    if (res.code === 200 && res.data) Object.assign(systemInfo, res.data)
  } catch { /* silent */ }
}

const fetchHealthData = async () => {
  try {
    healthLoading.value = true
    const res = await sysInfoApi.health()
    if (res.code === 200 && res.data) {
      Object.assign(healthData, res.data)
      lastUpdateTime.value = formatTimestamp(Date.now())
    }
  } catch { /* silent */ }
  finally { healthLoading.value = false }
}

onMounted(() => {
  fetchSystemInfo()
  fetchHealthData()
  if (autoRefresh.value) startAutoRefresh()
})
onBeforeUnmount(stopAutoRefresh)
</script>

<style scoped>
/* ===================================================================
   Dashboard — "Precision Console"
   整体健康分数环形图 + 9组件健康检查 + 资源监控
   样式优化：呼吸灯签名元素 + 微妙的卡片层次 + 响应式网格
   =================================================================== */

.dashboard-container {
  padding: 24px 28px;
  background:
    radial-gradient(ellipse 50% 30% at 50% 0%, rgba(59,89,152,0.03) 0%, transparent 60%),
    var(--app-bg);
  min-height: 100%;
}

/* ========================= 页面标题 ========================= */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
}
.page-header-left { flex: 1; }
.page-title {
  font-size: 21px; font-weight: 700; color: var(--app-text);
  display: flex; align-items: center; gap: 10px;
}
.page-title::before {
  content: ''; display: inline-block; width: 4px; height: 20px;
  background: var(--app-accent); border-radius: 2px;
}
.page-subtitle { font-size: 12px; color: var(--app-text-muted); margin-top: 4px; margin-left: 14px; }

.page-header-actions {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.auto-refresh-label {
  font-size: 12px; color: var(--app-text-muted); user-select: none;
}

/* ========================= 顶部 ========================= */
.top-section {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
  align-items: stretch;
}

/* ---- 健康分数卡 ---- */
.health-score-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: var(--app-bg-surface); border-radius: var(--radius-lg);
  border: 1px solid var(--app-border); padding: 16px 24px; min-width: 150px;
  box-shadow: var(--shadow-sm);
}
.score-ring { position: relative; width: 90px; height: 90px; margin-bottom: 6px; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-arc { transition: stroke-dashoffset 0.8s ease, stroke 0.6s ease; }
.score-text {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.score-value { font-size: 22px; font-weight: 700; font-family: var(--font-mono); line-height: 1; }
.score-label { font-size: 10px; color: var(--app-text-muted); margin-top: 2px; letter-spacing: 1px; }
.score-summary { display: flex; gap: 10px; font-size: 11px; }
.summary-up { color: var(--app-success); font-weight: 500; }
.summary-warn { color: var(--app-warning); font-weight: 500; }
.summary-down { color: var(--app-danger); font-weight: 500; }

/* ---- 概览卡片 ---- */
.overview-cards { flex: 1; display: flex; gap: 14px; }
.stat-card {
  flex: 1; border-radius: var(--radius-lg) !important;
  border: 1px solid var(--app-border) !important;
  box-shadow: var(--shadow-sm) !important;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.stat-card:hover {
  box-shadow: var(--shadow-md) !important;
  transform: translateY(-1px);
}
.stat-card :deep(.el-card__body) {
  display: flex; align-items: center; gap: 12px; padding: 14px 18px !important;
}
.stat-icon {
  width: 40px; height: 40px; border-radius: var(--radius); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.status-bg  { background: linear-gradient(135deg, rgba(22,163,74,0.12), rgba(22,163,74,0.05)); color: var(--app-success); }
.uptime-bg { background: linear-gradient(135deg, rgba(59,89,152,0.12), rgba(59,89,152,0.05)); color: var(--app-accent); }
.version-bg{ background: linear-gradient(135deg, rgba(217,119,6,0.12), rgba(217,119,6,0.05)); color: var(--app-warning); }
.stat-info { display: flex; flex-direction: column; gap: 2px; }
.stat-value { font-size: 16px; font-weight: 600; color: var(--app-text); }
.stat-label { font-size: 11px; color: var(--app-text-muted); letter-spacing: 0.3px; }

/* ========================= 分区 ========================= */
.section { margin-bottom: 22px; }
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px; padding-bottom: 10px;
  border-bottom: 1px solid var(--app-border);
}
.section-header h3 {
  font-size: 14px; font-weight: 600; color: var(--app-text-secondary);
  display: flex; align-items: center; gap: 8px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.section-header h3::before {
  content: ''; display: inline-block; width: 3px; height: 14px;
  background: var(--app-accent); border-radius: 2px;
}

/* ========================= Health Grid ========================= */
.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
  gap: 14px;
}
.health-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }

/* ---- Health Item 卡片 ---- */
.health-item {
  position: relative;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--app-bg-surface);
  border: 1px solid var(--app-border);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  overflow: hidden;
}
/* 卡片顶部细微的强调色条 */
.health-item::before {
  content: ''; position: absolute; top: 0; left: 12px; right: 12px;
  height: 2px; border-radius: 0 0 2px 2px;
  transition: opacity 0.2s ease;
  opacity: 0;
}
.health-item.healthy::before { background: var(--app-success); opacity: 0.35; }
.health-item.unhealthy::before { background: var(--app-danger); opacity: 0.6; }
.health-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  border-color: #cbd5e1;
}

/* ---- 标题行 ---- */
.health-indicator {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.health-indicator h4 {
  font-size: 14px; font-weight: 600; color: var(--app-text); margin: 0;
}

/* ---- 呼吸灯 (签名元素) ---- */
.health-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.healthy .health-dot {
  background: var(--app-success);
  box-shadow: 0 0 0 0 rgba(22,163,74,0.5);
  animation: breathe 3s ease-in-out infinite;
}
.unhealthy .health-dot {
  background: var(--app-danger);
  box-shadow: 0 0 0 0 rgba(220,38,38,0.5);
  animation: breatheDanger 1.2s ease-in-out infinite;
}
@keyframes breathe {
  0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.4); }
  50%     { box-shadow: 0 0 0 6px rgba(22,163,74,0); }
}
@keyframes breatheDanger {
  0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
  50%     { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
}

/* ---- 卡片内容 ---- */
.health-item :deep(.el-tag) {
  margin-bottom: 10px;
  font-weight: 500;
}
.detail-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; padding: 5px 0;
  border-bottom: 1px solid rgba(0,0,0,0.03);
}
.detail-row:last-child { border-bottom: none; }
.detail-row span:first-child { color: var(--app-text-muted); }
.detail-row span:last-child { color: var(--app-text); font-weight: 500; }
.detail-grid-2col {
  display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; margin-top: 6px;
}

/* ---- 磁盘 ---- */
.disk-item { margin-top: 8px; }
.disk-item:first-child { margin-top: 0; }
.disk-bar {
  height: 6px; background: var(--app-bg); border-radius: 3px;
  margin: 5px 0; overflow: hidden;
}
.disk-used {
  height: 100%; border-radius: 3px; transition: width 0.8s ease;
  background: linear-gradient(90deg, var(--app-accent), var(--app-accent-hover));
}

/* ---- 内存环形图 ---- */
.memory-ring-row {
  display: flex; align-items: center; gap: 16px; margin: 12px 0 10px;
}
.mini-ring { width: 80px; height: 80px; flex-shrink: 0; transform: rotate(-90deg); }
.mini-ring-arc { transition: stroke-dashoffset 0.8s ease, stroke 0.6s ease; }
.memory-nums { display: flex; flex-direction: column; }
.memory-pct {
  font-size: 24px; font-weight: 700; font-family: var(--font-mono);
  color: var(--app-accent); line-height: 1;
}
.memory-used-text {
  font-size: 12px; color: var(--app-text-muted); font-family: var(--font-mono); margin-top: 4px;
}

/* ========================= 系统环境 ========================= */
.env-cards {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px;
}
.env-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 20px 14px;
  background: var(--app-bg-surface); border-radius: var(--radius);
  border: 1px solid var(--app-border);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.env-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.env-card .el-icon {
  color: var(--app-accent); opacity: 0.7;
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  background: var(--app-accent-light); border-radius: 8px; padding: 7px;
}
.env-label {
  font-size: 10px; color: var(--app-text-muted);
  text-transform: uppercase; letter-spacing: 0.6px;
}
.env-value {
  font-size: 12px; font-weight: 600; color: var(--app-text);
  word-break: break-all; text-align: center; line-height: 1.4;
}

/* ========================= 工具类 ========================= */
.mono { font-family: var(--font-mono); font-size: 12px; }
.text-danger  { color: var(--app-danger) !important; }
.text-warning { color: var(--app-warning) !important; }

/* ========================= 页脚 ========================= */
.footer {
  text-align: center; padding: 14px 0 0;
  color: var(--app-text-muted); font-size: 11px;
  border-top: 1px solid var(--app-border); margin-top: 8px;
}
.footer p { margin: 2px 0; }

/* ========================= 响应式 ========================= */
@media (max-width: 992px) {
  .top-section { flex-direction: column; }
  .health-score-card { min-width: auto; }
  .health-grid.cols-2 { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .dashboard-container { padding: 16px; }
  .overview-cards { flex-direction: column; }
  .health-grid { grid-template-columns: 1fr; }
  .env-cards { grid-template-columns: repeat(2, 1fr); }
}
</style>
