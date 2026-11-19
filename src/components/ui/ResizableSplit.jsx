import { useRef, useState } from 'react'

const MIN_PERCENT = 15
const MAX_PERCENT = 85
const KEY_STEP = 2

const clamp = (percent) => Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, percent))

/**
 * Two panes with a draggable divider. `view` picks what is visible:
 * 'split' (both), 'left' or 'right'. Hidden panes stay mounted so an editor in
 * them keeps its state. The divider works with mouse, touch and arrow keys;
 * double-click resets it to the middle.
 */
export function ResizableSplit({ left, right, view = 'split' }) {
  const containerRef = useRef(null)
  const [splitPercent, setSplitPercent] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  function handlePointerDown(event) {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setIsDragging(true)
  }

  function handlePointerMove(event) {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setSplitPercent(clamp(((event.clientX - rect.left) / rect.width) * 100))
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') setSplitPercent((p) => clamp(p - KEY_STEP))
    else if (event.key === 'ArrowRight') setSplitPercent((p) => clamp(p + KEY_STEP))
    else return
    event.preventDefault()
  }

  return (
    <div
      ref={containerRef}
      className={`fullscreen-split${isDragging ? ' is-dragging' : ''}`}
      data-view={view}
      style={{ '--split-left': `${splitPercent}fr`, '--split-right': `${100 - splitPercent}fr` }}
    >
      <div className="split-pane split-pane-left">
        {left}
        {/* Frames swallow pointer events; the shield keeps a drag alive over them. */}
        {isDragging && <div className="split-drag-shield" />}
      </div>
      <div
        className="split-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor and preview"
        aria-valuemin={MIN_PERCENT}
        aria-valuemax={MAX_PERCENT}
        aria-valuenow={Math.round(splitPercent)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        onDoubleClick={() => setSplitPercent(50)}
        onKeyDown={handleKeyDown}
      >
        <div className="split-divider-handle" />
      </div>
      <div className="split-pane split-pane-right">
        {right}
        {isDragging && <div className="split-drag-shield" />}
      </div>
    </div>
  )
}
