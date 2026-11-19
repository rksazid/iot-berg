import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CUSTOM_SPEC_ID,
  backgroundSwatches,
  buildCustomSpec,
  customSizeLimits,
  photoSpecs,
  printSheets,
} from '../data/photoSpecs'
import {
  DPI,
  autoAlign,
  checkCompliance,
  coverFit,
  guideLines,
  layoutSheet,
  outputSize,
  panBy,
  refineCrown,
  zoomTo,
} from '../lib/passportPhoto/geometry'
import { downloadBlob, encodeJpeg, loadPhoto, renderPhoto, renderSheet } from '../lib/passportPhoto/render'

const DEFAULT_SPEC_ID = 'bd-passport'
const ZOOM_RANGE = 4 // the photo can be scaled 4× either way from its fitted size
const ZOOM_STOPS = Math.log2(ZOOM_RANGE) // the zoom slider works in doublings
const ROTATION_LIMIT_DEG = 30
const COPY_OPTIONS = ['max', '2', '4', '6', '8', '12']
const SHEET_PREVIEW_EDGE = 720 // longest side of the on-page sheet preview, in canvas px

const countries = [...new Set(photoSpecs.map((spec) => spec.country))]

function resolveSpec(specId, customSize) {
  if (specId === CUSTOM_SPEC_ID) return buildCustomSpec(customSize.width, customSize.height)
  return photoSpecs.find((spec) => spec.id === specId) ?? photoSpecs[0]
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** Let the browser paint (a status message, a spinner) before blocking work. */
function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))
}

const isTouchDevice = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

