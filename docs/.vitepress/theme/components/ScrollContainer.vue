<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import { navHeight, smoothScrollTo } from '../composables/useSmoothScroll'

// 页面滚动已从 window 移到 #VPContent 容器（style.css），
// 这里把 VitePress 依赖 window 滚动的行为（锚点跳转、路由回顶）适配到容器上。
const route = useRoute()

function container(): HTMLElement | null {
  return document.querySelector('#VPContent')
}

/** 平滑滚动容器，使目标元素出现在内容区顶部（减去导航栏高度） */
function scrollToEl(el: HTMLElement) {
  const c = container()
  if (!c) return
  const top = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - navHeight()
  // 延迟到事件处理链结束后再滚动，避免与 VitePress 同事件内的滚动逻辑竞争
  window.setTimeout(() => smoothScrollTo(c, top), 0)
}

function scrollToHash(hash: string) {
  const el = document.getElementById(decodeURIComponent(hash.slice(1)))
  if (el) scrollToEl(el)
}

// 页内锚点链接（TOC/标题锚点）：VitePress 的 window 滚动已失效，这里接管容器滚动
// （VitePress 在 window 捕获阶段先执行并更新 hash，本监听在 document 捕获阶段后执行）
function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const a = target.closest('a[href^="#"]') as HTMLAnchorElement | null
  if (!a || !a.getAttribute('href')) return
  const hash = a.getAttribute('href')!
  if (hash === '#') return
  scrollToHash(hash)
}

// 路由切换：无锚点时回到顶部，带锚点时跳到锚点（VitePress 的恢复逻辑同样依赖 window）
watch(
  () => route.path,
  async (val) => {
    await nextTick()
    await nextTick()
    const c = container()
    if (!c) return
    const hashIdx = val.indexOf('#')
    if (hashIdx >= 0) {
      scrollToHash(val.slice(hashIdx))
    } else {
      c.scrollTo({ top: 0, behavior: 'auto' })
    }
  },
)

onMounted(() => {
  document.addEventListener('click', onDocClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true)
})
</script>

<template>
  <!-- 滚动容器适配：锚点跳转与路由滚动定位 -->
</template>
