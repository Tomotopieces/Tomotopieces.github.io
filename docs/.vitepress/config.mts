import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vitepress'

/** 从 markdown 源码取第一个非标题段落，去掉 markdown 语法，得到纯文本 */
function firstParagraph(md: string): string {
  const body = md.replace(/^---[\s\S]*?---\n/, '') // 去掉 frontmatter
  const para = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#'))
  if (!para) return ''
  return para
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 超长截断，结尾加省略号 */
function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

/** frontmatter 日期转「YYYY 年 M 月 D 日」（未加引号的日期会被解析成 Date 对象） */
function formatDateCn(value: unknown): string {
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export default defineConfig({
  lang: 'zh-CN',
  title: "Tomoto's Blog",
  description: 'Tomoto 的博客',
  cleanUrls: true,

  markdown: {
    config(md) {
      // 文章页（有 date frontmatter）：在标题下方插入日期/标签元信息，
      // 正文没有 h1 时用 frontmatter title 补一个，像新闻网站一样有完整的文章头
      md.core.ruler.push('post-header', (state) => {
        const fm = state.env.frontmatter
        if (!fm?.date) return
        const tokens = state.tokens
        let h1Close = -1
        for (let i = 0; i < tokens.length; i++) {
          if (tokens[i].type === 'heading_close' && tokens[i].tag === 'h1') {
            h1Close = i
            break
          }
        }
        if (h1Close < 0 && fm.title) {
          const open = new state.Token('heading_open', 'h1', 1)
          const inline = new state.Token('inline', '', 0)
          const text = new state.Token('text', '', 0)
          text.content = String(fm.title)
          inline.children = [text]
          const close = new state.Token('heading_close', 'h1', -1)
          tokens.unshift(open, inline, close)
          h1Close = 2
        }
        const dateHtml = formatDateCn(fm.date)
        const tagsHtml = Array.isArray(fm.tags) && fm.tags.length
          ? fm.tags.map((t) => `<span class="post-meta-tag">${escapeHtml(String(t))}</span>`).join('')
          : ''
        const meta = new state.Token('html_block', '', 0)
        meta.content = `<div class="post-meta"><span class="post-meta-date">${dateHtml}</span>${tagsHtml ? `<span class="post-meta-tags">${tagsHtml}</span>` : ''}</div>`
        tokens.splice(h1Close + 1, 0, meta)
      })
    },
  },

  // 文章页 SEO 描述：frontmatter 不再写 description，自动取正文首段
  transformPageData(pageData, ctx) {
    if (pageData.relativePath.startsWith('posts/') && pageData.filePath) {
      const file = join(ctx.siteConfig.srcDir, pageData.filePath)
      const text = truncate(firstParagraph(readFileSync(file, 'utf8')), 150)
      if (text) pageData.description = text
    }
  },

  themeConfig: {
    nav: [{ text: '首页', link: '/' }],

    outlineTitle: '本页目录',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '重置搜索',
            backButtonTitle: '关闭搜索',
            noResultsText: '没有找到结果：',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '导航',
              navigateUpKeyAriaLabel: '上箭头',
              navigateDownKeyAriaLabel: '下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'Escape',
            },
          },
        },
      },
    },

    footer: {
      message: '由 VitePress 强力驱动',
      copyright: '© Tomoto',
    },
  },
})
