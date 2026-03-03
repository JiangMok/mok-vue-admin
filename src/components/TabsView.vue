<template>
  <div class="tabs-container">
    <el-tabs
      ref="tabsRef"
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
        :closable="tab.path !== '/'"
      >
        <template #label>
          <!-- 右键菜单 -->
          <el-dropdown
            trigger="contextmenu"
            @command="(command) => handleContextMenu(command, tab)"
          >
            <span class="tab-label">
              <!-- 图标：如果有图标则显示，否则首页默认显示 HomeFilled -->
              <el-icon v-if="tab.icon" :size="16" style="margin-right: 4px;">
                <component :is="tab.icon" />
              </el-icon>
              <el-icon v-else-if="tab.path === '/'">
                <HomeFilled />
              </el-icon>
              {{ tab.title }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="close"
                  :disabled="tab.path === '/'"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeFilled } from '@element-plus/icons-vue'
import { useTabsStore, type TabItem } from '@/stores/tabs'
import { ElMessage } from 'element-plus'
import type { TabsInstance } from 'element-plus'

const router = useRouter()
const route = useRoute()
const tabsStore = useTabsStore()

const visitedTabs = computed(() => tabsStore.visitedTabs)

const activeTab = computed({
  get: () => route.path,
  set: (path) => {
    if (path !== route.path) {
      router.push(path)
    }
  }
})

// 获取 el-tabs 组件实例的引用
const tabsRef = ref<InstanceType<typeof TabsInstance>>()

// 滚轮滚动处理函数
const handleWheel = (event: WheelEvent) => {
  // 阻止默认滚动行为（防止页面上下滚动）
  event.preventDefault()

  // 获取实际的标签滚动容器 (el-tabs__nav-wrap)
  const navWrap = tabsRef.value?.$el.querySelector('.el-tabs__nav-wrap')
  if (navWrap) {
    // deltaY 正值向下滚动 => 向右滑动；负值向上滚动 => 向左滑动
    navWrap.scrollLeft += event.deltaY * 0.5
  }
}

// 挂载时添加滚轮监听
onMounted(() => {
  const navWrap = tabsRef.value?.$el.querySelector('.el-tabs__nav-wrap')
  if (navWrap) {
    navWrap.addEventListener('wheel', handleWheel, { passive: false })
  }
})

// 卸载时移除监听
onUnmounted(() => {
  const navWrap = tabsRef.value?.$el.querySelector('.el-tabs__nav-wrap')
  if (navWrap) {
    navWrap.removeEventListener('wheel', handleWheel)
  }
})

// 点击标签切换
const handleTabClick = (tab: any) => {
  const path = tab.props.name
  if (path !== route.path) {
    router.push(path)
  }
}

// 关闭标签（通过关闭按钮）
const handleTabRemove = (path: string) => {
  if (path === '/') return
  closeTab(path)
}

// 右键菜单命令处理
const handleContextMenu = (command: string, tab: TabItem) => {
  const path = tab.path
  switch (command) {
    case 'close':
      if (path === '/') {
        ElMessage.warning('首页不能关闭')
        return
      }
      closeTab(path)
      break
    case 'closeOthers':
      tabsStore.closeOtherTabs(path)
      // 如果当前标签被关闭了，需要跳转
      if (!tabsStore.visitedTabs.some(t => t.path === route.path)) {
        const last = tabsStore.visitedTabs[tabsStore.visitedTabs.length - 1]
        if (last) router.push(last.path)
      }
      break
    case 'closeAll':
      tabsStore.closeAllTabs()
      router.push('/')
      break
    case 'refresh':
      refreshTab(path)
      break
  }
}

// 关闭标签逻辑（处理跳转）
const closeTab = (path: string) => {
  const currentPath = route.path
  tabsStore.closeTab(path)

  // 如果关闭的是当前激活的标签，则切换到最后一个标签
  if (path === currentPath) {
    const lastTab = tabsStore.visitedTabs[tabsStore.visitedTabs.length - 1]
    if (lastTab) {
      router.push(lastTab.path)
    } else {
      // 如果没有标签了，跳转到首页（理论上不会发生，因为首页保留）
      router.push('/')
    }
  }
}

// 刷新当前标签
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

}

.el-tabs {
  margin-bottom: 0;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  cursor: pointer;
}
</style>
