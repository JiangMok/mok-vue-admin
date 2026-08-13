/**
 * 扁平列表转树形结构
 * @param list  扁平数据（每条记录需有 id 和 parentId）
 * @param rootParentId  根节点的 parentId 值，默认 '0'
 * @returns 树形数据（根节点数组，每个节点含 children）
 */
export function buildPermissionTree<T extends { id: string; parentId: string; children?: T[] }>(
  list: T[],
  rootParentId: string = '0'
): T[] {
  const map: Record<string, T> = {}
  const tree: T[] = []

  // 第一次遍历：建立 id → item 映射，初始化 children
  for (const item of list) {
    map[item.id] = { ...item, children: [] } as T
  }

  // 第二次遍历：按 parentId 挂载
  for (const item of list) {
    const node = map[item.id]
    if (item.parentId && item.parentId !== rootParentId && map[item.parentId]) {
      map[item.parentId].children!.push(node)
    } else {
      tree.push(node)
    }
  }

  return tree
}
