import { Link } from 'react-router-dom'

export function ServiceCard({ service }) {
  return (
    <article className="service-card glass-panel">
      <div className="service-card-top">
        <span className="service-pill">Active service</span>
        <h2>{service.name}</h2>
        <p>{service.summary}</p>
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
