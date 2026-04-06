import { Link } from 'react-router-dom'

export function ServiceCard({ service }) {
  return (
    <article className="service-card glass-panel">
      <div className="service-card-top">
        <div className="service-card-head">
          <span className="service-pill">{service.status}</span>
          <span className="service-category">{service.category}</span>
        </div>
        <h2>{service.name}</h2>
        <p>{service.summary}</p>
      </div>

      <div className="service-metric-strip">
        {service.metrics.map((metric) => (
          <div className="service-metric" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="service-meta">
        {service.highlights.map((item) => (
          <span className="service-tag" key={item}>
            {item}
          </span>
        ))}
      </div>

      <div className="service-card-actions">
        <Link className="button button-primary button-full" to={`/services/${service.slug}`}>
          Open Service
        </Link>
      </div>
    </article>
  )
}
