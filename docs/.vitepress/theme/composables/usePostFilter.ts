import { ref } from 'vue'
import { useRoute, useRouter } from 'vitepress'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 当前筛选日期（YYYY-MM-DD），导航栏日历与首页文章列表共享 */
export const selectedDate = ref<string | null>(null)

function readDateFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const param = new URLSearchParams(window.location.search).get('date')
  return param && DATE_RE.test(param) ? param : null
}

export function usePostFilter() {
  const route = useRoute()
  const router = useRouter()

  /** 选择/取消筛选日期，并同步到 URL（?date=YYYY-MM-DD） */
  function selectDate(date: string | null) {
    selectedDate.value = date
    router.go(date ? `/?date=${date}` : '/')
  }

  /** 以当前 URL 为准重新读取筛选状态（页面加载、路由变化、浏览器前进后退时调用） */
  function syncFromUrl() {
    selectedDate.value = readDateFromUrl()
  }

  return { route, selectedDate, selectDate, syncFromUrl }
}
