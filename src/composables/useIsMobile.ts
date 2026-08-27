import { onBeforeUnmount, onMounted, ref } from 'vue'

const MOBILE_QUERY = '(max-width: 768px)'

export function useIsMobile() {
  const isMobile = ref(false)
  let mediaQuery: MediaQueryList | null = null

  const update = (event: MediaQueryListEvent | MediaQueryList) => {
    isMobile.value = event.matches
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(MOBILE_QUERY)
    update(mediaQuery)
    mediaQuery.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', update)
    mediaQuery = null
  })

  return { isMobile }
}
