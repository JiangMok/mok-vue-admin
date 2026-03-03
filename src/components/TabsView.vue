<template>
  <div class="tabs-container">
    <el-tabs
      v-model="activeTab"
      type="card"
      closable
      @tab-click="handleTabClick"
      @tab-remove="handleTabRemove"
    >
      <el-tab-pane
        v-for="tab in visitedTabs"
        :key="tab.path"
        :name="tab.path"
        :closable="!isFixedTab(tab.path)"
      >
        <template #label>
          <el-dropdown
            trigger="contextmenu"
            @command="(command) => handleContextMenu(command, tab)"
          >
            <span class="tab-label">
              <el-icon v-if="tab.icon" size="16">
                <component :is="tab.icon" />
              </el-icon>
              {{ tab.title }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="close"
                  :disabled="isFixedTab(tab.path)"
                >
                  关闭当前
                </el-dropdown-item>
                <el-dropdown-item command="closeOthers">
                  关闭其他
                </el-dropdown-item>
                <el-dropdown-item command="closeAll">
                  关闭所有
                </el-dropdown-item>
                <el-dropdown-item command="refresh">
                  刷新
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTabsStore, type TabItem } from '@/stores/tabs'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const tabsStore = useTabsStore()

const visitedTabs = computed(() => tabsStore.visitedTabs)
const fixedPaths = computed(() => tabsStore.fixedPaths)

const isFixedTab = (path: string) => fixedPaths.value.includes(path)

const activeTab = computed({
  get: () => route.path,
  set: (path) => {
    if (path !== route.path) {
      router.push(path)
    }
  }
})

const handleTabClick = (tab: any) => {
  const path = tab.props.name
  if (path !== route.path) {
    router.push(path)
  }
}

const handleTabRemove = (path: string) => {
  if (isFixedTab(path)) return
  closeTab(path)
}

const handleContextMenu = (command: string, tab: TabItem) => {
  const path = tab.path
  switch (command) {
    case 'close':
      if (isFixedTab(path)) {
        ElMessage.warning('该标签不能关闭')
        return
      }
      closeTab(path)
      break
    case 'closeOthers':
      tabsStore.closeOtherTabs(path)
      if (!tabsStore.visitedTabs.some(t => t.path === route.path)) {
        const last = tabsStore.visitedTabs[tabsStore.visitedTabs.length - 1]
        if (last) router.push(last.path)
      }
      break
    case 'closeAll':
      tabsStore.closeAllTabs()
      const firstFixed = tabsStore.visitedTabs[0]
      if (firstFixed) {
        router.push(firstFixed.path)
      } else {
        router.push('/')
      }
      break
    case 'refresh':
      refreshTab(path)
      break
  }
}

const closeTab = (path: string) => {
  const currentPath = route.path
  tabsStore.closeTab(path)

  if (path === currentPath) {
    const lastTab = tabsStore.visitedTabs[tabsStore.visitedTabs.length - 1]
    if (lastTab) {
      router.push(lastTab.path)
    } else {
      router.push('/')
    }
  }
}

const refreshTab = (path: string) => {
  if (path !== route.path) {
    router.push(path).then(() => {
      tabsStore.refreshTab(path)
    })
  } else {
    tabsStore.refreshTab(path)
  }
}
</script>

<style scoped>
.tabs-container {
  background: white;
  border-bottom: none;
  padding: 0;
  margin: 0;
}

.el-tabs {
  margin-bottom: 0;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  cursor: pointer;
}

.el-icon {
  margin-right: 2px;
}

/* 清除标签头部的默认外边距/内边距 */
.tabs-container :deep(.el-tabs__header) {
  margin: 0 !important;
  padding: 0 !important;
}

/* 左右按钮样式优化（保持你之前的设置） */
.tabs-container :deep(.el-tabs__nav-prev),
.tabs-container :deep(.el-tabs__nav-next) {
  margin: 0;
  top: 50%;
  transform: translateY(-50%);
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.tabs-container :deep(.el-tabs__nav-prev:hover),
.tabs-container :deep(.el-tabs__nav-next:hover) {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

/* 突出当前激活标签 - 醒目处理 */
.tabs-container :deep(.el-tabs__item.is-active) {
  font-weight: 700;                /* 更粗的字体 */
  color: #409eff !important;       /* 主题蓝色，强制覆盖 */
  background-color: #ecf5ff;       /* 浅蓝背景 */
  border-radius: 4px;              /* 圆角 */
  border-bottom: 2px solid #409eff; /* 底部加粗线，更显眼 */
  transition: all 0.2s;
}

.tabs-container :deep(.el-tabs__item.is-active .tab-label) {
  font-weight: 700;
  color: #409eff;
}

/* 可选：给激活标签添加轻微阴影，更突出 */
.tabs-container :deep(.el-tabs__item.is-active) {
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
}
</style>
