import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { endpointOptions } from '../../config/pdfService'
import { generatePdf } from '../../lib/pdfClient'
import { ResizableSplit } from '../ui/ResizableSplit'
import { CodeEditor } from '../ui/CodeEditor'
import { EditorToolbar } from '../ui/EditorToolbar'
import {
  footerTemplateExample,
  headerTemplateExample,
  starterTemplate,
} from '../../data/pdfExamples'

const formats = ['A4', 'Letter', 'A3', 'Legal', 'Tabloid']

const initialState = {
  endpointMode: 'auto',
  html: starterTemplate,
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
  waitForSelector: '',
  waitForTimeout: '',
}

function toPayload(state) {
  const payload = {
    html: state.html,
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

  if (state.waitForSelector.trim()) {
    payload.waitForSelector = state.waitForSelector.trim()
  }

  if (state.waitForTimeout !== '') {
    payload.waitForTimeout = Number(state.waitForTimeout)
  }

  return payload
}

function getDefaultFilename() {
  const now = new Date()
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `iot-berg-html-${stamp}.pdf`
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

export function PdfPlayground() {
  const [formState, setFormState] = useState(initialState)
  const [outputFilename, setOutputFilename] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
    generationTime: '',
    usedEndpoint: '',
  })

  const editorRef = useRef(null)
  const fsEditorRef = useRef(null)

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
        apiPath: 'html-to-pdf',
        payload: toPayload(formState),
      })

      const name = outputFilename.trim()
        ? (outputFilename.trim().endsWith('.pdf') ? outputFilename.trim() : `${outputFilename.trim()}.pdf`)
        : getDefaultFilename()
      startDownload(result.blob, name)

      setStatus({
        loading: false,
        error: '',
        success: 'PDF generated and download started.',
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
      <EditorToolbar editorRef={ref} language="html" />
      <CodeEditor
        ref={ref}
        value={formState.html}
        onChange={(v) => updateField('html', v)}
        language="html"
        height={isFullscreen ? 'calc(100vh - 52px)' : '420px'}
      />
    </div>
  )

  const previewPane = (
    <iframe
      className="html-preview-frame"
      title="HTML Preview"
      srcDoc={formState.html}
      sandbox=""
    />
  )

  return (
    <section className="playground-panel">
      <form className="pdf-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="section-head">
            <h2>HTML Input</h2>
            <p>Full HTML with inline styles and external assets is supported.</p>
          </div>

          <div className="form-grid">
            <label className="field field-wide">
              <span>Endpoint Mode</span>
              <select value={formState.endpointMode} onChange={(e) => updateField('endpointMode', e.target.value)}>
                {endpointOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </label>

            <div className="field field-wide">
              <div className="field-header">
                <span>HTML Input</span>
                <div className="field-header-actions">
                  <button type="button" className="preview-toggle" onClick={() => setShowPreview((v) => !v)}>
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  {showPreview && (
                    <button type="button" className="preview-toggle" onClick={() => setFullscreen(true)}>
                      Fullscreen
                    </button>
                  )}
                </div>
              </div>
              <div className={`input-split${showPreview ? '' : ' preview-hidden'}`}>
                {editorPane(editorRef, false)}
                {showPreview && previewPane}
              </div>
            </div>
          </div>
        </div>

        {fullscreen && showPreview && createPortal(
          <div className="fullscreen-overlay">
            <div className="fullscreen-header">
              <span>HTML Editor + Preview</span>
              <button type="button" className="preview-toggle" onClick={() => setFullscreen(false)}>
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

        <div className="form-section">
          <div className="section-head">
            <h2>PDF Options</h2>
            <p>These values map directly to the Puppeteer PDF options.</p>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Format</span>
              <select value={formState.format} onChange={(e) => updateField('format', e.target.value)}>
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Scale</span>
              <input type="number" min="0.1" max="2" step="0.1" value={formState.scale}
                onChange={(e) => updateField('scale', e.target.value)} />
            </label>

            <label className="field checkbox-field">
              <input type="checkbox" checked={formState.landscape}
                onChange={(e) => updateField('landscape', e.target.checked)} />
              <span>Landscape orientation</span>
            </label>

            <label className="field checkbox-field">
              <input type="checkbox" checked={formState.printBackground}
                onChange={(e) => updateField('printBackground', e.target.checked)} />
              <span>Print background</span>
            </label>

            <label className="field checkbox-field">
              <input type="checkbox" checked={formState.preferCSSPageSize}
                onChange={(e) => updateField('preferCSSPageSize', e.target.checked)} />
              <span>Prefer CSS page size</span>
            </label>

            <label className="field checkbox-field">
              <input type="checkbox" checked={formState.displayHeaderFooter}
                onChange={(e) => updateField('displayHeaderFooter', e.target.checked)} />
              <span>Display header and footer</span>
            </label>

            <label className="field">
              <span>Margin Top</span>
              <input type="text" value={formState.marginTop}
                onChange={(e) => updateField('marginTop', e.target.value)} />
            </label>

            <label className="field">
              <span>Margin Right</span>
              <input type="text" value={formState.marginRight}
                onChange={(e) => updateField('marginRight', e.target.value)} />
            </label>

            <label className="field">
              <span>Margin Bottom</span>
              <input type="text" value={formState.marginBottom}
                onChange={(e) => updateField('marginBottom', e.target.value)} />
            </label>

            <label className="field">
              <span>Margin Left</span>
              <input type="text" value={formState.marginLeft}
                onChange={(e) => updateField('marginLeft', e.target.value)} />
            </label>

            <label className="field">
              <span>Wait For Selector</span>
              <input type="text" value={formState.waitForSelector}
                onChange={(e) => updateField('waitForSelector', e.target.value)}
                placeholder=".chart-ready" />
            </label>

            <label className="field">
              <span>Wait For Timeout (ms)</span>
              <input type="number" min="0" max="5000" step="100" value={formState.waitForTimeout}
                onChange={(e) => updateField('waitForTimeout', e.target.value)}
                placeholder="2000" />
            </label>

            {formState.displayHeaderFooter && (
              <>
                <label className="field field-wide">
                  <span>Header Template</span>
                  <textarea rows="5" value={formState.headerTemplate}
                    onChange={(e) => updateField('headerTemplate', e.target.value)} />
                </label>
                <label className="field field-wide">
                  <span>Footer Template</span>
                  <textarea rows="5" value={formState.footerTemplate}
                    onChange={(e) => updateField('footerTemplate', e.target.value)} />
                </label>
              </>
            )}
          </div>
        </div>

        <div className="status-panel">
          {status.error && <p className="status-message status-error">{status.error}</p>}
          {status.success && <p className="status-message status-success">{status.success}</p>}
          {status.usedEndpoint && <p className="status-message">Used endpoint: {status.usedEndpoint}</p>}
          {status.generationTime && <p className="status-message">Generation time: {status.generationTime} ms</p>}
        </div>

        <div className="form-section">
          <div className="form-grid">
            <label className="field field-wide">
              <span>Output Filename</span>
              <input type="text" value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                placeholder={getDefaultFilename()} />
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={status.loading}>
            {status.loading ? 'Generating…' : 'Generate PDF'}
          </button>
          <button className="button button-secondary" type="button" onClick={handleReset}>
            Reset Example
          </button>
        </div>
      </form>
    </section>
  )
}
