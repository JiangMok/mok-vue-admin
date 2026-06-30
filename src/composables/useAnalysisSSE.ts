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
          // console.log("========== "+line.slice(5).trim())
          const data = line.slice(5).trim()
          if (data === '[DONE]') return
          content.value += data
          // console.log('==== data', data)
          // console.log('>>>> content.value:', content.value)
          // if (line.startsWith('data: ')) {
          //   // const data = line.slice(5).trim()
          //   const data = line.slice(5).trim()
          //   if (data === '[DONE]') return
          //   content.value += data
          //   console.log('==== data', data)
          //   console.log('>>>> content.value:', content.value)
          // }
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
