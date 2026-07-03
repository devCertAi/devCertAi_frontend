import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Award, ExternalLink, Download } from 'lucide-react'
import { Certificate } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AdInFeed } from '@/components/ads/AdInFeed'
import { getLevelColor, formatDate } from '@/lib/utils'
import api from '@/services/api'

// This component handles BOTH:
//   /verify/:verificationId  (public, no auth required)
//   /certificate/:verificationId  (also public — same component, registered on both routes)

export default function Verify() {
  const { verificationId } = useParams<{ verificationId: string }>()
  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    api.get(`/certificates/verify/${verificationId}`)
      .then(({ data }) => setCert(data.data.certificate))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [verificationId])

  const handleDownload = async () => {
    if (!cert) return
    setDownloading(true)
    try {
      // Try authenticated download first (gives PDF from backend)
      const response = await api.get(`/certificates/${cert.id}/download`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devcert-${cert.verificationId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      // Fallback: open Cloudinary URL directly
      if ((cert as any).certificateUrl) {
        window.open((cert as any).certificateUrl, '_blank')
      }
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="animate-pulse text-[var(--color-muted)]">Verifying...</div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-xl font-semibold text-[var(--color-text)] mb-2">Certificate Not Found</p>
        <p className="text-[var(--color-muted)]">This certificate ID doesn't exist or was revoked.</p>
        <Link to="/" className="text-[var(--color-primary)] hover:underline text-sm mt-4 block">← Back to DevCert</Link>
      </div>
    </div>
  )

  const color = getLevelColor(cert!.level)

  // Prefer AI-detected domain from evaluationReport, fall back to cert.domain
  const displayDomain =
    (cert as any).project?.evaluationReport?.domainReport?.detectedDomain ||
    (cert as any).evaluationReport?.domainReport?.detectedDomain ||
    cert!.domain

  // AI-detected tech stack
  const techStack: string[] =
    (cert as any).project?.evaluationReport?.domainReport?.detectedTechStack ||
    (cert as any).project?.evaluationReport?.techStack ||
    []

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--color-inverse)] font-bold text-sm">DC</span>
            </div>
            <span className="font-bold text-[var(--color-text)]">DevCert</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] rounded-full mb-4">
            <CheckCircle size={16} className="text-[var(--color-success)]" />
            <span className="text-sm font-medium text-[var(--color-success)]">Verified by DevCert AI</span>
          </div>
        </div>

        <Card
          className="p-8 text-center"
          style={{
            background: `linear-gradient(135deg, ${color}08 0%, transparent 100%)`,
            borderColor: `${color}20`
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            <Award size={28} style={{ color }} />
          </div>

          <p className="text-sm text-[var(--color-muted)] mb-1">This certifies that</p>
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-4">{cert!.user?.name}</h1>

          <p className="text-sm text-[var(--color-muted)] mb-2">has demonstrated</p>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-base font-semibold mb-2"
            style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
          >
            {cert!.level}
          </span>
          <p className="text-sm text-[var(--color-muted)] mb-1">level proficiency in</p>
          <h2 className="text-2xl font-bold text-[var(--color-text)] capitalize mb-3">{displayDomain}</h2>

          {/* AI-detected tech stack */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {techStack.map((tech: string) => (
                <span
                  key={tech}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ color, backgroundColor: `${color}12`, border: `1px solid ${color}25` }}
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-8 py-5 border-t border-[var(--color-border)]">
            <div>
              <p className="text-xs text-[var(--color-muted)]">Score</p>
              <p className="text-lg font-bold text-[var(--color-text)]">{cert!.score}/100</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Type</p>
              <p className="text-sm font-medium text-[var(--color-text)]">
                {cert!.type === 'project_eval' ? 'ProjCert' : 'SkillCert'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Issued</p>
              <p className="text-sm font-medium text-[var(--color-text)]">{formatDate(cert!.createdAt)}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider mb-1">Certificate ID</p>
            <p className="text-xs font-mono text-[var(--color-muted)]">{cert!.verificationId}</p>
          </div>

          {/* Download button */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex justify-center gap-3">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="text-sm"
              style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
            >
              <Download size={14} />
              {downloading ? 'Downloading...' : 'Download Certificate'}
            </Button>
          </div>
        </Card>

        <div className="mt-6 flex justify-center"><AdInFeed /></div>

        <div className="text-center mt-6">
          <Link
            to={`/profile/${cert!.user?.username}`}
            className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
          >
            View {cert!.user?.name}'s Profile <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  )
}