import { marked } from 'marked'

export function renderMarkdown(markdown) {
  return marked.parse(markdown ?? '', { gfm: true })
}

// The rendered Markdown is shown inside a sandboxed frame, which does not
// inherit the site stylesheet, so the document styles live here.
const styles = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 1.5rem 1.75rem 2.5rem;
    background: #ffffff;
    color: #1e293b;
    font: 400 0.9rem/1.7 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow-wrap: break-word;
  }
  body > :first-child { margin-top: 0; }
  h1, h2, h3, h4, h5, h6 {
    margin: 1.5rem 0 0.5rem;
    color: #0f172a;
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.3;
    letter-spacing: -0.015em;
  }
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.3rem; padding-bottom: 0.3rem; border-bottom: 1px solid #e2e8f0; }
  h3 { font-size: 1.08rem; }
  p, ul, ol, blockquote, table, pre { margin: 0 0 1rem; }
  ul, ol { padding-left: 1.4rem; }
  li + li { margin-top: 0.2rem; }
  li > input[type='checkbox'] { margin: 0 0.45rem 0 0; }
  /* Links are shown, not followed: a click would navigate the preview away. */
  a { color: #4338ca; pointer-events: none; }
  img { max-width: 100%; height: auto; }
  hr { margin: 1.5rem 0; border: 0; border-top: 1px solid #cbd5e1; }
  blockquote {
    padding: 0.6rem 1rem;
    border-left: 3px solid #a5b4fc;
    border-radius: 0 0.5rem 0.5rem 0;
    background: #f8fafc;
    color: #475569;
  }
  blockquote > :last-child { margin-bottom: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
  th, td { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; text-align: left; }
  th { background: #f1f5f9; font-weight: 700; }
  code {
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    background: #f1f5f9;
    font: 0.8rem 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
  }
  pre {
    padding: 1rem;
    border-radius: 0.75rem;
    background: #090d16;
    color: #e2e8f0;
    overflow-x: auto;
  }
  pre code { padding: 0; background: none; font-size: 0.82rem; color: inherit; }
`

export const markdownPreviewShell = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap">
<style>${styles}</style>
</head>
<body></body>
</html>`
