import { ref, onBeforeUnmount } from 'vue'

export function useAnalysisSSE() {
  const content = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const completed = ref(false)
  let abortController: AbortController | null = null

  const start = async (url: string, body: unknown, token?: string) => {
    abortController?.abort()

    content.value = ''
    loading.value = true
    error.value = null
    completed.value = false

    const controller = new AbortController()
    abortController = controller
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
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

      if (!response.body) {
        throw new Error('AI 分析连接未返回数据流')
      }

      // 使用 TextDecoderStream 自动处理 UTF-8 解码和流式行分割
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()
      let partialLine = ''
      let receivedDone = false
      // 当前 SSE 事件内累积的 data 行
      let currentEventLines: string[] = []

      // flush 当前事件：将缓冲的 data 行用 \n 拼接写入 content
      const flushEvent = () => {
        if (currentEventLines.length > 0) {
          content.value += currentEventLines.join('\n')
          currentEventLines = []
        }
      }

      const processLine = (rawLine: string) => {
        // Spring SseEmitter 使用 CRLF，移除行尾 \r 后才能正确识别空行事件边界。
        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine

        if (line === '') {
          flushEvent()
          return false
        }

        if (!line.startsWith('data:')) return false

        // 去掉 "data:" 前缀，再处理可选的前导空格
        let data = line.slice(5)
        if (data.startsWith(' ')) data = data.slice(1)

        if (data.trim() === '[DONE]') {
          flushEvent()
          return true
        }

        currentEventLines.push(data)
        return false
      }

      streamLoop: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        partialLine += value
        const lines = partialLine.split('\n')
        partialLine = lines.pop() || '' // 保留最后不完整行
        for (const line of lines) {
          if (processLine(line)) {
            receivedDone = true
            break streamLoop
          }
        }
      }

      if (!receivedDone && partialLine) {
        receivedDone = processLine(partialLine)
      }
      flushEvent()

      if (!receivedDone) {
        throw new Error('AI 分析连接意外结束')
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && abortController === controller) {
        error.value = err.message || '未知错误'
      }
    } finally {
      if (abortController === controller) {
        abortController = null
        loading.value = false
        completed.value = !error.value
      }
    }
  }

  const stop = () => {
    const controller = abortController
    abortController = null
    controller?.abort()
    loading.value = false
  }

  onBeforeUnmount(stop)

  return { content, loading, error, completed, start, stop }
}
