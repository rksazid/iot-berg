import { useState, useEffect } from 'react'
import { workOrderStore } from '../../lib/workOrderStore'
import { optimizeImage } from '../../lib/imageOptimizer'
import { uploadToVercelBlob } from '../../lib/blobStorage'
import { useAuth } from '../../context/AuthContext'

export function PartnersPage() {
  const { hasRole } = useAuth()
  const [partners, setPartners] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingPartner, setEditingPartner] = useState(null)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [quote, setQuote] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [category, setCategory] = useState('Enterprise Client')
  const [sortOrder, setSortOrder] = useState(1)
  const [active, setActive] = useState(true)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoDataUrl, setLogoDataUrl] = useState('')
  const [logoStats, setLogoStats] = useState(null)

  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadPartners()
    workOrderStore.syncFromCloud().then(({ partners: synced }) => {
      if (Array.isArray(synced)) {
        setPartners([...synced].sort((a, b) => (Number(a.sortOrder) || 99) - (Number(b.sortOrder) || 99)))
      }
    })
  }, [])

  const loadPartners = () => {
    setPartners(workOrderStore.getPartners())
  }

  const handleOpenAdd = () => {
    setEditingPartner(null)
    setName('')
    setTitle('')
    setQuote('')
    setWebsiteUrl('')
    setCategory('Enterprise Client')
    setSortOrder(partners.length + 1)
    setActive(true)
    setLogoUrl('')
    setLogoDataUrl('')
    setLogoStats(null)
    setShowModal(true)
  }

  const handleOpenEdit = (partner) => {
    setEditingPartner(partner)
    setName(partner.name || '')
    setTitle(partner.title || '')
    setQuote(partner.quote || '')
    setWebsiteUrl(partner.websiteUrl || '')
    setCategory(partner.category || 'Enterprise Client')
    setSortOrder(partner.sortOrder != null ? partner.sortOrder : 1)
    setActive(partner.active !== false)
    setLogoUrl(partner.logoUrl || partner.logoDataUrl || '')
    setLogoDataUrl(partner.logoDataUrl || '')
    setLogoStats(null)
    setShowModal(true)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsOptimizing(true)
    try {
      let dataUrl = ''
      let contentType = 'image/png'

      try {
        const optimized = await optimizeImage(file, {
          maxWidth: 400,
          maxHeight: 240,
          outputType: 'image/png',
          trimWhitespace: false,
        })
        dataUrl = optimized.dataUrl
        setLogoStats({
          originalSize: Math.round(optimized.originalSizeBytes / 1024),
          optimizedSize: Math.round(optimized.sizeBytes / 1024),
          reduction: optimized.reductionPercent,
        })
      } catch (err) {
        console.warn('Logo optimization fallback:', err)
        contentType = file.type || 'image/png'
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve(ev.target.result)
          reader.onerror = () => reject(new Error('Failed to read image file'))
          reader.readAsDataURL(file)
        })
      }

      setLogoDataUrl(dataUrl)
      setLogoUrl(dataUrl)

      setIsUploading(true)
      const uploadRes = await uploadToVercelBlob({
        filename: `partner-logo-${Date.now()}.png`,
        base64Data: dataUrl,
        contentType,
      })
      if (uploadRes?.url) {
        setLogoUrl(uploadRes.url)
      }
    } catch (err) {
      console.error('Partner logo upload failed:', err)
      alert(`Logo upload note: ${err.message}`)
    } finally {
      setIsOptimizing(false)
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await workOrderStore.savePartnerAsync({
        ...(editingPartner ? { id: editingPartner.id } : {}),
        name: name.trim(),
        title: title.trim(),
        quote: quote.trim(),
        websiteUrl: websiteUrl.trim(),
        category,
        sortOrder: Number(sortOrder) || 1,
        active,
        logoUrl: logoUrl || logoDataUrl || null,
        logoDataUrl: logoDataUrl || (logoUrl && logoUrl.startsWith('data:') ? logoUrl : null),
      })
      setShowModal(false)
      loadPartners()
    } catch (err) {
      console.error('Failed to save partner:', err)
      alert(`Save error: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (partner) => {
    await workOrderStore.savePartnerAsync({
      ...partner,
      active: partner.active === false,
    })
    loadPartners()
  }

  const handleDelete = async (id, partnerName) => {
    if (confirm(`Remove trusted partner "${partnerName}" from the slider?`)) {
      await workOrderStore.deletePartnerAsync(id)
      loadPartners()
    }
  }

  return (
    <div className="admin-subpage-view">
      {/* Header */}
      <div className="subpage-header glass-panel">
        <div className="subpage-copy">
          <span className="section-label">Social Proof &amp; Client Showcase</span>
          <h2 className="subpage-title">Trusted Partners &amp; Testimonials</h2>
          <p className="subpage-desc">
            Upload partner logos with a concise title and optional testimonial to display on the homepage carousel.
          </p>
        </div>

        <div className="subpage-actions" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <a
            href="/#trusted-partners"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
          >
            <span>Preview Slider ↗</span>
          </a>
          {hasRole(['admin', 'manager']) && (
            <button type="button" className="button button-primary" onClick={handleOpenAdd}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Partner</span>
            </button>
          )}
        </div>
      </div>

      {/* Partners Grid */}
      <div className="admin-partners-grid">
        {partners.map((partner) => {
          const src = partner.logoUrl || partner.logoDataUrl
          return (
            <article
              key={partner.id}
              className={`admin-partner-card glass-panel ${partner.active === false ? 'is-hidden-partner' : ''}`}
            >
              <div className="admin-partner-top">
                <div className="partner-logo-frame">
                  {src ? (
                    <img
                      src={src}
                      alt={partner.name}
                      className="partner-logo-img"
                      onError={(e) => {
                        if (partner.logoDataUrl && e.currentTarget.src !== partner.logoDataUrl) {
                          e.currentTarget.src = partner.logoDataUrl
                        }
                      }}
                    />
                  ) : (
                    <span className="partner-logo-initials">
                      {(partner.name || 'IB').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className={partner.active !== false ? 'status-live-chip' : 'status-pending-chip'}>
                    {partner.active !== false ? 'Visible' : 'Hidden'}
                  </span>
                  <span className="addon-scope-pill">#{partner.sortOrder || 1}</span>
                </div>
              </div>

              <div className="admin-partner-body">
                <span className="partner-category-pill" style={{ marginBottom: '0.35rem', display: 'inline-block' }}>
                  {partner.category || 'Trusted Partner'}
                </span>
                <h3 className="partner-name" style={{ fontSize: '1rem', margin: '0 0 0.25rem' }}>
                  {partner.name}
                </h3>
                <p className="partner-title-line" style={{ margin: '0 0 0.45rem' }}>
                  {partner.title}
                </p>
                {partner.quote && (
                  <p className="partner-quote-text" style={{ margin: 0 }}>
                    “{partner.quote}”
                  </p>
                )}
              </div>

              <div className="admin-partner-actions">
                <button
                  type="button"
                  className="button button-sm button-secondary"
                  onClick={() => handleOpenEdit(partner)}
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  className="button button-sm button-ghost"
                  onClick={() => handleToggleActive(partner)}
                >
                  {partner.active !== false ? 'Hide' : 'Show'}
                </button>
                {hasRole(['admin']) && (
                  <button
                    type="button"
                    className="table-action-icon-btn danger"
                    title="Delete Partner"
                    onClick={() => handleDelete(partner.id, partner.name)}
                    style={{ marginLeft: 'auto' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* Add / Edit Partner Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header-row">
              <div>
                <span className="section-label">Slider Configuration</span>
                <h3 className="modal-title">
                  {editingPartner ? `Edit Partner (${editingPartner.name})` : 'Add Trusted Partner / Endorsement'}
                </h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body-form">
              {/* Partner Logo Upload */}
              <div className="form-group">
                <label>Partner Logo (Auto-optimized &amp; stored in Vercel Blob)</label>
                <input
                  type="file"
                  id="partner-logo-input"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="partner-logo-input" className="sig-upload-dropzone" style={{ padding: '1rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>
                    {isOptimizing
                      ? 'Optimizing logo in Canvas...'
                      : isUploading
                      ? 'Uploading to Vercel Object Storage...'
                      : logoUrl
                      ? 'Replace Partner Logo Image (PNG, JPG, WebP, SVG)'
                      : 'Click to Upload Partner Logo'}
                  </span>
                </label>

                {(logoUrl || logoDataUrl) && (
                  <div className="sig-attached-card" style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={logoUrl || logoDataUrl}
                        alt="Partner Logo Preview"
                        style={{ maxHeight: '44px', maxWidth: '120px', objectFit: 'contain' }}
                      />
                      <div>
                        <span className="stat-pill-sm green">✓ Logo Attached</span>
                        {logoStats && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Optimized: {logoStats.optimizedSize} KB (Saved {logoStats.reduction}%)
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="sig-remove-btn"
                      onClick={() => {
                        setLogoUrl('')
                        setLogoDataUrl('')
                        setLogoStats(null)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="partner-name">Partner / Client Name</label>
                  <input
                    id="partner-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sazin Innovative Industries Ltd."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="partner-category">Badge / Category</label>
                  <select
                    id="partner-category"
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Enterprise Client">Enterprise Client</option>
                    <option value="Institutional Partner">Institutional Partner</option>
                    <option value="EdTech LMS">EdTech LMS</option>
                    <option value="Community Portal">Community Portal</option>
                    <option value="Technology Partner">Technology Partner</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="partner-title">Short Title / Subtitle</label>
                <input
                  id="partner-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Industrial B2B Website & Cloud SLA Client"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="partner-quote">Short Note / Testimonial (Optional)</label>
                <textarea
                  id="partner-quote"
                  className="form-input textarea"
                  rows="2"
                  placeholder="Short endorsement or project outcome shown on slide..."
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                />
              </div>

              <div className="form-row-3col">
                <div className="form-group">
                  <label htmlFor="partner-url">Website URL (Optional)</label>
                  <input
                    id="partner-url"
                    type="url"
                    className="form-input"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="partner-order">Slide Order</label>
                  <input
                    id="partner-order"
                    type="number"
                    min="1"
                    className="form-input"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="partner-active">Visibility</label>
                  <select
                    id="partner-active"
                    className="form-input"
                    value={active ? 'yes' : 'no'}
                    onChange={(e) => setActive(e.target.value === 'yes')}
                  >
                    <option value="yes">Visible on Slider</option>
                    <option value="no">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="button button-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={isSaving || isOptimizing || isUploading}
                >
                  {isUploading ? 'Uploading Logo...' : isSaving ? 'Saving...' : editingPartner ? 'Save Partner' : 'Add to Slider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

