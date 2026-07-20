export function splitBlogParagraphs(content: string): string[] {
  if (!content) return [];
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
