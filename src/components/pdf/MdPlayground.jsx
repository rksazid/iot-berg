import { useMemo, useState } from 'react'
import { endpointOptions } from '../../config/pdfService'
import { generatePdf } from '../../lib/pdfClient'
import { markdownPreviewShell, renderMarkdown } from '../../lib/markdownPreview'
import { EditorWorkspace } from './EditorWorkspace'
import { starterMarkdown } from '../../data/mdExamples'
import {
  footerTemplateExample,
  headerTemplateExample,
} from '../../data/pdfExamples'

const formats = ['A4', 'Letter', 'A3', 'Legal', 'Tabloid']
const FORM_ID = 'markdown-to-pdf-form'

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
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
    generationTime: '',
    usedEndpoint: '',
  })

  const renderedHtml = useMemo(() => renderMarkdown(formState.markdown), [formState.markdown])

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

  return (
    <section className="playground-panel">
      <form className="pdf-form" id={FORM_ID} onSubmit={handleSubmit}>
        <EditorWorkspace
          title="Markdown Document & Live Parsing"
          description="Supports GitHub Flavored Markdown (GFM), syntax highlighting, tables, and task lists."
          language="markdown"
          value={formState.markdown}
          onChange={(markdown) => updateField('markdown', markdown)}
          preview={{
            label: 'Rendered HTML Output',
            note: 'GFM Compliance',
            frame: { shell: markdownPreviewShell, bodyHtml: renderedHtml },
          }}
          syncScroll
          fileAccept=".md,.markdown,.txt"
          fullscreenTitle="IoT-Berg Markdown Studio"
          formId={FORM_ID}
          status={status}
          controls={
            <label className="field-inline-select">
              <span>Endpoint:</span>
              <select value={formState.endpointMode} onChange={(e) => updateField('endpointMode', e.target.value)}>
                {endpointOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </label>
          }
        />

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
