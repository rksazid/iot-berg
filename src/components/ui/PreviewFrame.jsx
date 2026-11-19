import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

const RELOAD_DELAY_MS = 250

// Scripts are never enabled in the frame, so previewed markup cannot run code:
// not <script>, not inline handlers such as onerror, not javascript: links.
// That is what makes it safe to hand the frame whatever the user typed.
// Same-origin access only lets this component read and set the scroll position.
const SANDBOX = 'allow-same-origin'

/**
 * Sandboxed live preview. Two ways to feed it:
 *   html              a complete document. Reloaded shortly after typing
 *                     stops, keeping the scroll position.
 *   shell + bodyHtml  a fixed document whose <body> is swapped in place, so
 *                     there is no reload at all (used for rendered Markdown).
 */
export const PreviewFrame = forwardRef(function PreviewFrame(
  { title, html, shell, bodyHtml },
  ref,
) {
  const frameRef = useRef(null)
  const scrollRef = useRef({ x: 0, y: 0 })
  const bodyRef = useRef(bodyHtml)
  bodyRef.current = bodyHtml

  const usesShell = shell !== undefined
  const [source, setSource] = useState(usesShell ? shell : html)

  // Full-document mode: wait for a pause in typing before reloading.
  useEffect(() => {
    if (usesShell) return undefined
    const timer = window.setTimeout(() => setSource(html), RELOAD_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [html, usesShell])

  function frameWindow() {
    try {
      const win = frameRef.current?.contentWindow
      return win && win.document ? win : null
    } catch {
      return null // navigated somewhere this page may not read
    }
  }

  function writeBody() {
    const win = frameWindow()
    if (usesShell && win?.document.body) win.document.body.innerHTML = bodyRef.current ?? ''
  }

  // Shell mode: swap the body whenever the rendered content changes.
  useEffect(writeBody, [bodyHtml]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoad() {
    const win = frameWindow()
    if (!win) return
    writeBody()
    win.scrollTo(scrollRef.current.x, scrollRef.current.y)
    win.addEventListener(
      'scroll',
      () => {
        scrollRef.current = { x: win.scrollX, y: win.scrollY }
      },
      { passive: true },
    )
  }

  useImperativeHandle(ref, () => ({
    /** Scroll to a position given as a share (0 to 1) of the scrollable height. */
    scrollToFraction(fraction) {
      const win = frameWindow()
      if (!win) return
      const range = win.document.documentElement.scrollHeight - win.innerHeight
      win.scrollTo(0, Math.max(0, range) * fraction)
    },
  }))

  return (
    <iframe
      ref={frameRef}
      className="preview-frame"
      title={title}
      srcDoc={source}
      sandbox={SANDBOX}
      onLoad={handleLoad}
    />
  )
})