export function PassportPhotoPage() {
  const [specId, setSpecId] = useState(DEFAULT_SPEC_ID)
  const [customSize, setCustomSize] = useState({ width: '35', height: '45' })
  const spec = useMemo(() => resolveSpec(specId, customSize), [specId, customSize])
  const out = useMemo(() => outputSize(spec), [spec])

  const [photo, setPhoto] = useState(null) // working canvas of the upload
  const [face, setFace] = useState(null)
  const [cutout, setCutout] = useState(null) // canvas holding only the person
  const [transform, setTransform] = useState(null)
  const [fitZoom, setFitZoom] = useState(1) // zoom chosen by the last auto-fit
  const [busyMessage, setBusyMessage] = useState('')
  const [aiFailed, setAiFailed] = useState(false)
  const [error, setError] = useState('')

  const [removeBackground, setRemoveBackground] = useState(true)
  const [background, setBackground] = useState(spec.background)
  const [tone, setTone] = useState({ brightness: 0, contrast: 0 })
  const [showGuides, setShowGuides] = useState(true)

  const [maxKb, setMaxKb] = useState('')
  const [sheetId, setSheetId] = useState(printSheets[0].id)
  const [copies, setCopies] = useState('max')
  const [exporting, setExporting] = useState('')
  const [exportNote, setExportNote] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const previewRef = useRef(null)
  const sheetPreviewRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const runRef = useRef(0) // discards results from a superseded upload
  const specRef = useRef(spec)
  specRef.current = spec
  const pointersRef = useRef(new Map())

  const usingCutout = removeBackground && Boolean(cutout)
  const busy = Boolean(busyMessage)

  // Invalidate any in-flight analysis when the page is left.
  useEffect(() => () => { runRef.current += 1 }, [])

  function fit(nextFace, nextSpec, canvas) {
    const size = outputSize(nextSpec)
    const next = nextFace ? autoAlign(nextFace, nextSpec, size) : coverFit(canvas, size)
    setTransform(next)
    setFitZoom(next.zoom)
  }

  async function analyse(canvas, run) {
    setAiFailed(false)
    setBusyMessage('Loading on-device AI and finding your face…')
    await nextPaint()

    let failed = false
    let foundFace = null
    let cut = null
    try {
      const { detectFace, cutOutPerson } = await import('../lib/passportPhoto/vision')
      foundFace = await detectFace(canvas)
      if (run !== runRef.current) return

      setBusyMessage('Removing the background…')
      await nextPaint()
      cut = await cutOutPerson(canvas, foundFace)
    } catch (cause) {
      console.error('Passport photo analysis failed:', cause)
      failed = true
    }
    if (run !== runRef.current) return

    if (foundFace && cut) foundFace = refineCrown(foundFace, cut.isPerson)
    setFace(foundFace)
    setCutout(cut ? cut.canvas : null)
    // Without a face the cut-out is a guess (it may not be a portrait at all),
    // so the original photo is shown until the user asks otherwise.
    setRemoveBackground(Boolean(foundFace))
    fit(foundFace, specRef.current, canvas)
    setAiFailed(failed)
    setBusyMessage('')
  }

  async function handleFile(file) {
    if (!file) return
    const run = (runRef.current += 1)
    setError('')
    setExportNote(null)
    setBusyMessage('Opening your photo…')
    try {
      const canvas = await loadPhoto(file)
      if (run !== runRef.current) return
      setPhoto(canvas)
      setFace(null)
      setCutout(null)
      setTone({ brightness: 0, contrast: 0 })
      fit(null, specRef.current, canvas)
      await analyse(canvas, run)
    } catch (cause) {
      if (run !== runRef.current) return
      setBusyMessage('')
      setError(cause instanceof Error ? cause.message : 'Something went wrong while opening the photo.')
    }
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow picking the same file again
    handleFile(file)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragActive(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  function applySpec(nextSpecId, nextCustomSize) {
    const nextSpec = resolveSpec(nextSpecId, nextCustomSize)
    setSpecId(nextSpecId)
    setCustomSize(nextCustomSize)
    setBackground(nextSpec.background)
    setExportNote(null)
    if (photo) fit(face, nextSpec, photo)
  }

  function resetPhoto() {
    runRef.current += 1
    setPhoto(null)
    setFace(null)
    setCutout(null)
    setTransform(null)
    setBusyMessage('')
    setAiFailed(false)
    setError('')
    setExportNote(null)
  }

  // ---- Preview -------------------------------------------------------------

  const renderOptions = useMemo(() => {
    if (!photo || !transform) return null
    return {
      image: usingCutout ? cutout : photo,
      out,
      transform,
      background,
      brightness: tone.brightness,
      contrast: tone.contrast,
    }
  }, [photo, cutout, usingCutout, out, transform, background, tone])

  useEffect(() => {
    if (renderOptions && previewRef.current) renderPhoto(previewRef.current, renderOptions)
  }, [renderOptions])

  // The print sheet preview is drawn from the photo preview above, so it shows
  // every adjustment live. Before a photo is chosen it shows empty frames.
  const sheet = printSheets.find((item) => item.id === sheetId) ?? printSheets[0]
  const copyLimit = copies === 'max' ? Infinity : Number(copies)
  const sheetCount = useMemo(() => layoutSheet(out, sheet, { maxCopies: copyLimit }).count, [out, sheet, copyLimit])

  useEffect(() => {
    if (!sheetPreviewRef.current) return
    renderSheet({
      photo: renderOptions ? previewRef.current : null,
      size: out,
      sheet,
      maxCopies: copyLimit,
      target: sheetPreviewRef.current,
      maxEdge: SHEET_PREVIEW_EDGE,
    })
  }, [renderOptions, out, sheet, copyLimit])

  const zoomLimits = { min: fitZoom / ZOOM_RANGE, max: fitZoom * ZOOM_RANGE }

  function updateTransform(change) {
    setTransform((current) => (current ? change(current) : current))
    setExportNote(null)
  }

  function handlePointerDown(event) {
    if (!transform || busy) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
  }

  function handlePointerMove(event) {
    const pointers = pointersRef.current
    const previous = pointers.get(event.pointerId)
    if (!previous) return
    const current = { x: event.clientX, y: event.clientY }
    const scale = out.width / event.currentTarget.getBoundingClientRect().width

    if (pointers.size === 1) {
      updateTransform((t) => panBy(t, (current.x - previous.x) * scale, (current.y - previous.y) * scale))
    } else if (pointers.size === 2) {
      const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1]
      const before = Math.hypot(previous.x - other.x, previous.y - other.y)
      const after = Math.hypot(current.x - other.x, current.y - other.y)
      if (before > 0) updateTransform((t) => zoomTo(t, t.zoom * (after / before), zoomLimits))
    }
    pointers.set(event.pointerId, current)
  }

  function handlePointerEnd(event) {
    pointersRef.current.delete(event.pointerId)
  }

  // Ctrl/⌘ + wheel (and trackpad pinch, which browsers report the same way)
  // zooms; a plain wheel keeps scrolling the page.
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas || !photo) return undefined
    const onWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const factor = Math.exp(-event.deltaY * 0.01)
      setTransform((t) => (t ? zoomTo(t, t.zoom * factor, { min: fitZoom / ZOOM_RANGE, max: fitZoom * ZOOM_RANGE }) : t))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [photo, fitZoom])

  const checks = useMemo(() => {
    if (!photo || !transform) return []
    return checkCompliance({ face, spec, transform, out, source: photo })
  }, [photo, face, spec, transform, out])
  const warnings = checks.filter((check) => check.status !== 'pass').length

  const guides = useMemo(() => guideLines(spec), [spec])

  // ---- Export --------------------------------------------------------------

  async function handleExport(kind) {
    if (!renderOptions || exporting) return
    setExporting(kind)
    setExportNote(null)
    setError('')
    try {
      await nextPaint()
      const canvas = document.createElement('canvas')
      renderPhoto(canvas, renderOptions)
      const stem = `passport-photo-${spec.id}`

      if (kind === 'photo') {
        const limitKb = Number(maxKb)
        const maxBytes = Number.isFinite(limitKb) && limitKb > 0 ? Math.round(limitKb * 1024) : undefined
        const { blob, fits } = await encodeJpeg(canvas, { maxBytes })
        downloadBlob(blob, `${stem}-${out.width}x${out.height}.jpg`)
        setExportNote({
          ok: fits,
          text: fits
            ? `Photo saved: ${out.width} × ${out.height} px, ${DPI} DPI, ${formatBytes(blob.size)}.`
            : `Photo saved at the lowest quality (${formatBytes(blob.size)}), but it is still over ${limitKb} KB. A photo this size cannot be compressed further.`,
        })
      } else {
        const { canvas: sheetCanvas, count } = renderSheet({ photo: canvas, size: out, sheet, maxCopies: copyLimit })
        if (count === 0) throw new Error(`A ${spec.widthMm} × ${spec.heightMm} mm photo does not fit on this sheet. Pick a larger sheet.`)
        const { blob } = await encodeJpeg(sheetCanvas)
        downloadBlob(blob, `${stem}-sheet-${sheet.id}.jpg`)
        setExportNote({
          ok: true,
          text: `Print sheet saved: ${count} ${count === 1 ? 'photo' : 'photos'} on ${sheet.label}. Print at 100% / "actual size", not "fit to page".`,
        })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The download could not be created.')
    } finally {
      setExporting('')
    }
  }

  // ---- Render --------------------------------------------------------------

  const zoomSlider = transform ? Math.log2(transform.zoom / fitZoom) : 0
  const rotationDeg = transform ? (transform.rotation * 180) / Math.PI : 0
  const controlsDisabled = !transform || busy

  return (
    <div className="page page-passport">
      <header className="workspace-head glass-panel">
        <div className="workspace-head-top">
          <div className="studio-breadcrumb">
            <Link to="/">Studio</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">Passport Photo</span>
          </div>
          <div className="engine-status-pill">
            <span className="status-ping-inline" />
            <span>Runs on your device</span>
          </div>
        </div>

        <div className="workspace-head-body">
          <div className="workspace-title-wrap">
            <h1 className="workspace-title">Passport Photo Studio</h1>
            <p className="workspace-desc">
              Turn any portrait into a correctly sized passport, visa or ID photo. Your face is centred and the
              background replaced automatically, entirely in your browser, so the photo is never uploaded.
            </p>
          </div>
        </div>

        <div className="workspace-meta-strip">
          <div className="meta-strip-item">
            <span className="strip-lbl">Document</span>
            <span className="strip-val">{spec.country === 'Common sizes' ? spec.label : `${spec.country}: ${spec.label}`}</span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-lbl">Print size</span>
            <span className="strip-val">{spec.widthMm} × {spec.heightMm} mm</span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-lbl">Digital size</span>
            <span className="strip-val">{out.width} × {out.height} px · {DPI} DPI</span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-lbl">Privacy</span>
            <span className="strip-val">No upload · No storage</span>
          </div>
        </div>
      </header>

      <div className="pp-layout">
        {/* 1. Document */}
        <section className="pp-card pp-area-document">
          <div className="pp-card-head">
            <span className="pp-step">1</span>
            <h2>Choose the document</h2>
          </div>

          <label className="field-group">
            <span className="field-label">Country and document</span>
            <select
              className="select-input"
              value={specId}
              onChange={(event) => applySpec(event.target.value, customSize)}
            >
              {countries.map((country) => (
                <optgroup key={country} label={country}>
                  {photoSpecs
                    .filter((item) => item.country === country)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {country === 'Common sizes' ? item.label : `${country}: ${item.label}`}
                      </option>
                    ))}
                  {country === 'Common sizes' && <option value={CUSTOM_SPEC_ID}>Custom size…</option>}
                </optgroup>
              ))}
            </select>
          </label>

          {specId === CUSTOM_SPEC_ID && (
            <div className="pp-row-2">
              {['width', 'height'].map((side) => (
                <label className="field-group" key={side}>
                  <span className="field-label">{side === 'width' ? 'Width (mm)' : 'Height (mm)'}</span>
                  <input
                    className="text-input"
                    type="number"
                    inputMode="decimal"
                    min={customSizeLimits.minMm}
                    max={customSizeLimits.maxMm}
                    step="0.5"
                    value={customSize[side]}
                    onChange={(event) => applySpec(CUSTOM_SPEC_ID, { ...customSize, [side]: event.target.value })}
                  />
                </label>
              ))}
            </div>
          )}

          <dl className="pp-spec">
            <div>
              <dt>Head height</dt>
              <dd>{spec.headMm[0]}–{spec.headMm[1]} mm, chin to crown</dd>
            </div>
            {spec.eyeFromBottomMm && (
              <div>
                <dt>Eye line</dt>
                <dd>{spec.eyeFromBottomMm[0]}–{spec.eyeFromBottomMm[1]} mm from the bottom</dd>
              </div>
            )}
            <div>
              <dt>Background</dt>
              <dd>{spec.backgroundNote}</dd>
            </div>
          </dl>
          {spec.guideline && (
            <p className="pp-hint">
              No official head-size range is published for this document, so a standard proportion is used. Check
              the application form if it lists its own.
            </p>
          )}
        </section>

        {/* Preview / upload */}
        <section className="pp-card pp-area-preview">
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleInputChange} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="user" hidden onChange={handleInputChange} />

          {!photo ? (
            <div
              className={`file-drop-zone pp-drop${dragActive ? ' drag-active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {busy ? (
                <>
                  <span className="spinner" />
                  <p className="drop-prompt">{busyMessage}</p>
                </>
              ) : (
                <>
                  <div className="drop-icon-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <div className="drop-text-group">
                    <p className="drop-prompt">
                      <strong>Choose a photo</strong> or drop it here
                    </p>
                    <span className="drop-sub">JPG, PNG or WebP · stays on your device</span>
                  </div>
                  {isTouchDevice && (
                    <button
                      type="button"
                      className="button button-secondary button-sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        cameraInputRef.current?.click()
                      }}
                    >
                      Take a photo
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="pp-stage">
                <div
                  className="pp-frame"
                  style={{ aspectRatio: `${out.width} / ${out.height}`, '--pp-ratio': out.width / out.height }}
                >
                  <canvas
                    ref={previewRef}
                    className="pp-canvas"
                    aria-label="Passport photo preview. Drag to reposition."
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                  />
                  {showGuides && (
                    <svg
                      className="pp-guides"
                      viewBox={`0 0 ${spec.widthMm} ${spec.heightMm}`}
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <ellipse
                        cx={guides.centreX}
                        cy={(guides.crownY + guides.chinY) / 2}
                        rx={guides.headMm * 0.37}
                        ry={guides.headMm / 2}
                      />
                      <line x1={guides.centreX} y1="0" x2={guides.centreX} y2={spec.heightMm} />
                      <line x1="0" y1={guides.eyeY} x2={spec.widthMm} y2={guides.eyeY} />
                    </svg>
                  )}
                  {busy && (
                    <div className="pp-busy">
                      <span className="spinner" />
                      <span>{busyMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pp-stage-actions">
                <span className="pp-hint">
                  {isTouchDevice ? 'Drag to move · pinch to zoom' : 'Drag to move · Ctrl + scroll to zoom'}
                </span>
                <div className="pp-stage-buttons">
                  <label className={`pill-checkbox pp-pill-sm${showGuides ? ' selected' : ''}`}>
                    <input type="checkbox" checked={showGuides} onChange={(event) => setShowGuides(event.target.checked)} />
                    <span>Guides</span>
                  </label>
                  <button type="button" className="button button-ghost button-sm" onClick={() => fileInputRef.current?.click()}>
                    Change photo
                  </button>
                  <button type="button" className="button button-ghost button-sm" onClick={resetPhoto}>
                    Remove
                  </button>
                </div>
              </div>

              {aiFailed && (
                <div className="status-message status-error pp-status">
                  <span>
                    The on-device AI could not be loaded, so the photo was not centred or cut out automatically. You
                    can still position it by hand.
                  </span>
                  <button
                    type="button"
                    className="button button-secondary button-sm"
                    onClick={() => analyse(photo, (runRef.current += 1))}
                    disabled={busy}
                  >
                    Retry
                  </button>
                </div>
              )}

              {checks.length > 0 && !busy && (
                <div className="pp-checks">
                  <div className="pp-checks-head">
                    <span className="field-label">Requirement check</span>
                    <span className={`pp-checks-summary${warnings ? ' pp-warn' : ' pp-pass'}`}>
                      {warnings ? `${warnings} to review` : 'All checks passed'}
                    </span>
                  </div>
                  <ul>
                    {checks.map((check) => (
                      <li key={check.id} className={check.status === 'pass' ? 'pp-pass' : 'pp-warn'}>
                        <span className="pp-check-icon" aria-hidden="true">{check.status === 'pass' ? '✓' : '!'}</span>
                        <span>
                          <strong>{check.label}</strong>
                          <span className="pp-check-detail">{check.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="pp-hint">
                    These checks cover size and position. Expression, lighting, glasses and shadows are still yours
                    to check against the official rules.
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="status-message status-error pp-status" role="alert">
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* 2. Adjust */}
        <section className={`pp-card pp-area-adjust${controlsDisabled ? ' pp-card-idle' : ''}`}>
          <div className="pp-card-head">
            <span className="pp-step">2</span>
            <h2>Adjust</h2>
            <button
              type="button"
              className="button button-secondary button-sm pp-head-action"
              disabled={controlsDisabled}
              onClick={() => {
                fit(face, spec, photo)
                setTone({ brightness: 0, contrast: 0 })
                setExportNote(null)
              }}
            >
              {face ? 'Auto-centre' : 'Reset'}
            </button>
          </div>

          <label className="pp-slider">
            <span className="field-label">Zoom</span>
            <input
              type="range"
              min={-ZOOM_STOPS}
              max={ZOOM_STOPS}
              step={0.005}
              value={zoomSlider}
              disabled={controlsDisabled}
              onChange={(event) => updateTransform((t) => zoomTo(t, fitZoom * 2 ** Number(event.target.value), zoomLimits))}
            />
            <output>{Math.round(2 ** zoomSlider * 100)}%</output>
          </label>

          <label className="pp-slider">
            <span className="field-label">Rotate</span>
            <input
              type="range"
              min={-ROTATION_LIMIT_DEG}
              max={ROTATION_LIMIT_DEG}
              step={0.1}
              value={Math.max(-ROTATION_LIMIT_DEG, Math.min(ROTATION_LIMIT_DEG, rotationDeg))}
              disabled={controlsDisabled}
              onChange={(event) =>
                updateTransform((t) => ({ ...t, rotation: (Number(event.target.value) * Math.PI) / 180 }))
              }
            />
            <output>{rotationDeg.toFixed(1)}°</output>
          </label>

          {['brightness', 'contrast'].map((key) => (
            <label className="pp-slider" key={key}>
              <span className="field-label">{key === 'brightness' ? 'Brightness' : 'Contrast'}</span>
              <input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={tone[key]}
                disabled={controlsDisabled}
                onChange={(event) => {
                  setTone((current) => ({ ...current, [key]: Number(event.target.value) }))
                  setExportNote(null)
                }}
              />
              <output>{tone[key] > 0 ? `+${tone[key]}` : tone[key]}</output>
            </label>
          ))}

          <div className="field-group">
            <span className="field-label">Background</span>
            <label className={`pill-checkbox${usingCutout ? ' selected' : ''}`}>
              <input
                type="checkbox"
                checked={usingCutout}
                disabled={controlsDisabled || !cutout}
                onChange={(event) => {
                  setRemoveBackground(event.target.checked)
                  setExportNote(null)
                }}
              />
              <span>Replace the background</span>
            </label>
            {usingCutout && (
              <div className="pp-swatches">
                {backgroundSwatches.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    className={`pp-swatch${background.toLowerCase() === swatch.hex ? ' pp-swatch-active' : ''}`}
                    style={{ background: swatch.hex }}
                    title={swatch.label}
                    aria-label={`${swatch.label} background`}
                    aria-pressed={background.toLowerCase() === swatch.hex}
                    onClick={() => {
                      setBackground(swatch.hex)
                      setExportNote(null)
                    }}
                  />
                ))}
                <label className="pp-swatch pp-swatch-custom" title="Custom colour">
                  <input
                    type="color"
                    value={background}
                    aria-label="Custom background colour"
                    onChange={(event) => {
                      setBackground(event.target.value)
                      setExportNote(null)
                    }}
                  />
                </label>
              </div>
            )}
            {photo && !busy && !cutout && !aiFailed && (
              <p className="pp-hint">The background could not be separated in this photo.</p>
            )}
          </div>
        </section>

        {/* 3. Download */}
        <section className={`pp-card pp-area-export${controlsDisabled ? ' pp-card-idle' : ''}`}>
          <div className="pp-card-head">
            <span className="pp-step">3</span>
            <h2>Download</h2>
          </div>

          <div className="pp-export-block">
            <label className="field-group">
              <span className="field-label">Maximum file size (optional)</span>
              <div className="input-suffix-wrap">
                <input
                  className="text-input"
                  type="number"
                  inputMode="numeric"
                  min="5"
                  placeholder="No limit"
                  value={maxKb}
                  onChange={(event) => setMaxKb(event.target.value)}
                />
                <span className="input-suffix">KB</span>
              </div>
              <span className="pp-hint">For online forms that cap the upload size.</span>
            </label>
            <button
              type="button"
              className="button button-primary button-full"
              disabled={controlsDisabled || Boolean(exporting)}
              onClick={() => handleExport('photo')}
            >
              {exporting === 'photo' ? <span className="spinner-white" /> : null}
              <span>Download photo (JPG)</span>
            </button>
          </div>

          <div className="pp-export-block">
            <div className="pp-row-2">
              <label className="field-group">
                <span className="field-label">Print sheet</span>
                <select className="select-input" value={sheetId} onChange={(event) => setSheetId(event.target.value)}>
                  {printSheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>{sheet.label}</option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span className="field-label">Copies</span>
                <select className="select-input" value={copies} onChange={(event) => setCopies(event.target.value)}>
                  {COPY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option === 'max' ? 'Fill the sheet' : option}</option>
                  ))}
                </select>
              </label>
            </div>
            <figure className="pp-sheet">
              <canvas
                ref={sheetPreviewRef}
                className="pp-sheet-canvas"
                role="img"
                aria-label={`Print sheet preview: ${sheetCount} ${sheetCount === 1 ? 'photo' : 'photos'} on ${sheet.label}`}
              />
              <figcaption className="pp-hint">
                {sheetCount === 0
                  ? `A ${spec.widthMm} × ${spec.heightMm} mm photo does not fit on ${sheet.label}. Pick a larger sheet.`
                  : `${sheetCount} ${sheetCount === 1 ? 'photo' : 'photos'} on ${sheet.label}${photo ? '' : '. Add a photo to fill the frames.'}`}
              </figcaption>
            </figure>
            <button
              type="button"
              className="button button-secondary button-full"
              disabled={controlsDisabled || Boolean(exporting) || sheetCount === 0}
              onClick={() => handleExport('sheet')}
            >
              {exporting === 'sheet' ? <span className="spinner" /> : null}
              <span>Download print sheet</span>
            </button>
          </div>

          {exportNote && (
            <div className={`status-message ${exportNote.ok ? 'status-success' : 'status-error'} pp-status`} role="status">
              <span>{exportNote.text}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
