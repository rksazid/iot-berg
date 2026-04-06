import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from './SiteLayout'
import { HomePage } from '../pages/HomePage'
import { ServicesPage } from '../pages/ServicesPage'
import { HtmlToPdfPage } from '../pages/HtmlToPdfPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/html-to-pdf" element={<HtmlToPdfPage />} />
      </Route>
    </Routes>
  )
}
