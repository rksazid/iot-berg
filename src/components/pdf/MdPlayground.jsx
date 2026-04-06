import { useMemo, useState } from 'react'
import { marked } from 'marked'
import { endpointOptions } from '../../config/pdfService'
import { generatePdf } from '../../lib/pdfClient'
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

function startDownload(blob) {
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = 'iot-berg-markdown.pdf'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl)
  }, 1000)
}

export function MdPlayground() {
  const [formState, setFormState] = useState(initialState)
  const [showPreview, setShowPreview] = useState(true)
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
    generationTime: '',
    usedEndpoint: '',
  })

  const renderedHtml = useMemo(() => marked.parse(formState.markdown), [formState.markdown])

  function updateField(field, value) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setStatus({
      loading: true,
      error: '',
      success: '',
      generationTime: '',
      usedEndpoint: '',
    })

    try {
      const result = await generatePdf({
        endpointMode: formState.endpointMode,
        apiPath: 'md-to-pdf',
        payload: toPayload(formState),
      })

      startDownload(result.blob)

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
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong while generating the PDF.',
        success: '',
        generationTime: '',
        usedEndpoint: '',
      })
    }
  }

  function handleReset() {
    setFormState(initialState)
    setStatus({
      loading: false,
      error: '',
      success: '',
      generationTime: '',
      usedEndpoint: '',
    })
  }

  return (
    <section className="playground-panel glass-panel glass-panel-strong">
      <form className="pdf-form" onSubmit={handleSubmit}>
        <div className="form-section form-section-hero">
          <div className="section-head">
            <p className="section-label">Interactive service</p>
            <h2>Generate PDF from Markdown</h2>
            <p>
              Write or paste Markdown, preview the rendered output, and download the resulting PDF from the live service.
            </p>
          </div>

          <div className="inline-banner">
            <strong>Endpoint behavior</strong>
            <p>
              Auto select uses the primary deployment first and falls back to the secondary deployment when the request cannot complete.
            </p>
          </div>
        </div>

        <div className="form-section">
          <div className="section-head">
            <h2>Input</h2>
            <p>Write GitHub Flavored Markdown with headings, lists, tables, code blocks, and more.</p>
          </div>

          <div className="form-grid">
            <label className="field field-wide">
              <span>Endpoint Mode</span>
              <select
                value={formState.endpointMode}
                onChange={(event) => updateField('endpointMode', event.target.value)}
              >
                {endpointOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="field field-wide">
              <div className="field-header">
                <span>Markdown Input</span>
                <button
                  type="button"
                  className="preview-toggle"
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>
              <div className={`input-split${showPreview ? '' : ' preview-hidden'}`}>
                <textarea
                  rows="20"
                  className="field-textarea"
                  value={formState.markdown}
                  onChange={(event) => updateField('markdown', event.target.value)}
                  placeholder="Write Markdown here..."
                />
                {showPreview && (
                  <div
                    className="md-preview-panel"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-head">
            <h2>PDF Options</h2>
            <p>These values map directly to the available options supported by the pdf-lagbe API.</p>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Format</span>
              <select
                value={formState.format}
                onChange={(event) => updateField('format', event.target.value)}
              >
                {formats.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Scale</span>
              <input
                type="number"
                min="0.1"
                max="2"
                step="0.1"
                value={formState.scale}
                onChange={(event) => updateField('scale', event.target.value)}
              />
            </label>

            <label className="field checkbox-field">
              <input
                type="checkbox"
                checked={formState.landscape}
                onChange={(event) => updateField('landscape', event.target.checked)}
              />
              <span>Landscape orientation</span>
            </label>

            <label className="field checkbox-field">
              <input
                type="checkbox"
                checked={formState.printBackground}
                onChange={(event) => updateField('printBackground', event.target.checked)}
              />
              <span>Print background</span>
            </label>

            <label className="field checkbox-field">
              <input
                type="checkbox"
                checked={formState.preferCSSPageSize}
                onChange={(event) => updateField('preferCSSPageSize', event.target.checked)}
              />
              <span>Prefer CSS page size</span>
            </label>

            <label className="field checkbox-field">
              <input
                type="checkbox"
                checked={formState.displayHeaderFooter}
                onChange={(event) => updateField('displayHeaderFooter', event.target.checked)}
              />
              <span>Display header and footer</span>
            </label>

            <label className="field">
              <span>Margin Top</span>
              <input
                type="text"
                value={formState.marginTop}
                onChange={(event) => updateField('marginTop', event.target.value)}
              />
            </label>

            <label className="field">
              <span>Margin Right</span>
              <input
                type="text"
                value={formState.marginRight}
                onChange={(event) => updateField('marginRight', event.target.value)}
              />
            </label>

            <label className="field">
              <span>Margin Bottom</span>
              <input
                type="text"
                value={formState.marginBottom}
                onChange={(event) => updateField('marginBottom', event.target.value)}
              />
            </label>

            <label className="field">
              <span>Margin Left</span>
              <input
                type="text"
                value={formState.marginLeft}
                onChange={(event) => updateField('marginLeft', event.target.value)}
              />
            </label>

            {formState.displayHeaderFooter ? (
              <>
                <label className="field field-wide">
                  <span>Header Template</span>
                  <textarea
                    rows="5"
                    value={formState.headerTemplate}
                    onChange={(event) => updateField('headerTemplate', event.target.value)}
                  />
                </label>

                <label className="field field-wide">
                  <span>Footer Template</span>
                  <textarea
                    rows="5"
                    value={formState.footerTemplate}
                    onChange={(event) => updateField('footerTemplate', event.target.value)}
                  />
                </label>
              </>
            ) : null}
          </div>
        </div>

        <div className="status-panel">
          {status.error ? <p className="status-message status-error">{status.error}</p> : null}
          {status.success ? <p className="status-message status-success">{status.success}</p> : null}
          {status.usedEndpoint ? (
            <p className="status-message">Used endpoint: {status.usedEndpoint}</p>
          ) : null}
          {status.generationTime ? (
            <p className="status-message">Generation time: {status.generationTime} ms</p>
          ) : null}
        </div>

        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={status.loading}>
            {status.loading ? 'Generating...' : 'Generate PDF'}
          </button>
          <button className="button button-secondary" type="button" onClick={handleReset}>
            Reset Example
          </button>
        </div>
      </form>
    </section>
  )
}
