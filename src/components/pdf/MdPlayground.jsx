import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { marked } from 'marked'
import { endpointOptions } from '../../config/pdfService'
import { generatePdf } from '../../lib/pdfClient'
import { ResizableSplit } from '../ui/ResizableSplit'
import { CodeEditor } from '../ui/CodeEditor'
import { EditorToolbar } from '../ui/EditorToolbar'
import { starterMarkdown } from '../../data/mdExamples'
import {
  footerTemplateExample,
  headerTemplateExample,
} from '../../data/pdfExamples'

const formats = ['A4', 'Letter', 'A3', 'Legal', 'Tabloid']

const initialState = {
  endpointMode: 'auto',
  markdown: starterMarkdown,
  format: 'A4',
  landscape: false,
  marginTop: '1cm',
  marginRight: '1cm',
  marginBottom: '1cm',
  marginLeft: '1cm',
  printBackground: true,
  scale: '1',
  displayHeaderFooter: false,
  headerTemplate: headerTemplateExample,
  footerTemplate: footerTemplateExample,
  preferCSSPageSize: false,
}

function toPayload(state) {
  const payload = {
    markdown: state.markdown,
    format: state.format,
    landscape: state.landscape,
    margin: {
      top: state.marginTop,
      right: state.marginRight,
      bottom: state.marginBottom,
      left: state.marginLeft,
    },
    printBackground: state.printBackground,
    scale: Number(state.scale),
    displayHeaderFooter: state.displayHeaderFooter,
    preferCSSPageSize: state.preferCSSPageSize,
  }

  if (state.displayHeaderFooter) {
    payload.headerTemplate = state.headerTemplate
    payload.footerTemplate = state.footerTemplate
  }

  return payload
}

function getDefaultFilename() {
  const now = new Date()
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `iot-berg-markdown-${stamp}.pdf`
}

function startDownload(blob, filename) {
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename || getDefaultFilename()
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000)
}

