import { motion, AnimatePresence } from 'framer-motion'
import { Award, Download, Share2, Eye, EyeOff, ExternalLink, X, ZoomIn } from 'lucide-react'
import { Certificate } from '@/types'
import { formatDate, getLevelColor } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { useState } from 'react'



interface CertificateCardProps { cert: Certificate; onUpdate?: () => void }

// Shared certificate design tokens — per-level metal palette. Keep this in
// sync with backend/src/services/certificateService.js LEVEL_METAL so the
// on-screen preview and the downloaded PDF always match.
const LEVEL_METAL: Record<string, { stops: string[]; glow: string; sealFrom: string; sealMid: string; sealTo: string }> = {
  Advanced:     { stops: ['#FFF6D8', '#F0D278', '#C9A227', '#8B6914', '#F0D278', '#FFF6D8'], glow: 'rgba(201,162,39,0.45)', sealFrom: '#fcd34d', sealMid: '#d97706', sealTo: '#92400e' },
  Intermediate: { stops: ['#FFFFFF', '#D6DEEA', '#8593AC', '#4A5670', '#D6DEEA', '#FFFFFF'], glow: 'rgba(91,107,140,0.4)',  sealFrom: '#e2e8f0', sealMid: '#64748b', sealTo: '#334155' },
  Beginner:     { stops: ['#F6DCC0', '#DBA976', '#B87333', '#7A4B1F', '#DBA976', '#F6DCC0'], glow: 'rgba(184,115,51,0.4)',  sealFrom: '#f0b27a', sealMid: '#b87333', sealTo: '#7a4b1f' },
}

// Small alias so the compact dashboard card (which only needs a single
// accent colour) doesn't have to reach into LEVEL_METAL.
const LEVEL_COLORS: Record<string, { primary: string; glow: string }> = {
  Advanced:     { primary: '#D4A017', glow: 'rgba(212,160,23,0.28)' },
  Intermediate: { primary: '#5B6B8C', glow: 'rgba(91,107,140,0.24)' },
  Beginner:     { primary: '#B0703A', glow: 'rgba(176,112,58,0.24)' },
}

function CertificatePreviewModal({ cert, displayDomain, onClose }: {
  cert: Certificate
  displayDomain: string
  onClose: () => void
}) {
  const issuedDate = formatDate(cert.createdAt)
  const typeLabel = cert.type === 'project_eval'
    ? 'ProjCert — Project Evaluation Certificate'
    : cert.type === 'combo_cert'
      ? 'ComboCert — Phase 1 + Phase 2 Combined Certificate'
      : 'SkillCert — Verified Skill Certificate'
  // FIX: this previously read `user?.username` (the login handle, e.g.
  // "john123") *before* the real name, and its fallback `(cert as any).name`
  // doesn't exist on the Certificate type at all — so the certificate almost
  // always rendered the username, or silently fell through to a generic
  // placeholder. The real name lives at `cert.user?.name` (see Verify.tsx),
  // with `cert.userName` as a fallback for endpoints that flatten it.
  const holderName = cert.user?.name || (cert as any).userName || 'Certificate Holder'
  const comboMeta = cert.type === 'combo_cert' ? (cert as any).metadata : null
  const projectTitle = (cert as any).project?.title as string | undefined
  const difficultyLabel = cert.difficulty
    ? String(cert.difficulty).charAt(0).toUpperCase() + String(cert.difficulty).slice(1)
    : null

  const metal = LEVEL_METAL[cert.level] || LEVEL_METAL.Advanced

  const extraLine = comboMeta
    ? `Phase 1: ${comboMeta.phase1Score ?? '-'}/100 &middot; Phase 2: ${comboMeta.phase2Score ?? '-'}/100`
    : projectTitle
      ? `Project: ${projectTitle}`
      : ''

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:1123px; height:794px;
  background:#E7E9EF;
  display:flex; align-items:center; justify-content:center;
  overflow:hidden;
  font-family:'EB Garamond', Georgia, serif;
}

.page {
  width:1060px; height:740px;
  background: #fdfcfa;
  border: 1px solid #cbd5e1;
  position:relative;
  overflow:hidden;
  box-shadow:
    0 0 0 8px #ffffff,
    0 0 0 9px #cbd5e1,
    0 25px 70px rgba(30,41,59,0.15),
    0 4px 18px rgba(30,41,59,0.10);
}

/* The dark navy ribbon running down the left side */
.vertical-ribbon {
  position: absolute;
  top: 0;
  left: 80px;
  width: 45px;
  height: 100%;
  background-color: #0f172a;
  z-index: 1;
}

