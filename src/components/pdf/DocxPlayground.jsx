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

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateFile(formState.file)
    if (validationError) {
      setStatus({
        loading: false,
        error: validationError,
        success: '',
        generationTime: '',
        usedEndpoint: '',
      })
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
      const formData = new FormData()
      formData.append('file', formState.file)
      formData.append('format', formState.format)
      formData.append('landscape', String(formState.landscape))

      const result = await generatePdf({
        endpointMode: formState.endpointMode,
        apiPath: 'docx-to-pdf',
        formData,
      })

      const name = outputFilename.trim()
        ? (outputFilename.trim().endsWith('.pdf')
            ? outputFilename.trim()
            : `${outputFilename.trim()}.pdf`)
        : getDefaultFilename()

      startDownload(result.blob, name)

      setStatus({
        loading: false,
        error: '',
        success: 'DOCX document converted successfully and download started.',
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
    setOutputFilename('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setStatus({
      loading: false,
      error: '',
      success: '',
      generationTime: '',
      usedEndpoint: '',
    })
  }

  function handleRemoveFile() {
    setFormState((current) => ({ ...current, file: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <section className="playground-panel">
      <form className="pdf-form" onSubmit={handleSubmit}>
        {/* Upload File Section */}
        <div className="form-section">
          <div className="section-head section-head-row">
            <div>
              <h3>Microsoft Word (.docx) Document</h3>
              <p>Upload a file up to 5 MB. Retains paragraph styles, tables, embedded photos, and vector shapes.</p>
            </div>

            <label className="field-inline-select">
              <span>Endpoint:</span>
              <select
                value={formState.endpointMode}
                onChange={(e) => updateField('endpointMode', e.target.value)}
              >
                {endpointOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="upload-container">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleInputChange}
              style={{ display: 'none' }}
              id="docx-file-input"
            />

            {!formState.file ? (
              <div
                className={`file-drop-zone${dragActive ? ' drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                }}
              >
                <div className="drop-icon-box">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m16 16-4-4-4 4" />
                  </svg>
                </div>
                <div className="drop-text-group">
                  <p className="drop-prompt">
                    <strong>Click to upload</strong> or drag and drop your .docx file here
                  </p>
                  <span className="drop-sub">Microsoft Word (.docx) documents up to 5 MB</span>
                </div>
              </div>
            ) : (
              <div className="file-info-card">
                <div className="file-info-left">
                  <div className="file-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <div className="file-meta">
                    <strong className="file-name">{formState.file.name}</strong>
                    <span className="file-size">{formatFileSize(formState.file.size)} · Ready to convert</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="file-remove-btn"
                  onClick={handleRemoveFile}
                  title="Remove file"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PDF Page Options Section */}
        <div className="form-section">
          <div className="section-head">
            <h3>Output Layout Preferences</h3>
            <p>Target paper specifications for the resulting PDF document.</p>
          </div>

          <div className="form-grid-modern">
            <label className="field-group">
              <span className="field-label">Paper Format</span>
              <select
                className="select-input"
                value={formState.format}
                onChange={(e) => updateField('format', e.target.value)}
              >
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>

            <div className="field-group">
              <span className="field-label">Orientation</span>
              <label className={`pill-checkbox${formState.landscape ? ' selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={formState.landscape}
                  onChange={(e) => updateField('landscape', e.target.checked)}
                />
                <span>Landscape Orientation</span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Status Feedback Notification */}
        {(status.error || status.success || status.loading) && (
          <div className="status-panel">
            {status.loading && (
              <div className="status-message status-loading">
                <span className="spinner" />
                <span>Parsing DOCX binary and rendering PDF stream…</span>
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
              Reset Form
            </button>
            <button
              className="button button-primary action-btn-generate"
              type="submit"
              disabled={status.loading || !formState.file}
            >
              {status.loading ? (
                <>
                  <span className="spinner-white" />
                  <span>Converting DOCX…</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Convert & Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
