import { createReadStream, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The passport photo studio runs MediaPipe in the browser, which loads its
// WebAssembly runtime by URL at run time. Serving those files straight from
// the installed package keeps them in step with the JS that calls them.
function mediapipeWasm() {
  const route = '/mediapipe/wasm/'
  const files = {
    'vision_wasm_internal.js': 'text/javascript',
    'vision_wasm_internal.wasm': 'application/wasm',
  }
  const locate = (name) =>
    fileURLToPath(new URL(`./node_modules/@mediapipe/tasks-vision/wasm/${name}`, import.meta.url))

  return {
    name: 'mediapipe-wasm',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const name = path.startsWith(route) ? path.slice(route.length) : ''
        if (!Object.hasOwn(files, name)) return next()
        res.setHeader('Content-Type', files[name])
        createReadStream(locate(name)).pipe(res)
      })
    },
    generateBundle() {
      for (const name of Object.keys(files)) {
        this.emitFile({ type: 'asset', fileName: `${route.slice(1)}${name}`, source: readFileSync(locate(name)) })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), mediapipeWasm()],
})
