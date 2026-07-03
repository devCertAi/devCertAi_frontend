import { useState, useEffect } from 'react'
import { Certificate } from '@/types'
import api from '@/services/api'
import CertificateCard from '@/components/certificates/CertificateCard'

export default function Certificates() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)

const fetchCertificates = () => {
  setIsLoading(true)
  api
    .get('/certificates')
    .then(res => {
      console.log('certificates raw response:', res.data)
      const payload = res.data?.data
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.certificates)
          ? payload.certificates
          : []
      setCerts(list)
    })
    .catch(err => {
      console.error(err)
      setCerts([])
    })
    .finally(() => setIsLoading(false))
}

  useEffect(() => {
    fetchCertificates()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-[var(--color-muted)] text-sm">
        Loading certificates...
      </div>
    )
  }

  if (certs.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-[var(--color-muted)] text-sm">
        No certificates yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {certs.map(cert => (
        <CertificateCard key={cert.id} cert={cert} onUpdate={fetchCertificates} />
      ))}
    </div>
  )
}