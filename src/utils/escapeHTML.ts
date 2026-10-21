/** Escape user-entered text before it reaches feedback markup (legacy behaviour). */
export function escapeHTML(value: string): string {
  return String(value).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })
}
