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

      // 检查响应是否为 SSE 流（业务错误如防重复提交会返回 JSON 而非 SSE）
      const contentType = response.headers.get('Content-Type') || ''
      if (!contentType.includes('text/event-stream')) {
        let errorMsg = `请求失败 (${response.status})`
        try {
          const errorData = await response.json()
          if (errorData.msg) {
            errorMsg = errorData.msg
          }
        } catch {
          // 如果 response body 不是 JSON，使用默认错误信息
        }
        throw new Error(errorMsg)
      }

      // 使用 TextDecoderStream 自动处理 UTF-8 解码和流式行分割
      const reader = response.body!
        .pipeThrough(new TextDecoderStream())
        .getReader()
      let partialLine = ''
      // 当前 SSE 事件内累积的 data 行
      let currentEventLines: string[] = []

      // flush 当前事件：将缓冲的 data 行用 \n 拼接写入 content
      const flushEvent = () => {
        if (currentEventLines.length > 0) {
          content.value += currentEventLines.join('\n')
          currentEventLines = []
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        partialLine += value
        const lines = partialLine.split('\n')
        partialLine = lines.pop() || '' // 保留最后不完整行
        for (const line of lines) {
          // 空行 = SSE 事件边界，flush 当前事件
          if (line === '') {
            flushEvent()
            continue
          }

          if (!line.startsWith('data:')) continue

          // 去掉 "data:" 前缀，再处理可选的前导空格
          let data = line.slice(5)
          if (data.startsWith(' ')) data = data.slice(1)

          // 结束信号
          if (data.trim() === '[DONE]') {
            flushEvent()
            return
          }

          // 压入当前事件的缓冲
          currentEventLines.push(data)
        }
      }
      // 流结束时 flush 剩余缓冲
      flushEvent()
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
