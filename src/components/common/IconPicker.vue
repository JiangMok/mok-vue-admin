<template>
  <div class="icon-picker">
    <el-popover
      placement="bottom-start"
      :width="640"
      trigger="click"
      :show-arrow="false"
      popper-class="icon-picker-popper"
    >
      <!-- 触发器：显示当前选中图标 + 名称 -->
      <template #reference>
        <div class="icon-picker-trigger" tabindex="0">
          <span v-if="!modelValue" class="icon-picker-placeholder">
            <el-icon :size="16"><Search /></el-icon>
            点击选择图标
          </span>
          <template v-else>
            <el-icon :size="18" class="icon-picker-preview-icon">
              <component :is="selectedComponent" />
            </el-icon>
            <span class="icon-picker-name">{{ modelValue }}</span>
            <el-icon
              class="icon-picker-clear"
              :size="14"
              @click.stop="clearIcon"
            >
              <CircleClose />
            </el-icon>
          </template>
        </div>
      </template>

      <!-- 弹出面板 -->
      <div class="icon-picker-panel">
        <el-input
          v-model="searchText"
          placeholder="输入关键字筛选图标..."
          clearable
          size="small"
          class="icon-picker-search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="icon-picker-grid">
          <div
            v-for="entry in filteredIcons"
            :key="entry.key"
            class="icon-picker-item"
            :class="{ active: modelValue === entry.key }"
            :title="entry.key"
            @click="selectIcon(entry.key)"
          >
            <el-icon :size="22">
              <component :is="entry.component" />
            </el-icon>
            <span class="icon-picker-item-name">{{ entry.key }}</span>
          </div>
        </div>

        <div v-if="filteredIcons.length === 0" class="icon-picker-empty">
          <el-icon :size="28"><Search /></el-icon>
          <span>没有匹配的图标</span>
        </div>

        <div class="icon-picker-footer">
          共 {{ filteredIcons.length }} 个图标
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, CircleClose } from '@element-plus/icons-vue'
import { iconMap, getIconComponent } from '@/utils/icons'

// ── Props / Emits ──
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ── 状态 ──
const searchText = ref('')

// ── 将 iconMap 转为列表 ──
interface IconEntry {
  key: string
  component: string
}

const allIcons = computed<IconEntry[]>(() => {
  return Object.entries(iconMap).map(([key, component]) => ({
    key,
    component
  }))
})

// ── 搜索过滤 ──
const filteredIcons = computed<IconEntry[]>(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return allIcons.value
  return allIcons.value.filter(e => e.key.toLowerCase().includes(q))
})

// ── 当前选中图标的组件名 ──
const selectedComponent = computed(() => {
  if (!props.modelValue) return null
  return getIconComponent(props.modelValue)
})

// ── 方法 ──
const selectIcon = (key: string) => {
  emit('update:modelValue', key)
}

const clearIcon = () => {
  emit('update:modelValue', '')
}
</script>

<style scoped>
/* ── 触发器 ── */
.icon-picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: border-color 0.2s;
  box-sizing: border-box;
  user-select: none;
}

.icon-picker-trigger:hover {
  border-color: var(--el-color-primary);
}

.icon-picker-placeholder {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.icon-picker-preview-icon {
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.icon-picker-name {
  flex: 1;
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-picker-clear {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
}

.icon-picker-clear:hover {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

/* ── 弹出面板 ── */
.icon-picker-panel {
  display: flex;
  flex-direction: column;
  max-height: 420px;
}

.icon-picker-search {
  margin-bottom: 10px;
}

/* ── 图标网格 ── */
.icon-picker-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  overflow-y: auto;
  padding: 2px 0;
  max-height: 340px;
}

.icon-picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.icon-picker-item:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.icon-picker-item.active {
  background: var(--el-color-primary-light-8);
  border-color: var(--el-color-primary);
}

.icon-picker-item .el-icon {
  color: var(--el-text-color-regular);
}

.icon-picker-item.active .el-icon {
  color: var(--el-color-primary);
}

.icon-picker-item-name {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

/* ── 空状态 ── */
.icon-picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 0;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* ── 底部计数 ── */
.icon-picker-footer {
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  padding-top: 8px;
  margin-top: 6px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
