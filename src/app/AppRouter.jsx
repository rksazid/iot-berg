import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './SiteLayout'
import { HomePage } from '../pages/HomePage'
import { ConvertPage } from '../pages/ConvertPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/convert" element={<ConvertPage />} />
        <Route path="/convert/:tool" element={<ConvertPage />} />

        {/* Legacy routes redirect into the unified converter workspace */}
        <Route path="/services" element={<Navigate to="/convert" replace />} />
        <Route path="/services/html-to-pdf" element={<Navigate to="/convert/html" replace />} />
        <Route path="/services/md-to-pdf" element={<Navigate to="/convert/markdown" replace />} />
        <Route path="/services/docx-to-pdf" element={<Navigate to="/convert/docx" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
