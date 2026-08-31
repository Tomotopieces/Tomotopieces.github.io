// 手写平滑滚动：直接驱动 scrollTop，不依赖浏览器原生平滑机制
// （原生 smooth 滚动在事件处理链中不可靠，rAF 在后台标签会被冻结）
let fallbackTimer: number | undefined

/** 导航栏高度（内容区滚动时定位需要减去它） */
export function navHeight(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')
  return parseInt(v) || 64
}

export function smoothScrollTo(c: HTMLElement, to: number, duration = 400) {
  // 取消上一个兜底定时器，避免连续滚动时旧兜底把位置强拉回去
  clearTimeout(fallbackTimer)
  const from = c.scrollTop
  const diff = to - from
  if (Math.abs(diff) < 1) return
  const start = performance.now()
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    c.scrollTop = from + diff * ease(t)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
  // 兜底：rAF 被冻结（后台/受控环境）时，超时后直接跳到目标位置
  fallbackTimer = window.setTimeout(() => {
    if (Math.abs(c.scrollTop - to) > 2) c.scrollTop = to
  }, duration + 200)
}
