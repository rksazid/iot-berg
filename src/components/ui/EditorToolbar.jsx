const htmlButtons = [
  { label: 'H1', title: 'Heading 1', before: '<h1>', after: '</h1>' },
  { label: 'H2', title: 'Heading 2', before: '<h2>', after: '</h2>' },
  { label: 'H3', title: 'Heading 3', before: '<h3>', after: '</h3>' },
  null,
  { label: 'B', title: 'Bold', before: '<strong>', after: '</strong>' },
  { label: 'I', title: 'Italic', before: '<em>', after: '</em>' },
  { label: 'U', title: 'Underline', before: '<u>', after: '</u>' },
  { label: 'S', title: 'Strikethrough', before: '<s>', after: '</s>' },
  null,
  { label: '<>', title: 'Inline code', before: '<code>', after: '</code>' },
  { label: 'Link', title: 'Hyperlink', before: '<a href="">', after: '</a>' },
  { label: 'Img', title: 'Image', before: '<img src="" alt="', after: '" />' },
  null,
  { label: 'UL', title: 'Unordered list', before: '<ul>\n  <li>', after: '</li>\n</ul>' },
  { label: 'OL', title: 'Ordered list', before: '<ol>\n  <li>', after: '</li>\n</ol>' },
  { label: 'P', title: 'Paragraph', before: '<p>', after: '</p>' },
  null,
  { label: 'Pre', title: 'Code block', before: '<pre><code>', after: '</code></pre>' },
  { label: 'HR', title: 'Horizontal rule', before: '<hr />', after: '', block: true },
  {
    label: 'Table', title: 'Insert table', block: true,
    before: '<table>\n  <thead>\n    <tr><th>Col 1</th><th>Col 2</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Cell</td><td>Cell</td></tr>\n  </tbody>\n</table>',
    after: '',
  },
]

const mdButtons = [
  { label: 'H1', title: 'Heading 1', before: '# ', after: '' },
  { label: 'H2', title: 'Heading 2', before: '## ', after: '' },
  { label: 'H3', title: 'Heading 3', before: '### ', after: '' },
  null,
  { label: 'B', title: 'Bold', before: '**', after: '**' },
  { label: 'I', title: 'Italic', before: '_', after: '_' },
  { label: 'S', title: 'Strikethrough', before: '~~', after: '~~' },
  { label: '<>', title: 'Inline code', before: '`', after: '`' },
  null,
  { label: 'Link', title: 'Link', before: '[', after: '](url)' },
  { label: 'Img', title: 'Image', before: '![alt](', after: ')' },
  { label: 'Quote', title: 'Blockquote', before: '> ', after: '' },
  null,
  { label: 'UL', title: 'Unordered list item', before: '- ', after: '' },
  { label: 'OL', title: 'Ordered list item', before: '1. ', after: '' },
  { label: '```', title: 'Code block', before: '```\n', after: '\n```' },
  null,
  { label: 'HR', title: 'Horizontal rule', before: '\n---\n', after: '' },
  {
    label: 'Table', title: 'Insert table',
    before: '| Col 1 | Col 2 |\n|-------|-------|\n| Cell  | Cell  |',
    after: '',
  },
]

export function EditorToolbar({ editorRef, language = 'html' }) {
  const buttons = language === 'html' ? htmlButtons : mdButtons

  function handleClick(btn) {
    if (!btn || !editorRef.current) return
    if (btn.block) {
      editorRef.current.insertBlock(btn.before)
    } else {
      editorRef.current.insert(btn.before, btn.after)
    }
  }

  return (
    <div className="editor-toolbar">
      {buttons.map((btn, i) =>
        btn === null ? (
          <span key={`sep-${i}`} className="toolbar-sep" />
        ) : (
          <button
            key={btn.label + btn.before}
            type="button"
            className="toolbar-btn"
            title={btn.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleClick(btn)}
          >
            {btn.label}
          </button>
        )
      )}
    </div>
  )
}
