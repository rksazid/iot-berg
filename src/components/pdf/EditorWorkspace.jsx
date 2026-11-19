import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CodeEditor } from '../ui/CodeEditor'
import { EditorToolbar } from '../ui/EditorToolbar'
import { PreviewFrame } from '../ui/PreviewFrame'
import { ResizableSplit } from '../ui/ResizableSplit'

const MAX_SOURCE_BYTES = 2 * 1024 * 1024 // the conversion API rejects larger sources

const fullscreenViews = [
  { key: 'left', label: 'Editor' },
  { key: 'split', label: 'Split' },
  { key: 'right', label: 'Preview' },
]

const icons = {
  open: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  preview: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  fullscreen: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
}

/**
 * The source editor and its live preview, side by side, with a fullscreen
 * mode. Shared by the HTML and Markdown studios.
 *
 * `preview` is { label, note, frame } where `frame` holds the PreviewFrame
 * content props (`html`, or `shell` + `bodyHtml`).
 * `formId` and `status` connect the fullscreen Generate button to the
 * surrounding form, so a PDF can be made without leaving fullscreen.
 */
export function EditorWorkspace({
  title,
  description,
  language,
  value,
  onChange,
  preview,
  syncScroll = false,
  controls,
  fileAccept,
  fullscreenTitle,
  formId,
  status,
}) {
  const [showPreview, setShowPreview] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [fullscreenView, setFullscreenView] = useState('split')
  const [fileError, setFileError] = useState('')

  // The inline and fullscreen workspaces are separate editor instances kept in
  // step through `value`, each paired with its own preview.
  const inline = { editor: useRef(null), preview: useRef(null) }
  const expanded = { editor: useRef(null), preview: useRef(null) }
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!fullscreen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [fullscreen])

  async function handleFileChosen(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow choosing the same file again
    if (!file) return
    if (file.size > MAX_SOURCE_BYTES) {
      setFileError(`"${file.name}" is larger than the 2 MB limit.`)
      return
    }
    try {
      onChange(await file.text())
      setFileError('')
    } catch {
      setFileError(`"${file.name}" could not be read.`)
    }
  }

  const editorPane = (refs) => (
    <div className="editor-pane">
      <EditorToolbar editorRef={refs.editor} language={language} />
      <CodeEditor
        ref={refs.editor}
        value={value}
        onChange={onChange}
        onScroll={syncScroll ? (fraction) => refs.preview.current?.scrollToFraction(fraction) : undefined}
        language={language}
      />
    </div>
  )

  const previewPane = (refs) => (
    <div className="preview-pane-wrap">
      <div className="preview-pane-bar">
        <span className="preview-badge">{preview.label}</span>
        <span className="preview-sub">{preview.note}</span>
      </div>
      <PreviewFrame ref={refs.preview} title={preview.label} {...preview.frame} />
    </div>
  )

  return (
    <div className="form-section">
      <div className="section-head section-head-row">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <div className="header-controls-row">
          {controls}

          <div className="field-header-actions">
            <input ref={fileInputRef} type="file" accept={fileAccept} hidden onChange={handleFileChosen} />
            <button
              type="button"
              className="preview-toggle-btn"
              onClick={() => fileInputRef.current?.click()}
              title={`Load a file from your device (${fileAccept.split(',').join(', ')})`}
            >
              {icons.open}
              <span>Open File</span>
            </button>
            <button
              type="button"
              className={`preview-toggle-btn${showPreview ? ' active' : ''}`}
              onClick={() => setShowPreview((current) => !current)}
              aria-pressed={showPreview}
              title="Toggle the side-by-side preview"
            >
              {icons.preview}
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
            <button
              type="button"
              className="preview-toggle-btn"
              onClick={() => setFullscreen(true)}
              title="Open the fullscreen workspace"
            >
              {icons.fullscreen}
              <span>Fullscreen</span>
            </button>
          </div>
        </div>
      </div>

      {fileError && (
        <div className="status-message status-error" role="alert">
          <span>{fileError}</span>
        </div>
      )}

      <div className={`input-split${showPreview ? '' : ' preview-hidden'}`}>
        {editorPane(inline)}
        {showPreview && previewPane(inline)}
      </div>

      {fullscreen &&
        createPortal(
          <div className="fullscreen-overlay" role="dialog" aria-modal="true" aria-label={fullscreenTitle}>
            <div className="fullscreen-header">
              <div className="fs-title-wrap">
                <span className="brand-dot" />
                <span>{fullscreenTitle}</span>
              </div>

              <div className="fs-view-toggle" role="group" aria-label="Workspace layout">
                {fullscreenViews.map((view) => (
                  <button
                    key={view.key}
                    type="button"
                    className={`fs-view-btn${fullscreenView === view.key ? ' active' : ''}`}
                    aria-pressed={fullscreenView === view.key}
                    onClick={() => setFullscreenView(view.key)}
                  >
                    {view.label}
                  </button>
                ))}
              </div>

              <div className="fs-actions">
                {status?.error && (
                  <span className="fs-status fs-status-error" role="alert" title={status.error}>
                    {status.error}
                  </span>
                )}
                {status?.success && !status.loading && (
                  <span className="fs-status fs-status-success" role="status">
                    PDF downloaded
                  </span>
                )}
                <button type="submit" form={formId} className="button button-primary button-sm" disabled={status?.loading}>
                  {status?.loading && <span className="spinner-white" />}
                  <span>{status?.loading ? 'Generating…' : 'Generate PDF'}</span>
                </button>
                <button type="button" className="button button-secondary button-sm" onClick={() => setFullscreen(false)}>
                  Exit (Esc)
                </button>
              </div>
            </div>

            <ResizableSplit view={fullscreenView} left={editorPane(expanded)} right={previewPane(expanded)} />
          </div>,
          document.body,
        )}
    </div>
  )
}
