import { useState, useEffect, Fragment } from 'react'
import { Certificate } from '@/types'
import api from '@/services/api'
import CertificateCard from '@/components/certificates/CertificateCard'
import { AdInFeed } from '@/components/ads/AdInFeed'
import { useAuthStore } from '@/store/authStore'

export default function Certificates() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()

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
      <div className="flex flex-col items-center justify-center gap-6 p-12 text-[var(--color-muted)] text-sm">
        No certificates yet.
        {!user?.isPremium && <AdInFeed />}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {certs.map((cert, i) => (
        <Fragment key={cert.id}>
          <CertificateCard cert={cert} onUpdate={fetchCertificates} />
          {!user?.isPremium && (i + 1) % 6 === 0 && (
            <div className="col-span-full flex justify-center"><AdInFeed /></div>
          )}
        </Fragment>
      ))}
    </div>
  )
}