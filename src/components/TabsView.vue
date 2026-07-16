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
              <el-icon v-if="tab.icon" size="14">
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
  const currentRoute = router.currentRoute.value
  const newQuery = { ...currentRoute.query, _t: Date.now() }
  router.push({ path, query: newQuery })
}
</script>

<style scoped>
.tabs-container {
  background: var(--app-bg-surface);
  border-bottom: 1px solid var(--app-border);
  padding: 0 8px;
}

.el-tabs {
  margin-bottom: 0;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 6px;
  cursor: pointer;
  font-size: 13px;
}

/* 清除默认边距 */
.tabs-container :deep(.el-tabs__header) {
  margin: 0 !important;
  padding: 0 !important;
}

.tabs-container :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

/* 左右箭头 */
.tabs-container :deep(.el-tabs__nav-prev),
.tabs-container :deep(.el-tabs__nav-next) {
  margin: 0;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.tabs-container :deep(.el-tabs__nav-prev:hover),
.tabs-container :deep(.el-tabs__nav-next:hover) {
  background-color: var(--app-accent-light);
  border-color: var(--app-accent);
  color: var(--app-accent);
}

/* 激活标签 */
.tabs-container :deep(.el-tabs__item.is-active) {
  font-weight: 600;
  color: var(--app-accent) !important;
  background: var(--app-accent-light);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  border-bottom: 2px solid var(--app-accent);
}

.tabs-container :deep(.el-tabs__item.is-active .tab-label) {
  font-weight: 600;
  color: var(--app-accent);
}

/* 普通标签 hover */
.tabs-container :deep(.el-tabs__item:hover) {
  color: var(--app-text) !important;
  background: var(--app-bg-elevated);
}
</style>
