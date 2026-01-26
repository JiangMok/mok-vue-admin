<template>
  <!-- 有子菜单 -->
  <el-sub-menu
    v-if="menu.children && menu.children.length > 0"
    :index="resolvePath(menu.path)"
  >
    <template #title>
      <el-icon v-if="menu.icon">
        <component :is="getIconComponent(menu.icon)" />
      </el-icon>
      <span>{{ menu.name }}</span>
    </template>

    <!-- 递归渲染子菜单 -->
    <menu-item
      v-for="child in menu.children"
      :key="child.id"
      :menu="child"
      :base-path="resolvePath(menu.path)"
    />
  </el-sub-menu>

  <!-- 没有子菜单 -->
  <el-menu-item
    v-else
    :index="resolvePath(menu.path)"
    @click="handleClick"
  >
    <template #title>
      <el-icon v-if="menu.icon">
        <component :is="getIconComponent(menu.icon)" />
      </el-icon>
      <span>{{ menu.name }}</span>
    </template>
  </el-menu-item>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getIconComponent } from '@/utils/icons'
import type { MenuItem as MenuItemType } from '@/types'

const props = defineProps<{
  menu: MenuItemType
  basePath?: string
}>()

const router = useRouter()

// 解析完整路径
const resolvePath = (routePath: string) => {
  if (routePath.startsWith('/')) {
    return routePath
  }
  if (props.basePath) {
    return `${props.basePath}/${routePath}`
  }
  return `/${routePath}`
}

// 处理菜单点击
const handleClick = () => {
  const path = resolvePath(props.menu.path)
  console.log(`点击菜单 ${props.menu.name}, 跳转到 ${path}`)
  router.push(path)
}
</script>