export function MdPlayground() {
  const [formState, setFormState] = useState(initialState)
  const [outputFilename, setOutputFilename] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
    generationTime: '',
    usedEndpoint: '',
  })

  const editorRef = useRef(null)
  const fsEditorRef = useRef(null)

  const renderedHtml = useMemo(() => marked.parse(formState.markdown), [formState.markdown])

  const closeFullscreen = useCallback((e) => {
    if (e.key === 'Escape') setFullscreen(false)
  }, [])

  useEffect(() => {
    if (fullscreen) {
      document.addEventListener('keydown', closeFullscreen)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', closeFullscreen)
      document.body.style.overflow = ''
    }
  }, [fullscreen, closeFullscreen])

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: '', generationTime: '', usedEndpoint: '' })

    try {
      const result = await generatePdf({
        endpointMode: formState.endpointMode,
        apiPath: 'md-to-pdf',
        payload: toPayload(formState),
      })

      const name = outputFilename.trim()
        ? (outputFilename.trim().endsWith('.pdf') ? outputFilename.trim() : `${outputFilename.trim()}.pdf`)
        : getDefaultFilename()
      startDownload(result.blob, name)

      setStatus({
        loading: false,
        error: '',
        success: 'Markdown document converted and download started.',
        generationTime: result.generationTime,
        usedEndpoint: result.usedEndpoint,
      })
    } catch (error) {
      setStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Something went wrong while generating the PDF.',
        success: '',
        generationTime: '',
        usedEndpoint: '',
      })
    }
  }

  function handleReset() {
    setFormState(initialState)
    setOutputFilename('')
    setStatus({ loading: false, error: '', success: '', generationTime: '', usedEndpoint: '' })
  }

  const editorPane = (ref, isFullscreen = false) => (
    <div className="editor-pane">
      <EditorToolbar editorRef={ref} language="markdown" />
      <CodeEditor
        ref={ref}
        value={formState.markdown}
        onChange={(v) => updateField('markdown', v)}
        language="markdown"
        height={isFullscreen ? 'calc(100vh - 52px)' : '460px'}
      />
    </div>
  )

  const previewPane = (
    <div className="preview-pane-wrap">
      <div className="preview-pane-bar">
        <span className="preview-badge">Rendered HTML Output</span>
        <span className="preview-sub">GFM Compliance</span>
      </div>
      <div
        className="md-preview-panel"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  )

  return (
    <section className="playground-panel">
      <form className="pdf-form" onSubmit={handleSubmit}>
        {/* Editor & Preview Header Section */}
        <div className="form-section">
          <div className="section-head section-head-row">
            <div>
              <h3>Markdown Document & Live Parsing</h3>
              <p>Supports GitHub Flavored Markdown (GFM), syntax highlighting, tables, and task lists.</p>
            </div>

            <div className="header-controls-row">
              <label className="field-inline-select">
                <span>Endpoint:</span>
                <select value={formState.endpointMode} onChange={(e) => updateField('endpointMode', e.target.value)}>
                  {endpointOptions.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              </label>

              <div className="field-header-actions">
                <button
                  type="button"
                  className={`preview-toggle-btn${showPreview ? ' active' : ''}`}
                  onClick={() => setShowPreview((v) => !v)}
                  title="Toggle side-by-side preview"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </button>
                {showPreview && (
                  <button
                    type="button"
                    className="preview-toggle-btn"
                    onClick={() => setFullscreen(true)}
                    title="Open Fullscreen Studio"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    <span>Fullscreen</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="editor-container">
            <div className={`input-split${showPreview ? '' : ' preview-hidden'}`}>
              {editorPane(editorRef, false)}
              {showPreview && previewPane}
            </div>
          </div>
        </div>

        {fullscreen && showPreview && createPortal(
          <div className="fullscreen-overlay">
            <div className="fullscreen-header">
              <div className="fs-title-wrap">
                <span className="brand-dot" />
                <span>IoT-Berg Markdown Studio — Fullscreen Workspace</span>
              </div>
              <button type="button" className="button button-secondary" onClick={() => setFullscreen(false)}>
                Exit Fullscreen (Esc)
              </button>
            </div>
            <ResizableSplit
              left={editorPane(fsEditorRef, true)}
              right={previewPane}
            />
          </div>,
          document.body,
        )}

        {/* PDF Page Options Section */}
        <div className="form-section">
          <div className="section-head section-head-row">
            <div>
              <h3>PDF Layout & Print Parameters</h3>
              <p>Precise rendering options passed directly to the Chromium print pipeline.</p>
            </div>
            <button
              type="button"
              className="toggle-advanced-btn"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
            </button>
          </div>

          <div className="form-grid-modern">
            <label className="field-group">
              <span className="field-label">Paper Format</span>
              <select className="select-input" value={formState.format} onChange={(e) => updateField('format', e.target.value)}>
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>

            <label className="field-group">
              <span className="field-label">Render Zoom Scale</span>
              <div className="scale-input-wrap">
                <input
                  type="number"
                  className="text-input"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={formState.scale}
                  onChange={(e) => updateField('scale', e.target.value)}
                />
                <span className="unit-label">x</span>
              </div>
            </label>

            <div className="field-group field-span-2">
              <span className="field-label">Print Orientation & Media</span>
              <div className="checkboxes-pill-row">
                <label className={`pill-checkbox${formState.landscape ? ' selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formState.landscape}
                    onChange={(e) => updateField('landscape', e.target.checked)}
                  />
                  <span>Landscape Mode</span>
                </label>

                <label className={`pill-checkbox${formState.printBackground ? ' selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formState.printBackground}
                    onChange={(e) => updateField('printBackground', e.target.checked)}
                  />
                  <span>Print Background Colors</span>
                </label>

                <label className={`pill-checkbox${formState.preferCSSPageSize ? ' selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formState.preferCSSPageSize}
                    onChange={(e) => updateField('preferCSSPageSize', e.target.checked)}
                  />
                  <span>CSS @page Size Override</span>
                </label>

                <label className={`pill-checkbox${formState.displayHeaderFooter ? ' selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formState.displayHeaderFooter}
                    onChange={(e) => updateField('displayHeaderFooter', e.target.checked)}
                  />
                  <span>Header & Footer Templates</span>
                </label>
              </div>
            </div>

            {/* Margins Row */}
            <div className="field-group field-span-2">
              <span className="field-label">Page Margins (Top / Right / Bottom / Left)</span>
              <div className="margins-quad-row">
                <div className="margin-input-box">
                  <span className="margin-tag">Top</span>
                  <input
                    type="text"
                    className="text-input"
                    value={formState.marginTop}
                    onChange={(e) => updateField('marginTop', e.target.value)}
                    placeholder="1cm"
                  />
                </div>
                <div className="margin-input-box">
                  <span className="margin-tag">Right</span>
                  <input
                    type="text"
                    className="text-input"
                    value={formState.marginRight}
                    onChange={(e) => updateField('marginRight', e.target.value)}
                    placeholder="1cm"
                  />
                </div>
                <div className="margin-input-box">
                  <span className="margin-tag">Bottom</span>
                  <input
                    type="text"
                    className="text-input"
                    value={formState.marginBottom}
                    onChange={(e) => updateField('marginBottom', e.target.value)}
                    placeholder="1cm"
                  />
                </div>
                <div className="margin-input-box">
                  <span className="margin-tag">Left</span>
                  <input
                    type="text"
                    className="text-input"
                    value={formState.marginLeft}
                    onChange={(e) => updateField('marginLeft', e.target.value)}
                    placeholder="1cm"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Options Accordion */}
            {showAdvanced && formState.displayHeaderFooter && (
              <>
                <label className="field-group field-span-2">
                  <span className="field-label">Header HTML Template</span>
                  <textarea
                    rows="3"
                    className="text-area-code"
                    value={formState.headerTemplate}
                    onChange={(e) => updateField('headerTemplate', e.target.value)}
                  />
                </label>
                <label className="field-group field-span-2">
                  <span className="field-label">Footer HTML Template</span>
                  <textarea
                    rows="3"
                    className="text-area-code"
                    value={formState.footerTemplate}
                    onChange={(e) => updateField('footerTemplate', e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Live Status Feedback Notification */}
        {(status.error || status.success || status.loading) && (
          <div className="status-panel">
            {status.loading && (
              <div className="status-message status-loading">
                <span className="spinner" />
                <span>Compiling markdown and generating PDF buffer…</span>
              </div>
            )}
            {status.error && (
              <div className="status-message status-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{status.error}</span>
              </div>
            )}
            {status.success && (
              <div className="status-message status-success">
                <div className="status-success-head">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span>{status.success}</span>
                </div>
                <div className="status-meta-badges">
                  {status.generationTime && (
                    <span className="meta-badge-item">
                      ⚡ Render Time: <strong>{status.generationTime}ms</strong>
                    </span>
                  )}
                  {status.usedEndpoint && (
                    <span className="meta-badge-item">
                      Server: <strong>{status.usedEndpoint}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Unified Bottom Action Bar with Filename */}
        <div className="workspace-action-bar">
          <div className="filename-input-wrap">
            <span className="filename-label">Save as:</span>
            <input
              type="text"
              className="filename-input"
              value={outputFilename}
              onChange={(e) => setOutputFilename(e.target.value)}
              placeholder={getDefaultFilename()}
            />
          </div>

          <div className="action-buttons-group">
            <button className="button button-secondary" type="button" onClick={handleReset}>
              Reset Template
            </button>
            <button className="button button-primary action-btn-generate" type="submit" disabled={status.loading}>
              {status.loading ? (
                <>
                  <span className="spinner-white" />
                  <span>Generating PDF…</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Generate & Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
