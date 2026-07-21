import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import 'highlight.js/styles/github.css'

export function renderMarkdown(content: string): string {
  if (!content) return ''
  try {
    // 修复 AI 输出中 # 后缺空格的问题：###错误 → ### 错误
    const normalized = content.replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
    // marked v18: 选项通过 parse() 第二个参数传入，setOptions() 已移除
    const rawHtml = marked.parse(normalized, {
      breaks: true,
      gfm: true,
    }) as string

    // 对代码块应用语法高亮（marked-highlight 扩展包未安装，用 DOM 后处理代替）
    const wrapper = document.createElement('div')
    wrapper.innerHTML = rawHtml
    wrapper.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })

    // DOMPurify 清洗，同时放行 class 属性（highlight.js 依赖 class）
    const cleanHtml = DOMPurify.sanitize(wrapper.innerHTML, {
      ADD_ATTR: ['target'],
      ALLOWED_ATTR: ['class', 'target', 'href', 'src', 'alt', 'title', 'id'],
    })
    return cleanHtml
  } catch (e) {
    console.error('Markdown 渲染失败', e)
    // 降级：显示转义后的纯文本
    return `<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
  }
}
