import { ref, onBeforeUnmount } from 'vue'

export function useAnalysisSSE() {
  const content = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  const start = async (url: string, body: any, token?: string) => {
    content.value = ''
    loading.value = true
    error.value = null

    abortController = new AbortController()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`请求失败 (${response.status})`)
      }

      // 使用 TextDecoderStream 自动处理 UTF-8 解码和流式行分割
      const reader = response.body!
        .pipeThrough(new TextDecoderStream())
        .getReader()
      let partialLine = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        partialLine += value
        const lines = partialLine.split('\n')
        partialLine = lines.pop() || '' // 保留最后不完整行
        for (const line of lines) {
          if (!line.startsWith('data:')) continue

          // 去掉 "data:" 前缀，再处理可选的前导空格
          let data = line.slice(5)
          if (data.startsWith(' ')) data = data.slice(1)

          // 结束信号
          if (data.trim() === '[DONE]') return

          // 空 data 行 → 保留为换行，维持段落分隔
          if (data === '') {
            content.value += '\n'
          } else {
            content.value += data
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        error.value = err.message || '未知错误'
      }
    } finally {
      loading.value = false
    }
  }

  const stop = () => {
    abortController?.abort()
    loading.value = false
  }

  onBeforeUnmount(stop)

  return { content, loading, error, start, stop }
}
