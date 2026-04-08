import { useRef, useState } from 'react'
import { endpointOptions } from '../../config/pdfService'
import { generatePdf } from '../../lib/pdfClient'

const formats = ['A4', 'Letter', 'A3', 'Legal', 'Tabloid']
const MAX_FILE_SIZE = 5 * 1024 * 1024

const initialState = {
  endpointMode: 'auto',
  file: null,
  format: 'A4',
  landscape: false,
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function validateFile(file) {
  if (!file) return 'No file selected.'

  const name = file.name.toLowerCase()
  if (!name.endsWith('.docx')) {
    return 'Only .docx files are accepted.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds the 5 MB limit (${formatFileSize(file.size)}).`
  }

  return null
}

function getDefaultFilename() {
  const now = new Date()
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `iot-berg-docx-${stamp}.pdf`
}

function startDownload(blob, filename) {
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = filename || getDefaultFilename()

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl)
  }, 1000)
}

export function DocxPlayground() {
  const [formState, setFormState] = useState(initialState)
  const [outputFilename, setOutputFilename] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
    generationTime: '',
    usedEndpoint: '',
  })
  const fileInputRef = useRef(null)

  function updateField(field, value) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleFileSelect(file) {
    const error = validateFile(file)
    if (error) {
      setStatus((prev) => ({ ...prev, error, success: '' }))
      setFormState((current) => ({ ...current, file: null }))
      return
    }

    setStatus((prev) => ({ ...prev, error: '', success: '' }))
    setFormState((current) => ({ ...current, file }))
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDragOver(event) {
    event.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setDragActive(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDropZoneClick() {
    fileInputRef.current?.click()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!formState.file) {
      setStatus((prev) => ({ ...prev, error: 'Please select a .docx file first.', success: '' }))
      return
    }

    setStatus({
      loading: true,
      error: '',
      success: '',
      generationTime: '',
      usedEndpoint: '',
    })

    try {
      const fd = new FormData()
      fd.append('file', formState.file)
      if (formState.format !== 'A4') fd.append('format', formState.format)
      if (formState.landscape) fd.append('landscape', 'true')

      const result = await generatePdf({
        endpointMode: formState.endpointMode,
        apiPath: 'docx-to-pdf',
        formData: fd,
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
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong while converting the document.',
        success: '',
        generationTime: '',
        usedEndpoint: '',
      })
    }
  }

  function handleReset() {
    setFormState(initialState)
    setOutputFilename('')
    setStatus({
      loading: false,
      error: '',
      success: '',
      generationTime: '',
      usedEndpoint: '',
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="playground-panel glass-panel glass-panel-strong">
      <form className="pdf-form" onSubmit={handleSubmit}>
        <div className="form-section form-section-hero">
          <div className="section-head">
            <p className="section-label">Interactive service</p>
            <h2>Convert DOCX to PDF</h2>
            <p>
              Upload a Word document, set optional output preferences, and download the converted PDF from the live service.
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
            <p>Upload a .docx file up to 5 MB. The conversion preserves formatting and embedded images.</p>
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
              <span>Document File</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleInputChange}
                hidden
              />
              <div
                className={`file-drop-zone${dragActive ? ' drag-active' : ''}`}
                onClick={handleDropZoneClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {formState.file ? (
                  <div className="file-info">
                    <strong>{formState.file.name}</strong>
                    <span>{formatFileSize(formState.file.size)}</span>
                  </div>
                ) : (
                  <>
                    <p><strong>Drop a .docx file here</strong></p>
                    <p>or click to browse</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-head">
            <h2>PDF Options</h2>
            <p>Optional output preferences for the converted document.</p>
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

            <label className="field checkbox-field">
              <input
                type="checkbox"
                checked={formState.landscape}
                onChange={(event) => updateField('landscape', event.target.checked)}
              />
              <span>Landscape orientation</span>
            </label>
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

        <div className="form-section">
          <div className="form-grid">
            <label className="field field-wide">
              <span>Output Filename</span>
              <input
                type="text"
                value={outputFilename}
                onChange={(event) => setOutputFilename(event.target.value)}
                placeholder={getDefaultFilename()}
              />
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={status.loading || !formState.file}>
            {status.loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          <button className="button button-secondary" type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
    </section>
  )
}
