import { motion, AnimatePresence } from 'framer-motion'
import { Award, Download, Share2, Eye, EyeOff, ExternalLink, X, ZoomIn } from 'lucide-react'
import { Certificate } from '@/types'
import { formatDate, getLevelColor } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { useState } from 'react'



interface CertificateCardProps { cert: Certificate; onUpdate?: () => void }

const LEVEL_COLORS: Record<string, { primary: string; glow: string }> = {
  Advanced:     { primary: '#FFD700', glow: 'rgba(255,215,0,0.15)' },
  Intermediate: { primary: '#C0C0C0', glow: 'rgba(192,192,192,0.15)' },
  Beginner:     { primary: '#CD7F32', glow: 'rgba(205,127,50,0.15)' },
}

function CertificatePreviewModal({ cert, displayDomain, onClose }: {
  cert: Certificate
  displayDomain: string
  onClose: () => void
}) {
  const issuedDate = formatDate(cert.createdAt)
  const typeLabel = cert.type === 'project_eval'
    ? 'ProjCert · Project Evaluation Certificate'
    : 'SkillCert · Verified Skill Certificate'
  const holderName = (cert as any).user?.username || (cert as any).name || 'Certificate Holder'

  // Per-level accent colours (gold palette stays consistent; hue shifts slightly per tier)
  const LEVEL_ACCENT: Record<string, { primary: string; dim: string; faint: string }> = {
    Advanced:     { primary: '#D4A017', dim: '#8a6010', faint: '#3a2808' },
    Intermediate: { primary: '#B0B8C8', dim: '#606878', faint: '#282C34' },
    Beginner:     { primary: '#C07830', dim: '#805020', faint: '#301808' },
  }
  const ac = LEVEL_ACCENT[cert.level] || LEVEL_ACCENT.Advanced

  const cornerSVG = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'>
      <path d='M2 2 L62 2 L62 10' stroke='${ac.primary}' stroke-width='1.2' fill='none'/>
      <path d='M2 2 L2 62 L10 62' stroke='${ac.primary}' stroke-width='1.2' fill='none'/>
      <path d='M10 10 L54 10 L54 18' stroke='${ac.dim}' stroke-width='0.6' fill='none'/>
      <path d='M10 10 L10 54 L18 54' stroke='${ac.dim}' stroke-width='0.6' fill='none'/>
      <circle cx='10' cy='10' r='2' fill='${ac.primary}'/>
      <rect x='18' y='18' width='6' height='6' fill='${ac.faint}' stroke='${ac.dim}' stroke-width='0.5'/>
    </svg>`

  const cornerB64 = btoa(cornerSVG)

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;600&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:1123px; height:794px;
  background:#080604;
  display:flex; align-items:center; justify-content:center;
  overflow:hidden;
  font-family:'EB Garamond', Georgia, serif;
}

.page {
  width:1060px; height:740px;
  background:
    radial-gradient(ellipse 70% 55% at 18% 25%, rgba(55,38,8,0.55) 0%, transparent 65%),
    radial-gradient(ellipse 55% 70% at 82% 75%, rgba(45,30,5,0.45) 0%, transparent 65%),
    radial-gradient(ellipse 90% 90% at 50% 50%, rgba(18,12,4,0.3) 0%, transparent 100%),
    linear-gradient(155deg, #100d07 0%, #0c0a05 45%, #0f0c07 100%);
  border:1.5px solid ${ac.primary}55;
  position:relative;
  overflow:hidden;
  box-shadow:
    0 0 0 6px #080604,
    0 0 0 7.5px ${ac.primary}40,
    0 0 80px rgba(180,130,20,0.12);
}

/* Second inner border */
.inner-frame {
  position:absolute; inset:12px;
  border:0.5px solid ${ac.dim}60;
  pointer-events:none;
}
.inner-frame-2 {
  position:absolute; inset:16px;
  border:0.5px solid ${ac.faint}cc;
  pointer-events:none;
}

/* Corners */
.corner {
  position:absolute; width:64px; height:64px;
  background-image:url('data:image/svg+xml;base64,${cornerB64}');
  background-size:contain; background-repeat:no-repeat;
}
.tl { top:0; left:0; }
.tr { top:0; right:0; transform:scaleX(-1); }
.bl { bottom:0; left:0; transform:scaleY(-1); }
.br { bottom:0; right:0; transform:scale(-1,-1); }

/* Side ornament lines */
.side-ornament {
  position:absolute;
  background:linear-gradient(90deg, transparent, ${ac.dim}50, transparent);
  height:0.5px;
}
.side-ornament.top    { top:32px; left:80px; right:80px; }
.side-ornament.bottom { bottom:32px; left:80px; right:80px; }

/* Watermark */
.watermark {
  position:absolute; inset:0;
  display:flex; align-items:center; justify-content:center;
  pointer-events:none;
  font-family:'Cinzel', serif;
  font-size:260px; font-weight:600;
  color:rgba(120,85,15,0.035);
  letter-spacing:-12px; line-height:1;
}

/* Content layout */
.content {
  position:absolute;
  inset:44px 60px 44px 60px;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap:0;
}

/* Top brand row */
.brand-row {
  display:flex; align-items:center; gap:14px;
  margin-bottom:10px;
}
.brand-line {
  width:90px; height:0.5px;
  background:linear-gradient(90deg, transparent, ${ac.primary}70);
}
.brand-line.r { background:linear-gradient(90deg, ${ac.primary}70, transparent); }
.brand-name {
  font-family:'Cinzel', serif; font-size:11px;
  letter-spacing:6px; color:${ac.primary};
  text-transform:uppercase;
}

/* Type label */
.type-label {
  font-family:'Cinzel', serif; font-size:8px;
  letter-spacing:4px; color:${ac.dim};
  text-transform:uppercase; margin-bottom:18px;
}

/* Divider with diamond */
.divider {
  display:flex; align-items:center; gap:10px;
  width:100%; max-width:520px; margin-bottom:14px;
}
.div-line {
  flex:1; height:0.5px;
  background:linear-gradient(90deg, transparent, ${ac.dim}80, transparent);
}
.div-diamond {
  width:5px; height:5px; flex-shrink:0;
  background:${ac.primary}; transform:rotate(45deg);
}
.div-dot {
  width:3px; height:3px; flex-shrink:0;
  background:${ac.dim}; border-radius:50%;
}

/* Text content */
.certifies-that {
  font-family:'EB Garamond', serif; font-style:italic;
  font-size:14px; color:${ac.dim};
  letter-spacing:2px; margin-bottom:6px;
}
.holder-name {
  font-family:'Playfair Display', serif;
  font-size:52px; font-weight:600;
  color:${ac.primary};
  letter-spacing:0.5px; line-height:1;
  margin-bottom:14px;
  text-shadow: 0 1px 20px rgba(180,130,20,0.18);
}
.has-demonstrated {
  font-family:'EB Garamond', serif; font-style:italic;
  font-size:13px; color:${ac.dim};
  letter-spacing:1.5px; margin-bottom:8px;
}
.level-badge {
  font-family:'Cinzel', serif; font-size:9.5px;
  letter-spacing:5px; color:${ac.primary};
  border:0.5px solid ${ac.dim}80;
  padding:5px 20px; margin-bottom:8px;
  text-transform:uppercase;
}
.proficiency-in {
  font-family:'EB Garamond', serif; font-style:italic;
  font-size:13px; color:${ac.dim};
  letter-spacing:1px; margin-bottom:10px;
}
.domain-text {
  font-family:'Playfair Display', serif;
  font-size:24px; font-weight:400; font-style:italic;
  color:${ac.primary}cc; letter-spacing:0.5px;
  margin-bottom:18px;
}

/* Meta row */
.meta-row {
  display:flex; gap:56px; align-items:flex-start;
  margin-bottom:20px;
}
.meta-item { text-align:center; }
.meta-lbl {
  font-family:'Cinzel', serif; font-size:7px;
  letter-spacing:3px; color:${ac.dim}; margin-bottom:5px;
  text-transform:uppercase;
}
.meta-val {
  font-family:'Playfair Display', serif;
  font-size:17px; font-weight:400; color:${ac.primary};
}
.meta-sep {
  width:36px; height:0.5px;
  background:${ac.faint}cc;
  margin:6px auto 0;
}

/* Bottom bar */
.bottom-bar {
  display:flex; align-items:flex-end;
  justify-content:space-between; width:100%;
  padding:0 4px;
}
.verify-block { text-align:left; }
.v-lbl {
  font-family:'Cinzel', serif; font-size:7px;
  letter-spacing:2.5px; color:${ac.faint}ff;
  text-transform:uppercase; margin-bottom:3px;
}
.v-id {
  font-family:'Courier New', monospace; font-size:9.5px;
  color:${ac.dim}; letter-spacing:0.5px;
}

/* Central emblem */
.emblem { width:58px; height:58px; flex-shrink:0; }

/* Signature block */
.sig-block { text-align:right; }
.sig-line {
  width:130px; height:0.5px;
  background:${ac.dim}60;
  margin:0 0 5px auto;
}
.sig-name {
  font-family:'Playfair Display', serif; font-style:italic;
  font-size:14px; color:${ac.dim};
}
.sig-title {
  font-family:'Cinzel', serif; font-size:7px;
  letter-spacing:2px; color:${ac.faint}ff;
  margin-top:3px; text-transform:uppercase;
}
</style>
</head>
<body>
<div class="page">
  <div class="inner-frame"></div>
  <div class="inner-frame-2"></div>
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>
  <div class="side-ornament top"></div>
  <div class="side-ornament bottom"></div>
  <div class="watermark">DC</div>

  <div class="content">
    <div class="brand-row">
      <div class="brand-line"></div>
      <div class="brand-name">DevCert</div>
      <div class="brand-line r"></div>
    </div>
    <div class="type-label">${typeLabel}</div>

    <div class="divider">
      <div class="div-line"></div>
      <div class="div-dot"></div>
      <div class="div-diamond"></div>
      <div class="div-dot"></div>
      <div class="div-line"></div>
    </div>

    <div class="certifies-that">This is to certify that</div>
    <div class="holder-name">${holderName}</div>
    <div class="has-demonstrated">has successfully demonstrated</div>
    <div class="level-badge">${cert.level} Proficiency</div>
    <div class="proficiency-in">in the discipline of</div>
    <div class="domain-text">${displayDomain}</div>

    <div class="divider" style="margin-bottom:16px;">
      <div class="div-line"></div>
      <div class="div-dot"></div>
      <div class="div-diamond"></div>
      <div class="div-dot"></div>
      <div class="div-line"></div>
    </div>

    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-lbl">Score Achieved</div>
        <div class="meta-val">${cert.score}/100</div>
        <div class="meta-sep"></div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">Level</div>
        <div class="meta-val">${cert.level}</div>
        <div class="meta-sep"></div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">Date Issued</div>
        <div class="meta-val">${issuedDate}</div>
        <div class="meta-sep"></div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="verify-block">
        <div class="v-lbl">Verify at</div>
        <div class="v-id">devcert.io/verify/${cert.verificationId}</div>
        <div class="v-lbl" style="margin-top:7px;">Certificate ID</div>
        <div class="v-id">${cert.verificationId}</div>
      </div>

      <svg class="emblem" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="29" cy="29" r="27" stroke="${ac.primary}" stroke-width="0.8" opacity="0.7"/>
        <circle cx="29" cy="29" r="22" stroke="${ac.dim}" stroke-width="0.5" opacity="0.6"/>
        <circle cx="29" cy="29" r="10" stroke="${ac.primary}" stroke-width="0.8" opacity="0.5"/>
        <path d="M29 4 L30.5 16 L41 8 L34 19 L46 21 L35 26 L40 37 L29 31 L18 37 L23 26 L12 21 L24 19 L17 8 L27.5 16 Z"
              fill="${ac.primary}" opacity="0.15"/>
        <path d="M29 9 L30 17.5 L38 12.5 L33 20 L42 22 L33.5 26 L37.5 34 L29 29.5 L20.5 34 L24.5 26 L16 22 L25 20 L20 12.5 L28 17.5 Z"
              stroke="${ac.primary}" stroke-width="0.4" fill="none" opacity="0.3"/>
        <text x="29" y="32" text-anchor="middle"
              font-family="Cinzel,serif" font-size="8" fill="${ac.primary}" font-weight="600" opacity="0.9">DC</text>
      </svg>

      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">Rajan Mehta</div>
        <div class="sig-title">Director of Certification</div>
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
                {cert.type === 'project_eval' ? 'ProjCert' : 'SkillCert'}
              </span>
              <ExternalLink size={12} className="text-[var(--color-muted)]" />
            </div>
          </div>
          <h3 className="font-semibold text-[var(--color-text)] capitalize mb-1">{displayDomain}</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>{cert.level}</span>
            <span className="text-sm font-bold" style={{ color }}>{cert.score}/100</span>
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