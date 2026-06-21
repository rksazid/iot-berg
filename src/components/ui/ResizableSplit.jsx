import { useCallback, useEffect, useRef, useState } from 'react'

export function ResizableSplit({ left, right }) {
  const containerRef = useRef(null)
  const [splitPercent, setSplitPercent] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    setIsDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.min(Math.max((x / rect.width) * 100, 15), 85)
    setSplitPercent(pct)
  }, [])

  const onMouseUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  return (
    <div
      ref={containerRef}
      className="fullscreen-split"
      style={{ gridTemplateColumns: `${splitPercent}fr 8px ${100 - splitPercent}fr` }}
    >
      <div className="split-pane split-pane-left">
        {left}
        {isDragging && <div className="split-drag-shield" />}
      </div>
      <div className="split-divider" onMouseDown={onMouseDown}>
        <div className="split-divider-handle" />
      </div>
      <div className="split-pane split-pane-right">
        {right}
        {isDragging && <div className="split-drag-shield" />}
      </div>
    </div>
  )
}
