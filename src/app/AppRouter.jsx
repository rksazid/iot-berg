import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './SiteLayout'
import { HomePage } from '../pages/HomePage'
import { ConvertPage } from '../pages/ConvertPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { VerifyReceiptPage } from '../pages/VerifyReceiptPage'
import { LoginPage } from '../pages/admin/LoginPage'
import { AdminLayout } from '../pages/admin/AdminLayout'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { WorkOrdersPage } from '../pages/admin/WorkOrdersPage'
import { ReceiptsPage } from '../pages/admin/ReceiptsPage'
import { CreateReceiptPage } from '../pages/admin/CreateReceiptPage'

export function AppRouter() {
  return (
    <Routes>
      {/* Public Portfolio & Conversion Tools (Header + Footer) */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/docs" element={<Navigate to="/projects?tab=api" replace />} />
        <Route path="/showcase" element={<Navigate to="/projects" replace />} />
        <Route path="/convert" element={<ConvertPage />} />
        <Route path="/convert/:tool" element={<ConvertPage />} />

        {/* Public Money Receipt Online Verification Portal */}
        <Route path="/verify" element={<VerifyReceiptPage />} />
        <Route path="/verify/:receiptId" element={<VerifyReceiptPage />} />

        {/* Legacy routes redirect into the unified converter workspace */}
        <Route path="/services" element={<Navigate to="/convert" replace />} />
        <Route path="/services/html-to-pdf" element={<Navigate to="/convert/html" replace />} />
        <Route path="/services/md-to-pdf" element={<Navigate to="/convert/markdown" replace />} />
        <Route path="/services/docx-to-pdf" element={<Navigate to="/convert/docx" replace />} />
      </Route>

      {/* Admin Login (Clean Full-Screen Standalone View) */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Dedicated Traditional Admin Panel (Sidebar + Minimal Topbar, No Site Header/Footer) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="work-orders" element={<WorkOrdersPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="receipts/new" element={<CreateReceiptPage />} />
        <Route path="receipts/:receiptId/edit" element={<CreateReceiptPage />} />
        <Route path="receipts/edit/:receiptId" element={<CreateReceiptPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
