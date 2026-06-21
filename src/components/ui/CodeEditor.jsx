import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

function buildTheme(EditorView, height) {
  return EditorView.theme({
    '&': {
      height,
      fontSize: '13.5px',
      fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Menlo, monospace',
    },
    '.cm-scroller': {
      overflow: 'auto',
      lineHeight: '1.65',
    },
    '.cm-content': {
      padding: '12px 0',
      caretColor: '#4f86f7',
      // Explicit light base color: the editor surface is dark, but the page
      // root sets a dark text color that would otherwise be inherited here,
      // making any un-highlighted token unreadable.
      color: '#cdd9ec',
    },
    '.cm-editor': {
      backgroundColor: '#0b101a',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#4f86f7',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(79,134,247,0.2)',
    },
    '.cm-gutters': {
      backgroundColor: '#080d16',
      color: 'rgba(255,255,255,0.22)',
      border: 'none',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      paddingRight: '8px',
      minWidth: '40px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px 0 12px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(79,134,247,0.05)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(79,134,247,0.08)',
      color: 'rgba(255,255,255,0.55)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(79,134,247,0.25)',
      outline: '1px solid rgba(79,134,247,0.5)',
    },
    '.cm-line': {
      padding: '0 16px',
    },
  })
}

async function loadModules(language) {
  const [
    { EditorState },
    { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine },
    { defaultKeymap, history, historyKeymap, indentWithTab },
    { bracketMatching, indentOnInput, HighlightStyle, syntaxHighlighting },
    { tags },
  ] = await Promise.all([
    import('@codemirror/state'),
    import('@codemirror/view'),
    import('@codemirror/commands'),
    import('@codemirror/language'),
    import('@lezer/highlight'),
  ])

  // HighlightStyle.define throws if any spec entry references an undefined tag
  // (tag names vary between @lezer/highlight versions). A single bad entry
  // rejected the whole loadModules() promise, so the editor never mounted.
  // Drop unknown tags defensively so the editor always initializes.
  const defineHighlight = (specs) => HighlightStyle.define(specs.filter((spec) => spec.tag))

  const htmlHighlight = defineHighlight([
    { tag: tags.tagName, color: '#6fb3ff' },
    { tag: tags.angleBracket, color: '#5a7fa6' },
    { tag: tags.attributeName, color: '#9ecbff' },
    { tag: tags.attributeValue, color: '#7ee787' },
    { tag: tags.string, color: '#7ee787' },
    { tag: tags.comment, color: '#6a737d', fontStyle: 'italic' },
    { tag: tags.documentMeta, color: '#6fb3ff', fontStyle: 'italic' },
    { tag: tags.character, color: '#f9c74f' },
    { tag: tags.content, color: '#e2e8f0' },
    { tag: tags.meta, color: '#b392f0' },
    { tag: tags.keyword, color: '#b392f0' },
    { tag: tags.number, color: '#f9c74f' },
    // Embedded CSS / JS inside <style> and <script>
    { tag: tags.propertyName, color: '#9ecbff' },
    { tag: tags.className, color: '#ffa657' },
    { tag: tags.variableName, color: '#cdd9ec' },
    { tag: tags.definition(tags.variableName), color: '#9ecbff' },
    { tag: tags.atom, color: '#79c0ff' },
    { tag: tags.bool, color: '#79c0ff' },
    { tag: tags.constant(tags.variableName), color: '#79c0ff' },
    { tag: tags.unit, color: '#f9c74f' },
    { tag: tags.color, color: '#7ee787' },
    { tag: tags.operator, color: '#8aa0bd' },
    { tag: tags.punctuation, color: '#8aa0bd' },
    { tag: tags.separator, color: '#8aa0bd' },
    { tag: tags.bracket, color: '#8aa0bd' },
    { tag: tags.brace, color: '#8aa0bd' },
    { tag: tags.squareBracket, color: '#8aa0bd' },
    { tag: tags.paren, color: '#8aa0bd' },
  ])

  const mdHighlight = defineHighlight([
    { tag: tags.heading1, color: '#6fb3ff', fontWeight: '700' },
    { tag: tags.heading2, color: '#79b8ff', fontWeight: '600' },
    { tag: tags.heading3, color: '#85c2ff', fontWeight: '600' },
    { tag: tags.heading, color: '#9ecbff' },
    { tag: tags.strong, color: '#e2e8f0', fontWeight: '700' },
    { tag: tags.emphasis, color: '#c3e0ff', fontStyle: 'italic' },
    { tag: tags.strikethrough, color: '#6a737d', textDecoration: 'line-through' },
    { tag: tags.link, color: '#5eeac4' },
    { tag: tags.url, color: '#5eeac4' },
    { tag: tags.monospace, color: '#f9c74f', fontFamily: '"Fira Code", monospace' },
    { tag: tags.comment, color: '#6a737d', fontStyle: 'italic' },
    { tag: tags.quote, color: '#7ee787', fontStyle: 'italic' },
    { tag: tags.list, color: '#4f86f7' },
    { tag: tags.content, color: '#e2e8f0' },
    { tag: tags.processingInstruction, color: '#b392f0' },
    { tag: tags.atom, color: '#f9c74f' },
    { tag: tags.meta, color: '#b392f0' },
  ])

  let langExtension
  let highlight
  if (language === 'html') {
    const { html } = await import('@codemirror/lang-html')
    langExtension = html()
    highlight = syntaxHighlighting(htmlHighlight)
  } else {
    const { markdown, markdownLanguage } = await import('@codemirror/lang-markdown')
    langExtension = markdown({ base: markdownLanguage })
    highlight = syntaxHighlighting(mdHighlight)
  }

  return { EditorState, EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine, defaultKeymap, history, historyKeymap, indentWithTab, langExtension, highlight, bracketMatching, indentOnInput }
}

