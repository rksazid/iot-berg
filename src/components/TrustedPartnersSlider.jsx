import { useState, useEffect, useRef } from 'react'
import { workOrderStore } from '../lib/workOrderStore'

export function TrustedPartnersSlider() {
  const [partners, setPartners] = useState(() =>
    workOrderStore.getPartners().filter((p) => p.active !== false),
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const trackRef = useRef(null)

  useEffect(() => {
    let active = true
    workOrderStore.syncFromCloud().then(({ partners: synced }) => {
      if (active && Array.isArray(synced)) {
        setPartners(synced.filter((p) => p.active !== false))
      }
    })
    return () => {
      active = false
    }
  }, [])

  // Gentle auto-rotation across partners when not paused
  useEffect(() => {
    if (isPaused || partners.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % partners.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, partners.length])

  // Smoothly center the active card inside horizontal track when user clicks dot/arrow or advances
  useEffect(() => {
    const container = trackRef.current
    if (!container) return
    const cards = container.querySelectorAll('.partner-slider-card')
    const targetCard = cards[activeIndex]
    if (targetCard) {
      const containerLeft = container.getBoundingClientRect().left
      const cardLeft = targetCard.getBoundingClientRect().left
      const offset = cardLeft - containerLeft + container.scrollLeft
      container.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [activeIndex])

  if (!partners.length) return null

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + partners.length) % partners.length)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % partners.length)
  }

  return (
    <section
      id="trusted-partners"
      className="partners-slider-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="partners-header-bar">
        <div className="partners-header-copy">
          <div className="hero-eyebrow-wrap">
            <span className="section-label">Trusted By Teams &amp; Organizations</span>
            <span className="version-pill">{partners.length} Verified Partners</span>
          </div>
          <h2 className="section-title" style={{ marginBottom: '0.35rem' }}>
            Trusted partners, client platforms &amp; endorsements.
          </h2>
          <p className="section-subtitle" style={{ margin: 0, textAlign: 'left' }}>
            See how institutions, schools, and growing enterprises collaborate with Team IoT-Berg in production.
          </p>
        </div>

        <div className="slider-controls-group">
          <button
            type="button"
            className="slider-nav-btn"
            onClick={handlePrev}
            aria-label="Previous partner"
            title="Previous partner"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="slider-nav-btn"
            onClick={handleNext}
            aria-label="Next partner"
            title="Next partner"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div className="partners-carousel-track" ref={trackRef}>
        {partners.map((partner, idx) => {
          const logoSrc = partner.logoUrl || partner.logoDataUrl
          const initials = (partner.name || 'IB')
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()

          return (
            <article
              key={partner.id}
              className={`partner-slider-card glass-panel ${idx === activeIndex ? 'is-featured-slide' : ''}`}
              onClick={() => setActiveIndex(idx)}
            >
              <div className="partner-card-top">
                <div className="partner-logo-frame">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={`${partner.name} Logo`}
                      className="partner-logo-img"
                      loading="lazy"
                      onError={(e) => {
                        if (partner.logoDataUrl && e.currentTarget.src !== partner.logoDataUrl) {
                          e.currentTarget.src = partner.logoDataUrl
                        }
                      }}
                    />
                  ) : (
                    <span className="partner-logo-initials">{initials}</span>
                  )}
                </div>
                {partner.category && (
                  <span className="partner-category-pill">{partner.category}</span>
                )}
              </div>

              <div className="partner-card-body">
                <h3 className="partner-name">{partner.name}</h3>
                <p className="partner-title-line">{partner.title}</p>
                {partner.quote && (
                  <p className="partner-quote-text">“{partner.quote}”</p>
                )}
              </div>

              <div className="partner-card-footer">
                <span className="partner-verified-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Active Partner
                </span>
                {partner.websiteUrl && (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="partner-visit-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit ↗
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* Pagination Dots */}
      {partners.length > 1 && (
        <div className="slider-dots-row" role="tablist" aria-label="Partner slides">
          {partners.map((partner, idx) => (
            <button
              key={partner.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`View ${partner.name}`}
              className={`slider-dot ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
