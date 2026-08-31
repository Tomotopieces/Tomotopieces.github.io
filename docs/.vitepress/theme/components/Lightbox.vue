<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import type { SlideData } from 'photoswipe'
import 'photoswipe/style.css'

const route = useRoute()

// 单例复用的 PhotoSwipe 实例，每次打开前更新 dataSource
let lightbox: PhotoSwipeLightbox | null = null

function getLightbox(): PhotoSwipeLightbox {
  if (!lightbox) {
    lightbox = new PhotoSwipeLightbox({
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.88,
      wheelToZoom: true,
    })
    lightbox.init()
  }
  return lightbox
}

function imgSrc(img: HTMLImageElement): string {
  return img.currentSrc || img.src
}

// 文档级点击委托：文章正文里的图片点击后打开灯箱
function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.tagName !== 'IMG') return
  const doc = target.closest('.vp-doc')
  if (!doc) return
  const imgs = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[]
  const clicked = imgSrc(target as HTMLImageElement)
  const index = imgs.findIndex((img) => imgSrc(img) === clicked)
  if (index < 0) return

  const dataSource: SlideData[] = imgs.map((img) => ({
    src: imgSrc(img),
    width: img.naturalWidth || 1200,
    height: img.naturalHeight || 800,
    alt: img.alt || undefined,
  }))

  const lb = getLightbox()
  lb.options.dataSource = dataSource
  lb.options.index = index
  lb.loadAndOpen(index)
}

// 路由变化（SPA 跳转 / 前进后退）时关闭灯箱
watch(
  () => route.path,
  () => {
    if (lightbox?.pswp) lightbox.pswp.close()
  },
)

onMounted(() => {
  document.addEventListener('click', onDocClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true)
  lightbox?.destroy()
})
</script>

<template>
  <!-- 灯箱 UI 由 PhotoSwipe 渲染到 body，本组件只负责收集点击与实例管理 -->
</template>