export const CodeEditor = forwardRef(function CodeEditor(
  { value, onChange, language = 'html', height = '420px' },
  ref,
) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    async function init() {
      const mods = await loadModules(language)
      if (cancelled || !containerRef.current) return

      const { EditorState, EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine,
        defaultKeymap, history, historyKeymap, indentWithTab, langExtension, highlight,
        bracketMatching, indentOnInput } = mods

      const extensions = [
        lineNumbers(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        buildTheme(EditorView, height),
        highlight,
        langExtension,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        }),
        EditorView.lineWrapping,
      ]

      const state = EditorState.create({ doc: value ?? '', extensions })
      const view = new EditorView({ state, parent: containerRef.current })
      viewRef.current = view
    }

    init().catch(console.error)

    return () => {
      cancelled = true
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, height])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    const next = value ?? ''
    if (current === next) return
    // Replace only the changed region (common prefix/suffix preserved) so a
    // reconciled editor — e.g. the off-screen instance during fullscreen —
    // keeps its caret, scroll, and undo history instead of jumping to 0.
    let from = 0
    const minLen = Math.min(current.length, next.length)
    while (from < minLen && current[from] === next[from]) from++
    let endCur = current.length
    let endNext = next.length
    while (endCur > from && endNext > from && current[endCur - 1] === next[endNext - 1]) {
      endCur--
      endNext--
    }
    view.dispatch({ changes: { from, to: endCur, insert: next.slice(from, endNext) } })
  }, [value])

  useImperativeHandle(ref, () => ({
    insert(before, after = '') {
      const view = viewRef.current
      if (!view) return
      view.focus()
      const { from, to } = view.state.selection.main
      const selected = view.state.sliceDoc(from, to)
      const replacement = before + (selected || (after ? 'text' : '')) + after
      view.dispatch({
        changes: { from, to, insert: replacement },
        selection: {
          anchor: selected ? from + replacement.length : from + before.length,
          head: selected ? from + replacement.length : from + before.length + (after ? 4 : 0),
        },
      })
    },
    insertBlock(text) {
      const view = viewRef.current
      if (!view) return
      view.focus()
      const { from } = view.state.selection.main
      const line = view.state.doc.lineAt(from)
      const prefix = line.from === 0 ? '' : '\n'
      view.dispatch({
        changes: { from: line.to, insert: `${prefix}${text}\n` },
        selection: { anchor: line.to + prefix.length + text.length },
      })
    },
  }), [])

  return <div ref={containerRef} className="code-editor-wrap" />
})
