const primaryUrl =
  import.meta.env.VITE_PDF_API_PRIMARY_URL || 'https://pdf-lagbe.onrender.com'

const secondaryUrl =
  import.meta.env.VITE_PDF_API_SECONDARY_URL || 'https://pdf-lagbe.vercel.app'

const manualEndpoints = [
  {
    key: 'primary',
    label: 'Primary endpoint',
    value: primaryUrl,
    note: 'Preferred deployment for normal traffic.',
  },
  {
    key: 'secondary',
    label: 'Secondary endpoint',
    value: secondaryUrl,
    note: 'Backup deployment for resilience and testing.',
  },
].filter((endpoint, index, all) => {
  return endpoint.value && all.findIndex((item) => item.value === endpoint.value) === index
})

export const endpointOptions = [
  {
    key: 'auto',
    label: 'Auto select',
    note: 'Tries the primary endpoint first and falls back when the request cannot be completed.',
  },
  ...manualEndpoints,
]

export const configuredEndpoints = manualEndpoints.map((endpoint) => ({
  name: endpoint.label,
  value: endpoint.value,
  note: endpoint.note,
}))

export function getEndpointCandidates(mode) {
  if (mode === 'auto') {
    return manualEndpoints.map((endpoint) => endpoint.value)
  }

  const selected = manualEndpoints.find((endpoint) => endpoint.key === mode)

  return selected ? [selected.value] : [primaryUrl]
}
