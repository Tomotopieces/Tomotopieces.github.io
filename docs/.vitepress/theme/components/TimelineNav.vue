<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Post } from '../../posts.data'
import { navHeight, smoothScrollTo } from '../composables/useSmoothScroll'

const props = defineProps<{ posts: Post[] }>()

// 按年月分组（保序），每组取第一篇用于滚动定位
const months = computed(() => {
  const map = new Map<string, Post>()
  for (const p of props.posts) {
    const key = p.date.slice(0, 7)
    if (!map.has(key)) map.set(key, p)
  }
  return Array.from(map.entries())
})

// 滚动高亮的当前月份
const activeMonth = ref(months.value[0]?.[0] ?? '')
// 点击展开的中间区域中心月份
const centerKey = ref('')
const expanded = ref(false)
let scrollTicking = false
// 程序化滚动期间钉住点击的高亮；只有用户手动滚动（滚轮/触摸/键盘）才让高亮跟随
let suppressFollow = false

// 上部：最新两个月；下部：最早两个月
const topMonths = computed(() => months.value.slice(0, 2))
const bottomMonths = computed(() => months.value.slice(-2))

// 中间：点击月份的前一个月 + 当月 + 后一个月（时间倒序，前 = 更新）
const centerMonths = computed(() => {
  if (!expanded.value || !centerKey.value) return []
  const idx = months.value.findIndex(([k]) => k === centerKey.value)
  if (idx < 0) return []
  return months.value.slice(Math.max(0, idx - 1), Math.min(months.value.length, idx + 2))
})

// 上部始终显示；与中间重叠时扩展合并（最多 5 个），而不是隐藏上部
const topVisible = computed(() => {
  if (!expanded.value) return topMonths.value
  const c = centerMonths.value
  const topKeys = new Set(topMonths.value.map(([k]) => k))
  if (c.some(([k]) => topKeys.has(k))) {
    const extra = c.filter(([k]) => !topKeys.has(k))
    return [...topMonths.value, ...extra]
  }
  return topMonths.value
})

// 下部始终显示；与中间重叠时扩展合并
const bottomVisible = computed(() => {
  if (!expanded.value) return bottomMonths.value
  const c = centerMonths.value
  const bottomKeys = new Set(bottomMonths.value.map(([k]) => k))
  if (c.some(([k]) => bottomKeys.has(k))) {
    const extra = c.filter(([k]) => !bottomKeys.has(k))
    return [...extra, ...bottomMonths.value]
  }
  return bottomMonths.value
})

// 中间实际渲染：去掉已并入上/下部的月份
const centerShown = computed(() => {
  if (!expanded.value) return []
  const taken = new Set([...topVisible.value, ...bottomVisible.value].map(([k]) => k))
  return centerMonths.value.filter(([k]) => !taken.has(k))
})

// 区域边界月份不连续（有月份空缺）时用省略号连接
function monthGap(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number)
  const [by, bm] = b.split('-').map(Number)
  return Math.abs(ay * 12 + am - (by * 12 + bm))
}

const showMidEllipsis = computed(() => {
  if (centerShown.value.length > 0) {
    const topLast = topVisible.value.at(-1)?.[0]
    const centerFirst = centerShown.value[0]?.[0]
    return !topLast || !centerFirst || monthGap(topLast, centerFirst) > 1
  }
  const topLast = topVisible.value.at(-1)?.[0]
  const bottomFirst = bottomVisible.value[0]?.[0]
  return !topLast || !bottomFirst || monthGap(topLast, bottomFirst) > 1
})

const showBottomEllipsis = computed(() => {
  if (centerShown.value.length === 0) return false
  const centerLast = centerShown.value.at(-1)?.[0]
  const bottomFirst = bottomVisible.value[0]?.[0]
  return !centerLast || !bottomFirst || monthGap(centerLast, bottomFirst) > 1
})

function scrollToMonth(key: string) {
  const post = months.value.find(([k]) => k === key)?.[1]
  if (!post) return
  const card = document.querySelector(`a[href="${post.url}"]`)?.closest('.post-card') as HTMLElement | null
  const c = document.querySelector('#VPContent')
  if (!card || !c) return
  // navbar 悬浮在内容区上方（fixed，高 navHeight）：目标卡片落到 navbar 之下 8px 处，不被遮挡
  const top = card.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - navHeight() - 8
  smoothScrollTo(c, top)
}

// 点击月份：钉住高亮并跳转（没有收起状态，点击始终是跳转）
function onClickMonth(key: string) {
  centerKey.value = key
  activeMonth.value = key
  expanded.value = true
  suppressFollow = true
  scrollToMonth(key)
}