/* Metallic badge overlapping the ribbon — colour follows certificate level */
.gold-seal {
  position: absolute;
  top: 110px;
  left: 52px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, ${metal.sealFrom} 0%, ${metal.sealMid} 70%, ${metal.sealTo} 100%);
  border-radius: 50%;
  border: 4px solid #0f172a;
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gold-seal::after {
  content: '';
  width: 76px;
  height: 76px;
  border: 1.5px dashed rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  position: absolute;
}

.content {
  position:absolute;
  inset: 0;
  padding-left: 200px;
  padding-right: 80px;
  display:flex;
  flex-direction:column;
  justify-content: center;
  align-items: flex-start;
}

.brand-name {
  position: absolute;
  top: 60px;
  right: 80px;
  font-family: 'Cinzel', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #0f172a;
}

.brand-name span { color: #d97706; }

.main-title {
  font-family: 'Playfair Display', serif;
  font-size: 76px;
  font-weight: 400;
  font-style: italic;
  color: #0f172a;
  line-height: 1;
  margin-bottom: -3px;
}

.sub-title-box {
  background-color: #0f172a;
  color: #ffffff;
  font-family: 'Cinzel', sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 5px;
  padding: 5px 20px 4px 24px;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: inline-block;
}

.type-label {
  font-family: 'Cinzel', sans-serif;
  font-size: 10px;
  letter-spacing: 2.5px;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 26px;
}

.certifies-that {
  font-family: 'EB Garamond', serif;
  font-size: 19px;
  color: #475569;
  margin-bottom: 12px;
}

.holder-name {
  font-family: 'Playfair Display', serif;
  font-size: 38px;
  font-weight: 700;
  color: #0f172a;
  border-bottom: 1px solid #94a3b8;
  padding-bottom: 4px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 550px;
}

.details-text {
  font-family: 'EB Garamond', serif;
  font-size: 19px;
  line-height: 1.6;
  color: #475569;
  margin-bottom: 8px;
  max-width: 650px;
}

.details-text strong {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  color: #0f172a;
}

.extra-line {
  font-family: 'EB Garamond', serif;
  font-style: italic;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 34px;
}

.bottom-meta {
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  justify-content: space-between;
  align-items: flex-end;
}

.meta-block { display: flex; flex-direction: column; gap: 4px; }

.meta-lbl {
  font-family: 'Cinzel', sans-serif;
  font-size: 9px;
  letter-spacing: 2px;
  color: #94a3b8;
  text-transform: uppercase;
}

.meta-val {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.v-id {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #475569;
  font-weight: bold;
}
</style>
</head>
<body>
<div class="page">
  <div class="vertical-ribbon"></div>
  <div class="gold-seal">
     <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.25">
       <path d="M6 3c0 6 3 10 6 12m6-12c0 6-3 10-6 12" />
       <path d="M4 6c2 0 3.5 1 4 2M4 10c2 0 3.5 1 4 2m-4 4c2 0 3.5 1 4 2" />
       <path d="M20 6c-2 0-3.5 1-4 2m4 2c-2 0-3.5 1-4 2m4 4c-2 0-3.5 1-4 2" />
       <circle cx="12" cy="16" r="1.5" fill="#ffffff"/>
     </svg>
  </div>

  <div class="content">
    <div class="brand-name"><span>DevCert</span></div>

    <div class="main-title">Certificate</div>
    <div class="sub-title-box">Of Completion</div>
    <div class="type-label">${typeLabel}</div>

    <div class="certifies-that">This certificate is proudly presented to</div>
    <div class="holder-name">${holderName}</div>

    <div class="details-text">
      for successfully demonstrating <strong>${cert.level}</strong> level proficiency in
      the framework environment discipline of <strong>${displayDomain}</strong> on project implementation evaluations.
    </div>
    ${extraLine ? `<div class="extra-line">${extraLine}</div>` : '<div style="margin-bottom:34px"></div>'}

    <div class="bottom-meta">
      <div class="meta-block">
        <span class="meta-lbl">Date Issued</span>
        <span class="meta-val">${issuedDate}</span>
      </div>
      <div class="meta-block" style="align-items: center;">
        <span class="meta-lbl">Score Achieved</span>
        <span class="meta-val">${cert.score} / 100</span>
      </div>
      ${difficultyLabel ? `
      <div class="meta-block" style="align-items: center;">
        <span class="meta-lbl">Difficulty</span>
        <span class="meta-val">${difficultyLabel}</span>
      </div>` : ''}
      <div class="meta-block" style="text-align: right; align-items: flex-end;">
        <span class="meta-lbl">Certificate Number</span>
        <span class="v-id">${cert.verificationId || '0000'}</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const src = URL.createObjectURL(blob)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative w-full max-w-5xl px-2"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white/60 hover:text-white flex items-center gap-1 text-sm"
          >
            <X size={16} /> Close
          </button>

          {/* Certificate iframe - scaled to fit modal */}
          <div
            className="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-2xl w-full"
            style={{ aspectRatio: '1123/794', position: 'relative' }}
          >
            <iframe
              src={src}
              style={{
                border: 'none',
                width: '1123px',
                height: '794px',
                transform: 'scale(var(--cert-scale, 1))',
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              onLoad={function(e) {
                URL.revokeObjectURL(src)
                const container = (e.target as HTMLIFrameElement).parentElement!
                const scale = container.offsetWidth / 1123
                ;(container as HTMLElement).style.setProperty('--cert-scale', String(scale))
                ;(e.target as HTMLIFrameElement).style.transform = `scale(${scale})`
              }}
            />
          </div>

          {/* Actions below preview */}
          <div className="flex justify-center gap-3 mt-4">

            <a  href={`/certificate/${cert.verificationId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-text)]"
              style={{ backgroundColor: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)' }}
            >
              <ExternalLink size={14} /> Open Full Page
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function CertificateCard({ cert, onUpdate }: CertificateCardProps) {
  // Hooks must run unconditionally, so use a safe default if cert is missing
  const [isPublic, setIsPublic] = useState(cert?.isPublic ?? false)
  const [showPreview, setShowPreview] = useState(false)

  // Guard against an undefined/null cert (e.g. data still loading, or a
  // bad entry in the certificates array) so the whole tree doesn't crash
  if (!cert) return null

  const displayDomain =
    (cert as any).evaluationReport?.domainReport?.detectedDomain ||
    (cert as any).domainReport?.detectedDomain ||
    cert.domain

  const color = getLevelColor(cert.level)

  const handleOpenNewTab = () => {
    window.open(`/certificate/${cert.verificationId}`, '_blank')
  }

  const handleDownload = async () => {
    try {
      const response = await api.get(`/certificates/${cert.id}/download`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devcert-${cert.verificationId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    }
  }

  const toggleVisibility = async () => {
    try {
      await api.put(`/certificates/${cert.id}/visibility`)
      const next = !isPublic
      setIsPublic(next)
      toast.success(`Certificate is now ${next ? 'public' : 'private'}`)
      onUpdate?.()
    } catch { toast.error('Failed to update visibility') }
  }

  const handleLinkedIn = () => {
    const url = `${window.location.origin}/certificate/${cert.verificationId}`
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(shareUrl, '_blank')
  }

  return (
    <>
      <motion.div
        whileHover={{ y: -3 }}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden cursor-pointer"
        onClick={handleOpenNewTab}
      >
        <div className="p-5 relative" style={{ background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)` }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
              <Award size={20} style={{ color }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--color-muted)] bg-[var(--color-surface2)] px-2 py-1 rounded-lg">
                {cert.type === 'project_eval' ? 'ProjCert' : cert.type === 'combo_cert' ? 'ComboCert' : 'SkillCert'}
              </span>
              <ExternalLink size={12} className="text-[var(--color-muted)]" />
            </div>
          </div>
          <h3 className="font-semibold text-[var(--color-text)] capitalize mb-1">{displayDomain}</h3>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>{cert.level}</span>
            <span className="text-sm font-bold" style={{ color }}>{cert.score}/100</span>
            {cert.difficulty && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-[var(--color-muted)] bg-[var(--color-surface2)] border border-[var(--color-border)] capitalize">
                {cert.difficulty}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-muted)]">Issued {formatDate(cert.createdAt)}</p>
        </div>

        <div className="px-5 py-3 border-t border-[var(--color-border)] flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {/* View button — shows certificate preview modal */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPreview(true)}
            className="flex-1 text-xs"
            style={{ color }}
          >
            <ZoomIn size={13} /> View
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDownload} className="flex-1 text-xs">
            <Download size={13} /> Download
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLinkedIn} className="flex-1 text-xs">
            <Share2 size={13} /> Share
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleVisibility} className="text-xs p-2">
            {isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
          </Button>
        </div>
      </motion.div>

      {showPreview && (
        <CertificatePreviewModal
          cert={cert}
          displayDomain={displayDomain}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}