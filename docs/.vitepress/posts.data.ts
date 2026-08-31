import { createContentLoader } from 'vitepress'

export interface Post {
  /** 文章标题 */
  title: string
  /** 发布日期，格式 YYYY-MM-DD */
  date: string
  /** 标签列表 */
  tags: string[]
  /** 文章简述：自动取正文首段，超长截断加省略号 */
  description: string
  /** 文章页面链接 */
  url: string
}

/** 把 frontmatter 里的日期统一转成 YYYY-MM-DD 字符串（未加引号的日期可能被解析成 Date 对象） */
function toDateStr(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value ?? '').slice(0, 10)
}

/** 从渲染后的 HTML 取第一个段落（<p>），去掉标签得到纯文本 */
function firstParagraphText(html: string): string {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  if (!m) return ''
  return m[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 首段超长时截断，结尾加省略号 */
function truncate(text: string, max: number): string {
  const t = text.trim()
  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t
}

export default createContentLoader('posts/*.md', {
  render: true,
  transform(raw): Post[] {
    return raw
      .map(({ url, frontmatter, html }) => ({
        title: String(frontmatter.title ?? ''),
        date: toDateStr(frontmatter.date),
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
        description: truncate(firstParagraphText(html ?? ''), 120),
        url,
      }))
      .filter((post) => post.title && post.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  },
})