// 手动滚动时高亮跟随（取第一个越过内容区可见上沿的卡片），窗口同步展开到该月份
function updateActiveFromScroll() {
  const c = document.querySelector('#VPContent')
  if (!c) return
  // 判定线 = navbar 高度：卡片顶部越过 navbar 才算当前月份，内容不会被遮挡
  const threshold = navHeight()
  const cards = Array.from(document.querySelectorAll('.post-card'))
  let last: HTMLElement | null = null
  for (const card of cards) {
    last = card as HTMLElement
    if (card.getBoundingClientRect().top >= threshold) {
      const href = card.querySelector('.post-title a')?.getAttribute('href')
      const post = props.posts.find((p) => p.url === href)
      if (post) followMonth(post.date.slice(0, 7))
      return
    }
  }
  const href = last?.querySelector('.post-title a')?.getAttribute('href')
  const post = props.posts.find((p) => p.url === href)
  if (post) followMonth(post.date.slice(0, 7))
}

// 跟随某个月份：高亮它，并把中间区域展开成它的前后各一个月
function followMonth(key: string) {
  activeMonth.value = key
  centerKey.value = key
  expanded.value = true
}

function onContainerScroll() {
  // 点击跳转产生的程序化滚动不改写高亮，等用户手动滚动再跟随
  if (suppressFollow) return
  if (scrollTicking) return
  scrollTicking = true
  requestAnimationFrame(() => {
    scrollTicking = false
    updateActiveFromScroll()
  })
}

// 用户手动滚动（滚轮/触摸/键盘）后，恢复高亮跟随
function onUserScrollInput() {
  suppressFollow = false
}

function onKeyScroll(e: KeyboardEvent) {
  if (['PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(e.key)) {
    suppressFollow = false
  }
}

onMounted(() => {
  const c = document.querySelector('#VPContent')
  c?.addEventListener('scroll', onContainerScroll, { passive: true })
  c?.addEventListener('wheel', onUserScrollInput, { passive: true })
  c?.addEventListener('touchstart', onUserScrollInput, { passive: true })
  document.addEventListener('keydown', onKeyScroll)
  updateActiveFromScroll()
})

onBeforeUnmount(() => {
  const c = document.querySelector('#VPContent')
  c?.removeEventListener('scroll', onContainerScroll)
  c?.removeEventListener('wheel', onUserScrollInput)
  c?.removeEventListener('touchstart', onUserScrollInput)
  document.removeEventListener('keydown', onKeyScroll)
})
</script>

<template>
  <aside class="timeline" aria-label="按月份浏览">
    <template v-for="[key, post] in topVisible" :key="key">
      <button
        type="button"
        class="timeline-item"
        :class="{ active: key === activeMonth }"
        @click="onClickMonth(key)"
      >
        <span class="timeline-dot" />
        <span class="timeline-label">{{ key.slice(2).replace('-', '.') }}</span>
      </button>
    </template>

    <div v-if="showMidEllipsis" class="timeline-ellipsis" aria-hidden="true">⋮</div>

    <template v-for="[key, post] in centerShown" :key="key">
      <button
        type="button"
        class="timeline-item"
        :class="{ active: key === activeMonth }"
        @click="onClickMonth(key)"
      >
        <span class="timeline-dot" />
        <span class="timeline-label">{{ key.slice(2).replace('-', '.') }}</span>
      </button>
    </template>

    <div v-if="showBottomEllipsis" class="timeline-ellipsis" aria-hidden="true">⋮</div>

    <template v-for="[key, post] in bottomVisible" :key="key">
      <button
        type="button"
        class="timeline-item"
        :class="{ active: key === activeMonth }"
        @click="onClickMonth(key)"
      >
        <span class="timeline-dot" />
        <span class="timeline-label">{{ key.slice(2).replace('-', '.') }}</span>
      </button>
    </template>
  </aside>
</template>

<style scoped>
.timeline {
  position: sticky;
  top: calc(var(--vp-nav-height) + 28px);
  flex-shrink: 0;
  width: 75px;
  max-height: 70dvh;
  /* 圆点骑在左轴线上，允许稍微溢出，不能被 overflow 裁掉 */
  overflow: visible;
  border-left: 2px solid var(--vp-c-divider);
  padding-left: 12px;
  font-size: 12px;
}

.timeline-item {
  position: relative;
  display: block;
  width: 100%;
  padding: 6px 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-family: inherit;
  white-space: nowrap;
  text-align: left;
  transition: color 0.2s;
}

.timeline-item:hover {
  color: var(--vp-c-text-1);
}

.timeline-item.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.timeline-dot {
  position: absolute;
  top: 50%;
  left: -18px; /* 12px padding + 1px 半线宽 + 5px 半圆点，圆心对准轴线 */
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  box-sizing: border-box;
  transition: border-color 0.2s, background-color 0.2s;
}

.timeline-item:hover .timeline-dot {
  border-color: var(--vp-c-text-2);
}

.timeline-item.active .timeline-dot {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
}

.timeline-ellipsis {
  padding: 2px 0 2px 12px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 1.2;
  user-select: none;
}

@media (max-width: 767px) {
  .timeline {
    display: none;
  }
}
</style>
