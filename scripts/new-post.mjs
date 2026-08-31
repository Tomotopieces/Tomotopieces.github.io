// 新建一篇笔记：文件名为「当日日期_两位序号.md」，序号自动递增避免重名。
// 文件已包含 frontmatter（标题/描述留空，tags 默认为「随笔」）。
// 用法：npm run new
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const now = new Date()
const dateStr = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
].join('-')

const postsDir = join(process.cwd(), 'docs', 'posts')
mkdirSync(postsDir, { recursive: true })

// 取当天已存在的最大序号，+1 避免重名
const seqRe = new RegExp(`^${dateStr}_(\\d+)\\.md$`)
const nums = readdirSync(postsDir)
  .map((name) => name.match(seqRe)?.[1])
  .filter(Boolean)
  .map(Number)
const seq = nums.length ? Math.max(...nums) + 1 : 1

const filename = `${dateStr}_${String(seq).padStart(2, '0')}.md`
const content = `---
title: 
date: '${dateStr}'
tags: [随笔]
---

`

writeFileSync(join(postsDir, filename), content)
console.log(`已创建笔记：docs/posts/${filename}`)
