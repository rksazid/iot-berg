import { serviceCatalog } from '../data/services'
import { PageIntro } from '../components/ui/PageIntro'
import { ServiceCard } from '../components/services/ServiceCard'

export function ServicesPage() {
  return (
    <div className="page page-services">
      <PageIntro
        eyebrow="Service catalog"
        title="Products from IoT-Berg, structured to scale into a broader platform."
        description="Each service is represented as a structured catalog entry with its own detail page, capabilities, and action flow."
      />

      <section className="service-grid">
        {serviceCatalog.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </section>
    </div>
  )
}
