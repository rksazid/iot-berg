import { serviceCatalog } from '../data/services'
import { PageIntro } from '../components/ui/PageIntro'
import { ServiceCard } from '../components/services/ServiceCard'

const catalogNotes = [
  {
    title: 'Professional catalog structure',
    description: 'Each service can have its own detail page, capability summary, and action flow without changing the site foundation.',
  },
  {
    title: 'Scalable frontend organization',
    description: 'Shared layout, config, and service modules make the site easier to extend as more products are introduced.',
  },
  {
    title: 'Live service integration',
    description: 'The current catalog includes a working HTML-to-PDF experience connected to live public endpoints.',
  },
]

export function ServicesPage() {
  return (
    <div className="page page-services">
      <PageIntro
        eyebrow="Service catalog"
        title="Products from IoT-Berg, structured to scale into a broader platform."
        description="Each service is represented as a structured catalog entry with its own detail page, capabilities, and action flow."
      />

      <section className="catalog-notes">
        {catalogNotes.map((note) => (
          <article className="catalog-note glass-panel" key={note.title}>
            <h2>{note.title}</h2>
            <p>{note.description}</p>
          </article>
        ))}
      </section>

      <section className="service-grid">
        {serviceCatalog.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </section>
    </div>
  )
}
