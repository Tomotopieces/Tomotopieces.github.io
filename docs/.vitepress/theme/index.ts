import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './style.css'
import PostList from './components/PostList.vue'
import CalendarNav from './components/CalendarNav.vue'
import GitHubButton from './components/GitHubButton.vue'
import AppearanceButton from './components/AppearanceButton.vue'
import Lightbox from './components/Lightbox.vue'
import ScrollContainer from './components/ScrollContainer.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PostList', PostList)
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 桌面端与移动端一致：日历按钮在搜索框右边；右侧为 GitHub 图标 + 深浅模式按钮（内置 switch 已在 style.css 中隐藏）
      'nav-bar-content-after': () => [h(CalendarNav), h(GitHubButton), h(AppearanceButton)],
      // 全局图片灯箱与滚动容器适配
      'layout-top': () => [h(Lightbox), h(ScrollContainer)],
    })
  },
} satisfies Theme
