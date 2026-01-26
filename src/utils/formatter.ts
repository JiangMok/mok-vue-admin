// utils/formatter.ts

// 格式化JSON字符串
export const formatJson = (jsonString?: string) => {
  if (!jsonString) return '无数据'

  try {
    const jsonObj = JSON.parse(jsonString)
    return JSON.stringify(jsonObj, null, 2)
  } catch (e) {
    return jsonString
  }
}

// 格式化日期时间
export const formatDateTime = (dateString?: string) => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  } catch (e) {
    return dateString
  }
}
