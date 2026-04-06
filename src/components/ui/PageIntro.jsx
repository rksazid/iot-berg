export function PageIntro({ eyebrow, title, description, compact = false }) {
  return (
    <section className={`page-intro-panel glass-panel ${compact ? 'page-intro-compact' : ''}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-intro-text">{description}</p>
    </section>
  )
}
