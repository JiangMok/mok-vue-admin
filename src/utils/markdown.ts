import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import 'highlight.js/styles/github.css'

// 安全配置：若语言未注册，退回自动检测，防止报错
marked.setOptions({
  highlight(code, lang) {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
    } catch (e) {
      console.warn('highlight.js error:', e)
    }
    // 自动检测，失败则返回纯文本
    try {
      return hljs.highlightAuto(code).value
    } catch {
      return code  // 最差情况直接返回原代码，避免崩溃
    }
  },
  breaks: true,
  gfm: true,
})

export function renderMarkdown(content: string): string {
  if (!content) return ''
  try {
    const rawHtml = marked.parse(content) as string
    // 注意：DOMPurify 可能移除 style/class，若影响样式可调整配置
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target'],   // 允许链接的 target 属性
    })
    return cleanHtml
  } catch (e) {
    console.error('Markdown 渲染失败', e)
    // 降级：显示纯文本（自动转义 HTML）
    return `<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
  }
}
