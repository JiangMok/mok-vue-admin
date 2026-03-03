// src/stores/tabs.ts
import { defineStore } from 'pinia'
import { type RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  name?: string
  title: string
  icon?: string | object // 图标名称或组件
  fullPath?: string
  query?: Record<string, never>
  params?: Record<string, never>
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    visitedTabs: [] as TabItem[],
    cachedTabs: [] as string[],
    fixedPaths: ['/', '/dashboard', '/system/info'] // 定义固定标签路径，根据实际调整
  }),
  actions: {
    // 添加标签页
    addTab(route: RouteLocationNormalized) {
      if (route.meta?.noTab) return

      // 如果已存在，则不重复添加
      const exists = this.visitedTabs.some(tab => tab.path === route.path)
      if (exists) return

      const title = (route.meta?.title as string) || route.name?.toString() || '未知'
      const icon = route.meta?.icon // 假设 meta 中有 icon 字段

      const tab: TabItem = {
        path: route.path,
        name: route.name as string,
        title,
        icon, // 存储图标（可以是字符串或组件）
        fullPath: route.fullPath,
        query: route.query,
        params: route.params
      }
      this.visitedTabs.push(tab)

      if (route.meta?.keepAlive) {
        const componentName = route.name as string
        if (componentName && !this.cachedTabs.includes(componentName)) {
          this.cachedTabs.push(componentName)
        }
      }
    },

    // 关闭标签页
    closeTab(path: string) {
      // 如果是固定标签，不允许关闭
      if (this.fixedPaths.includes(path)) {
        console.warn('固定标签不能关闭')
        return
      }
      const index = this.visitedTabs.findIndex(tab => tab.path === path)
      if (index === -1) return

      const tab = this.visitedTabs[index]
      if (tab.name && this.cachedTabs.includes(tab.name)) {
        this.cachedTabs = this.cachedTabs.filter(name => name !== tab.name)
      }
      this.visitedTabs.splice(index, 1)
    },

    // 关闭其他标签页
    closeOtherTabs(path: string) {
      // 保留当前标签和所有固定标签
      const keepPaths = [path, ...this.fixedPaths]
      // 去重
      const uniqueKeepPaths = [...new Set(keepPaths)]
      this.visitedTabs = this.visitedTabs.filter(tab => uniqueKeepPaths.includes(tab.path))

      // 重新构建缓存列表：仅保留仍在 visitedTabs 中的缓存
      const keepNames = this.visitedTabs.map(tab => tab.name).filter(Boolean) as string[]
      this.cachedTabs = this.cachedTabs.filter(name => keepNames.includes(name))
    },

    // 关闭所有标签页（保留固定标签）
    closeAllTabs() {
      // 保留固定标签
      this.visitedTabs = this.visitedTabs.filter(tab => this.fixedPaths.includes(tab.path))
      const keepNames = this.visitedTabs.map(tab => tab.name).filter(Boolean) as string[]
      this.cachedTabs = this.cachedTabs.filter(name => keepNames.includes(name))
    },

    // 刷新当前标签页（通过临时移除缓存再重新加入）
    refreshTab(path: string) {
      const tab = this.visitedTabs.find(tab => tab.path === path)
      if (!tab || !tab.name) return

      if (this.cachedTabs.includes(tab.name)) {
        this.cachedTabs = this.cachedTabs.filter(name => name !== tab.name)
        setTimeout(() => {
          if (this.visitedTabs.some(t => t.path === path)) {
            this.cachedTabs.push(tab.name!)
          }
        }, 0)
      } else {
        console.warn('未缓存的组件无法通过此方式刷新')
      }
    },

    // 更新标签标题
    updateTabTitle(path: string, title: string) {
      const tab = this.visitedTabs.find(tab => tab.path === path)
      if (tab) tab.title = title
    }
  }
})
