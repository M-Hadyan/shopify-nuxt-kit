const ALLOWED = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'h2', 'h3', 'h4', 'span'])

// ينظف HTML الوصف قبل كتابته في سلة: يسمح بوسوم نصية بسيطة فقط وبدون أي خصائص
export function sanitizeDescription(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed|template)[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (tag, name: string) => {
      const n = name.toLowerCase()
      if (!ALLOWED.has(n)) return ''
      return tag.startsWith('</') ? `</${n}>` : n === 'br' ? '<br>' : `<${n}>`
    })
    .trim()
}
