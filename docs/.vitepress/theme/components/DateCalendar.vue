<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { data as posts } from '../../posts.data'
import { usePostFilter } from '../composables/usePostFilter'

const { selectedDate, selectDate } = usePostFilter()

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

const today = new Date()
const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

const initial = selectedDate.value ?? todayStr
const [initY, initM] = initial.split('-').map(Number)
const viewYear = ref(initY)
const viewMonth = ref(initM - 1)

// 筛选日期变化时（点选日期 / URL 带入），日历跳到对应月份
watch(selectedDate, (val) => {
  if (val) {
    const [y, m] = val.split('-').map(Number)
    viewYear.value = y
    viewMonth.value = m - 1
  }
})

const postDates = computed(() => new Set(posts.map((p) => p.date)))

const grid = computed(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const offset = (new Date(year, month, 1).getDay() + 6) % 7 // 周一为一周开头
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateStr(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
})

function shiftMonth(delta: number) {
  let m = viewMonth.value + delta
  let y = viewYear.value
  if (m < 0) {
    m = 11
    y--
  } else if (m > 11) {
    m = 0
    y++
  }
  viewMonth.value = m
  viewYear.value = y
}

function shiftYear(delta: number) {
  viewYear.value += delta
}

function goToday() {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth()
}

function toggle(date: string) {
  selectDate(date === selectedDate.value ? null : date)
}
</script>

<template>
  <div class="cal">
    <div class="cal-header">
      <button type="button" class="nav-btn" aria-label="上一年" @click="shiftYear(-1)">«</button>
      <button type="button" class="nav-btn" aria-label="上个月" @click="shiftMonth(-1)">‹</button>
      <div class="cal-title">{{ viewYear }} 年 {{ viewMonth + 1 }} 月</div>
      <button type="button" class="nav-btn" aria-label="下个月" @click="shiftMonth(1)">›</button>
      <button type="button" class="nav-btn" aria-label="下一年" @click="shiftYear(1)">»</button>
      <button type="button" class="today-btn" @click="goToday">今天</button>
    </div>

    <div class="cal-grid" role="grid">
      <div v-for="w in WEEKDAYS" :key="w" class="cal-weekday">{{ w }}</div>
      <button
        v-for="(cell, i) in grid"
        :key="i"
        type="button"
        class="cal-day"
        :class="{
          empty: !cell,
          today: cell === todayStr,
          selected: cell !== null && cell === selectedDate,
          'has-post': cell !== null && postDates.has(cell),
        }"
        :disabled="!cell"
        :aria-label="cell ?? undefined"
        @click="cell && toggle(cell)"
      >
        <span class="day-num">{{ cell ? Number(cell.slice(8)) : '' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.cal-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.cal-title {
  flex: 1;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
}

.nav-btn,
.today-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 12px;
}

.nav-btn:hover,
.today-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-weekday {
  text-align: center;
  font-size: 11px;
  color: var(--vp-c-text-2);
  padding: 2px 0;
}

.cal-day {
  position: relative;
  aspect-ratio: 1;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-3);
  font-size: 12px;
  padding: 0;
}

/* 有文章的日期用深色字突出，无文章的日期保持浅色 */
.cal-day.has-post {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.cal-day.empty {
  visibility: hidden;
}

.cal-day:hover:not(.empty) {
  background: var(--vp-c-bg-alt);
}

.day-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.cal-day.today .day-num {
  box-shadow: inset 0 0 0 1px var(--vp-c-brand-1);
}

.cal-day.selected {
  background: var(--vp-c-brand-1);
}

.cal-day.selected .day-num {
  color: #fff;
}
</style>
