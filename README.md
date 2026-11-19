# IoT-Berg

Landing page and service platform frontend for IoT-Berg, built with React and Vite.

## Scripts

```bash
npm install
npm run dev
npm run build
```

## PDF Endpoint Configuration

The frontend reads its PDF API endpoints from Vite environment variables.

Create a local `.env` file from `.env.example` and adjust the values if needed:

```bash
VITE_PDF_API_PRIMARY_URL=https://pdf-lagbe.onrender.com
VITE_PDF_API_SECONDARY_URL=https://pdf-lagbe.vercel.app
```

Behavior:

- `Auto select` tries the primary endpoint first and falls back to the secondary endpoint when the request cannot be completed.
- You can also manually choose a specific endpoint from the service page UI.

## Passport Photo Studio

`/passport-photo` turns a portrait into a correctly sized passport, visa or ID photo. Everything runs in the visitor's browser with [MediaPipe Tasks](https://ai.google.dev/edge/mediapipe/solutions/guide). The photo is never uploaded.

- Document sizes and head-size rules live in `src/data/photoSpecs.js`.
- The two models in `public/models/passport/` are Google's published MediaPipe models (`face_landmarker.task` and `selfie_multiclass_256x256.tflite`), self-hosted so the page has no third-party requests.
- The WebAssembly runtime is served from the installed `@mediapipe/tasks-vision` package by a small plugin in `vite.config.js`, so it always matches the JS version.
- `npm test` runs the cropping, print-sheet and JPEG unit tests.

## Vercel Deployment

This project includes `vercel.json` so direct visits to client-side routes like `/services/html-to-pdf` work correctly on Vercel.

Deploy with the Vercel CLI:

```bash
npx vercel deploy --prod
```

If you prefer Git-based deployment, connect the repository to Vercel and push changes to trigger a deployment.
