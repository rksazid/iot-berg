import { useState } from 'react'
import { serviceCatalog } from '../data/services'
import {
  footerTemplateExample,
  headerTemplateExample,
  starterTemplate,
} from '../data/pdfExamples'

const formats = ['A4', 'Letter', 'A3', 'Legal', 'Tabloid']

const initialState = {
  endpoint: serviceCatalog[0].endpoints[0].value,
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

export function HtmlToPdfPage() {
  const service = serviceCatalog[0]
  const [formState, setFormState] = useState(initialState)
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
    generationTime: '',
  })

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
    })

    try {
      const response = await fetch(`${formState.endpoint}/api/v1/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toPayload(formState)),
      })

      if (!response.ok) {
        let message = `Request failed with status ${response.status}.`

        try {
          const problem = await response.json()
          if (problem.message) {
            message = problem.message
          }
        } catch {}

        throw new Error(message)
      }

      const pdfBlob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'iot-berg-document.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      setStatus({
        loading: false,
        error: '',
        success: 'PDF generated and download started.',
        generationTime: response.headers.get('X-Generation-Time') || '',
      })
    } catch (error) {
      setStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Something went wrong while generating the PDF.',
        success: '',
        generationTime: '',
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
    })
  }

  return (
    <div className="page page-service-detail">
      <section className="page-header page-header-tight">
        <p className="eyebrow">Service detail</p>
        <h1>{service.name}</h1>
        <p className="page-intro">{service.description}</p>
      </section>

      <section className="detail-grid">
        <aside className="detail-panel">
          <div className="detail-block">
            <p className="section-label">Highlights</p>
            <div className="detail-list">
              {service.highlights.map((item) => (
                <div className="detail-list-item" key={item}>
                  <span className="mini-dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-block">
            <p className="section-label">Verified endpoints</p>
            <div className="endpoint-list">
              {service.endpoints.map((endpoint) => (
                <div className="endpoint-card" key={endpoint.value}>
                  <strong>{endpoint.name}</strong>
                  <span>{endpoint.value}</span>
                  <p>{endpoint.note}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="playground-panel">
          <form className="pdf-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="section-head">
                <h2>Generate PDF</h2>
                <p>Provide HTML content, configure the output, and download the generated file.</p>
              </div>

              <div className="form-grid">
                <label className="field field-wide">
                  <span>API Endpoint</span>
                  <select
                    value={formState.endpoint}
                    onChange={(event) => updateField('endpoint', event.target.value)}
                  >
                    {service.endpoints.map((endpoint) => (
                      <option key={endpoint.value} value={endpoint.value}>
                        {endpoint.name} ({endpoint.value})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field field-wide">
                  <span>HTML Input</span>
                  <textarea
                    rows="18"
                    value={formState.html}
                    onChange={(event) => updateField('html', event.target.value)}
                    placeholder="Paste full HTML here"
                  />
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="section-head">
                <h2>PDF Options</h2>
                <p>These fields map directly to the supported options in the live API.</p>
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

                <label className="field">
                  <span>Wait For Selector</span>
                  <input
                    type="text"
                    value={formState.waitForSelector}
                    onChange={(event) => updateField('waitForSelector', event.target.value)}
                    placeholder=".chart-ready"
                  />
                </label>

                <label className="field">
                  <span>Wait For Timeout (ms)</span>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    value={formState.waitForTimeout}
                    onChange={(event) => updateField('waitForTimeout', event.target.value)}
                    placeholder="2000"
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
      </section>
    </div>
  )
}
