import { Link } from 'react-router-dom'
import { serviceCatalog } from '../data/services'

export function ServicesPage() {
  return (
    <div className="page page-services">
      <section className="page-header">
        <p className="eyebrow">Service catalog</p>
        <h1>Products from IoT-Berg, built to grow over time.</h1>
        <p className="page-intro">
          The catalog starts with document generation and is structured for future software services. Each service gets its own detail page and workflow entry point.
        </p>
      </section>

      <section className="service-grid">
        {serviceCatalog.map((service) => (
          <article className="service-card" key={service.slug}>
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
            <Link className="button button-primary button-full" to={`/services/${service.slug}`}>
              Open Service
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
