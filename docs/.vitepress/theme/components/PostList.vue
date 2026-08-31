<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as posts } from '../../posts.data'
import { usePostFilter } from '../composables/usePostFilter'
import TimelineNav from './TimelineNav.vue'

const { site } = useData()
const { selectedDate, selectDate } = usePostFilter()

const filtered = computed(() => {
  const list = selectedDate.value ? posts.filter((p) => p.date === selectedDate.value) : [...posts]
  // 置顶的文章排最前，组内保持日期倒序（sort 稳定）
  return list.sort((a, b) => Number(b.pinned) - Number(a.pinned))
})

function fmtCn(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${y} 年 ${m} 月 ${d} 日`
}
</script>

<template>
  <div class="post-list">
    <div class="post-list-main">
      <p class="site-subtitle">{{ site.description }}</p>

    <header class="list-header">
      <h1>{{ selectedDate ? `${fmtCn(selectedDate)} 的文章` : '全部文章' }}</h1>
      <div class="list-meta">
        <span>共 {{ filtered.length }} 篇</span>
        <button v-if="selectedDate" type="button" class="clear-btn" @click="selectDate(null)">
          清除筛选
        </button>
      </div>
    </header>

    <ul class="post-cards">
      <li v-for="post in filtered" :key="post.url">
        <article class="post-card">
          <time class="post-date" :datetime="post.date">{{ post.date }}</time>
          <h2 class="post-title">
            <svg v-if="post.pinned" class="pin-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
            </svg>
            <!-- 拉伸链接：::after 覆盖整张卡片，点击任意位置进入文章 -->
            <a :href="post.url">{{ post.title }}</a>
          </h2>
          <p v-if="post.description" class="post-desc">{{ post.description }}</p>
          <div v-if="post.tags.length" class="post-tags">
            <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </article>
      </li>
    </ul>

    <p v-if="filtered.length === 0" class="empty">
      {{ selectedDate ? fmtCn(selectedDate) : '' }}还没有文章，点导航栏「日历」换个日期试试。
    </p>
    </div>

    <TimelineNav :posts="posts" />
  </div>
</template>

<style scoped>
.post-list {
  max-width: 980px;
  margin: 0 auto;
  padding: 2.5rem 24px 3rem;
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

.post-list-main {
  flex: 1;
  max-width: 720px;
  min-width: 0;
}

.site-subtitle {
  margin: 0 0 1.5rem;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.list-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 1.25rem;
}

.list-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
}

.list-meta {
  font-size: 13px;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.clear-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  border-radius: 8px;
  padding: 3px 10px;
  font-size: 13px;
  cursor: pointer;
}

.clear-btn:hover {
  border-color: var(--vp-c-brand-1);
}

.post-cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  padding: 20px 22px 18px;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.post-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 3px;
  border-radius: 3px;
  background: var(--vp-c-brand-1);
  opacity: 0;
  transition: opacity 0.2s;
}

.post-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(90, 80, 60, 0.1);
}

.post-card:hover::before {
  opacity: 1;
}

.post-card:focus-within {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-1);
}

.post-date {
  display: inline-block;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 2px 10px;
}

.post-title {
  margin: 10px 0 8px;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.45;
}

.pin-icon {
  width: 15px;
  height: 15px;
  margin-right: 6px;
  color: var(--vp-c-brand-1);
  vertical-align: -2px;
  flex-shrink: 0;
}

.post-title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.post-title a::after {
  content: '';
  position: absolute;
  inset: 0;
}

.post-title a:hover {
  color: var(--vp-c-brand-1);
}

.post-desc {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.8;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 12px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 2px 10px;
}

.empty {
  text-align: center;
  color: var(--vp-c-text-2);
  padding: 2rem 0;
}
</style>
