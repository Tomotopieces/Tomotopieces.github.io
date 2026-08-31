<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePostFilter } from '../composables/usePostFilter'
import DateCalendar from './DateCalendar.vue'

withDefaults(defineProps<{ placement?: 'popover' | 'inline' }>(), {
  placement: 'popover',
})

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const { route, selectedDate, syncFromUrl } = usePostFilter()

onMounted(() => {
  // 打开带 ?date= 的链接时恢复筛选状态
  syncFromUrl()
  window.addEventListener('popstate', syncFromUrl)
  document.addEventListener('mousedown', onDocMouseDown)
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncFromUrl)
  document.removeEventListener('mousedown', onDocMouseDown)
  document.removeEventListener('keydown', onKeyDown)
})

// 路由变化时（例如从文章页返回首页），以当前 URL 为准重新同步筛选状态
watch(() => route.path, syncFromUrl)

function onDocMouseDown(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
</script>

<template>
  <div ref="root" class="cal-nav" :class="{ 'placement-popover': placement === 'popover' }">
    <button
      type="button"
      class="nav-icon-btn cal-nav-btn"
      :class="{ active: selectedDate }"
      :aria-expanded="open"
      :aria-label="selectedDate ? `日历，已筛选 ${selectedDate}` : '日历'"
      :title="selectedDate ? `已筛选 ${selectedDate}` : '日历'"
      @click="open = !open"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
      <span v-if="selectedDate" class="cal-dot" aria-hidden="true" />
    </button>

    <div v-if="open" :class="placement === 'popover' ? 'cal-popover' : 'cal-inline'">
      <DateCalendar />
    </div>
  </div>
</template>

<style scoped>
.cal-nav {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.cal-nav-btn {
  position: relative;
}

.cal-nav-btn.active {
  color: var(--vp-c-brand-1);
}

.cal-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
}

.cal-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  padding: 12px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: var(--vp-shadow-3);
  z-index: 200;
}

.cal-inline {
  margin-top: 8px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}
</style>
