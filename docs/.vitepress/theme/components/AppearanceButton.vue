<script setup lang="ts">
import { useData } from 'vitepress'

const { isDark } = useData()

function toggleTheme() {
  // 切换瞬间给根元素加过渡类，让页面颜色平滑渐变；动画结束后移除，避免影响后续性能
  const root = document.documentElement
  root.classList.add('theme-transition')
  void root.offsetWidth // 强制重排，确保浏览器先应用过渡规则再变色
  isDark.value = !isDark.value
  window.setTimeout(() => root.classList.remove('theme-transition'), 450)
}
</script>

<template>
  <button
    type="button"
    class="nav-icon-btn appearance-btn"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
    @click="toggleTheme"
  >
    <svg
      class="icon-sun"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
    <svg
      class="icon-moon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </button>
</template>

<style scoped>
.appearance-btn {
  position: relative;
}

.appearance-btn svg {
  position: absolute;
  transition: opacity 0.25s;
}

.icon-sun {
  opacity: 1;
}

.icon-moon {
  opacity: 0;
}

.dark .icon-sun {
  opacity: 0;
}

.dark .icon-moon {
  opacity: 1;
}
</style>
