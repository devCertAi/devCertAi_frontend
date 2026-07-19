import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Download, Share2, Eye, EyeOff, ExternalLink, X, ZoomIn, Loader2 } from 'lucide-react'
import { Certificate } from '@/types'
import { formatDate, getLevelColor } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { useState } from 'react'



// Proeva logo, inlined as a base64 data URI so the printable certificate
// (rendered from a standalone HTML blob, opened in its own tab/window) always
// shows the brand mark regardless of the document's origin or relative paths.
const PROEVA_LOGO_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDYwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8IS0tIEJhY2tncm91bmQgR3JhZGllbnQgLS0+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImJnX2ciIGN4PSI1MCUiIGN5PSI1MCUiIHI9IjkwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxQTIwMjgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMEEwRDEyIi8+CiAgICA8L3JhZGlhbEdyYWRpZW50PgoKICAgIDwhLS0gRGlhbW9uZCBCYXNlIEdyYWRpZW50cyAtLT4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0idGVhbF9nIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwRjVENCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMEEzODkiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InZpb2xldF9nIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0E3OEJGQSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM2RDI4RDkiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAKICAgIDwhLS0gRGlhbW9uZCBEYXJrIEZhY2V0cyAoU2hhZG93KSAtLT4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0idGVhbF9kYXJrIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwODU3MyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMEQ0M0YiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InZpb2xldF9kYXJrIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzVBM0ZDQyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyRTFBNzMiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CgogICAgPCEtLSBHbGFzcyBIaWdobGlnaHQgR3JhZGllbnQgLS0+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9Imdsc19nIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkZGRkYiIHN0b3Atb3BhY2l0eT0iMC44Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0ZGRkZGRiIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgoKICAgIDwhLS0gUHJvZmVzc2lvbmFsIEdsb3cgYmVoaW5kIHRoZSBkaWFtb25kIC0tPgogICAgPHJhZGlhbEdyYWRpZW50IGlkPSJnbG93X2ciIGN4PSI1MCUiIGN5PSI1MCUiIHI9IjUwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwMEY1RDQiIHN0b3Atb3BhY2l0eT0iMC4yIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzAwRjVENCIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICA8L3JhZGlhbEdyYWRpZW50PgoKICAgIDwhLS0gU3VidGxlIEJvcmRlciBHcmFkaWVudCAtLT4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYm9yZGVyX2ciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMkEzMTNDIiBzdG9wLW9wYWNpdHk9IjAuOCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxNDFBMjQiIHN0b3Atb3BhY2l0eT0iMC44Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KCiAgPCEtLSBCYWNrZ3JvdW5kIENhcmQgLS0+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjYwMCIgaGVpZ2h0PSI2MDAiIHJ4PSIxNDAiIGZpbGw9InVybCgjYmdfZykiLz4KICA8cmVjdCB4PSIyIiB5PSIyIiB3aWR0aD0iNTk2IiBoZWlnaHQ9IjU5NiIgcng9IjEzOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ1cmwoI2JvcmRlcl9nKSIgc3Ryb2tlLXdpZHRoPSIyIi8+CgogIDwhLS0gQW1iaWVudCBHbG93IGJlaGluZCB0aGUgZGlhbW9uZCAtLT4KICA8Y2lyY2xlIGN4PSIzMDAiIGN5PSIyODgiIHI9IjE4MCIgZmlsbD0idXJsKCNnbG93X2cpIiAvPgoKICA8IS0tIERpYW1vbmQgTG9nbyBHcm91cCAoQ2VudGVyZWQpIC0tPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ0LCAzMikiPgogICAgCiAgICA8IS0tIExlZnQgTGFyZ2UgRmFjZXQgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IjI1NiwxMTIgMTU2LDI1NiAyNTYsNDAwIiBmaWxsPSJ1cmwoI3RlYWxfZykiLz4KICAgIAogICAgPCEtLSBSaWdodCBMYXJnZSBGYWNldCAtLT4KICAgIDxwb2x5Z29uIHBvaW50cz0iMjU2LDExMiAzNTYsMjU2IDI1Niw0MDAiIGZpbGw9InVybCgjdmlvbGV0X2cpIi8+CiAgICAKICAgIDwhLS0gQm90dG9tIExlZnQgRGFyayBGYWNldCAtLT4KICAgIDxwb2x5Z29uIHBvaW50cz0iMTU2LDI1NiAyNTYsNDAwIDI1NiwzMDAiIGZpbGw9InVybCgjdGVhbF9kYXJrKSIgb3BhY2l0eT0iMC44NSIvPgogICAgCiAgICA8IS0tIEJvdHRvbSBSaWdodCBEYXJrIEZhY2V0IC0tPgogICAgPHBvbHlnb24gcG9pbnRzPSIzNTYsMjU2IDI1Niw0MDAgMjU2LDMwMCIgZmlsbD0idXJsKCN2aW9sZXRfZGFyaykiIG9wYWNpdHk9IjAuODUiLz4KICAgIAogICAgPCEtLSBUb3AgTGVmdCBTbWFsbCBIaWdobGlnaHQgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IjI1NiwxMTIgMjEwLDE4MiAyNTYsMjI0IiBmaWxsPSIjMDBGNUQ0IiBvcGFjaXR5PSIwLjkiLz4KICAgIAogICAgPCEtLSBUb3AgUmlnaHQgU21hbGwgSGlnaGxpZ2h0IC0tPgogICAgPHBvbHlnb24gcG9pbnRzPSIyNTYsMTEyIDMwMiwxODIgMjU2LDIyNCIgZmlsbD0iI0M0QjVGRCIgb3BhY2l0eT0iMC45Ii8+CgogICAgPCEtLSBHbGFzcyBSZWZsZWN0aW9uIEVmZmVjdCAoT3B0aW9uYWwsIGFkZHMgYSAzRCBnZW0gbG9vaykgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IjI1NiwxMTIgMjAwLDE2MCAyNTYsMjQwIiBmaWxsPSJ1cmwoI2dsc19nKSIgb3BhY2l0eT0iMC4xNSIgLz4KICAgIAogICAgPCEtLSBJbm5lciBEaWFtb25kIEVkZ2UgSGlnaGxpZ2h0cyBmb3IgU3RydWN0dXJlIC0tPgogICAgPHBhdGggZD0iTTI1NiwxMTIgTDI1Niw0MDAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxLjUiIC8+CiAgICA8cGF0aCBkPSJNMTU2LDI1NiBMMzU2LDI1NiIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utb3BhY2l0eT0iMC4xIiBzdHJva2Utd2lkdGg9IjEuNSIgLz4KICAgIDxwYXRoIGQ9Ik0yNTYsMTEyIEwyMTAsMTgyIEwyNTYsMjI0IEwzMDIsMTgyIFoiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLW9wYWNpdHk9IjAuMiIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiAvPgoKICA8L2c+Cjwvc3ZnPg=='

interface CertificateCardProps { cert: Certificate; onUpdate?: () => void }

// Shared certificate design tokens — per-level metal palette. Keep this in
// sync with backend/src/services/certificateService.js LEVEL_METAL.
// Level controls the SEAL RING COLOR (gold/silver/bronze = Advanced/Intermediate/Beginner).
const LEVEL_METAL: Record<string, { sealFrom: string; sealMid: string; sealTo: string }> = {
  Advanced:     { sealFrom: '#fcd34d', sealMid: '#d97706', sealTo: '#92400e' },
  Intermediate: { sealFrom: '#e2e8f0', sealMid: '#64748b', sealTo: '#334155' },
  Beginner:     { sealFrom: '#f0b27a', sealMid: '#b87333', sealTo: '#7a4b1f' },
}

// Small alias so the compact dashboard card (which only needs a single
// accent colour for the level badge/icon) doesn't have to reach into LEVEL_METAL.
const LEVEL_COLORS: Record<string, { primary: string; glow: string }> = {
  Advanced:     { primary: '#D4A017', glow: 'rgba(212,160,23,0.28)' },
  Intermediate: { primary: '#5B6B8C', glow: 'rgba(91,107,140,0.24)' },
  Beginner:     { primary: '#B0703A', glow: 'rgba(176,112,58,0.24)' },
}

// Per-type certificate theme — controls ACCENT COLOR, SUBTITLE, and
// WATERMARK so a SkillCert and a ProjCert are unmistakable at a glance, even
// before reading a word. Keep this in sync with
// backend/src/services/certificateService.js TYPE_THEME.
type CertTheme = {
  label: string
  typeLabel: string
  accent: string
  accentSoft: string
  subtitle: string
  watermark: string
}

const TYPE_THEME: Record<string, CertTheme> = {
  skill_cert: {
    label: 'SkillCert',
    typeLabel: 'SkillCert — Verified Skill Certificate',
    accent: '#1d4ed8',
    accentSoft: 'rgba(29,78,216,0.12)',
    subtitle: 'Of Proficiency',
    watermark: 'SKILL ASSESSMENT',
  },
  project_eval: {
    label: 'ProjCert',
    typeLabel: 'ProjCert — Project Evaluation Certificate',
    accent: '#b45309',
    accentSoft: 'rgba(180,83,9,0.12)',
    subtitle: 'Of Project Excellence',
    watermark: 'PROJECT EVALUATION',
  },
  combo_cert: {
    label: 'ComboCert',
    typeLabel: 'ComboCert — Phase 1 + Phase 2 Combined Certificate',
    accent: '#0f766e',
    accentSoft: 'rgba(15,118,110,0.12)',
    subtitle: 'Of Comprehensive Achievement',
    watermark: 'COMBINED CERTIFICATION',
  },
}

function getTypeTheme(type: string): CertTheme {
  return TYPE_THEME[type] || TYPE_THEME.skill_cert
}

// Per-type certificate description — keep this in sync with
// backend/src/services/certificateService.js getCertDescription so the
// on-screen preview always matches the downloaded PDF.
function getCertDescription(type: string, level: string, domain: string) {
  if (type === 'project_eval') {
    return `has successfully designed, built, and delivered a real-world project in
      <strong>${domain}</strong>, demonstrating <strong>${level}</strong>-level proficiency in
      practical implementation, problem-solving, and engineering best practices.`
  }
  if (type === 'combo_cert') {
    return `has successfully completed both a comprehensive skill assessment and a hands-on
      project evaluation in <strong>${domain}</strong>, demonstrating <strong>${level}</strong>-level
      proficiency across theoretical knowledge and real-world application.`
  }
  return `has successfully completed a rigorous skill assessment, demonstrating
    <strong>${level}</strong>-level proficiency in <strong>${domain}</strong> with strong
    conceptual understanding and practical command of core principles.`
}

// Verification base URL — the printed/shared certificate always points here
// so it's verifiable even outside the app. Keep in sync with backend
// certificateService.js VERIFY_BASE_URL.
const VERIFY_BASE_URL = 'https://proeva.dev/certificate'

// Four corner flourishes for the ornate frame — one path, reused with a CSS
// transform (mirrored/flipped) for the other three corners so they stay
// perfectly symmetric.
function cornerFlourishSVG(accent: string) {
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M6 60 L6 20 Q6 6 20 6 L60 6" stroke="${accent}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M6 34 Q22 34 22 18" stroke="${accent}" stroke-width="1.3" opacity="0.55" stroke-linecap="round"/>
    <path d="M34 6 Q34 22 18 22" stroke="${accent}" stroke-width="1.3" opacity="0.55" stroke-linecap="round"/>
    <circle cx="6" cy="6" r="4" fill="${accent}"/>
    <circle cx="6" cy="46" r="2" fill="${accent}" opacity="0.6"/>
    <circle cx="46" cy="6" r="2" fill="${accent}" opacity="0.6"/>
  </svg>`
}

function CertificatePreviewModal({ cert, displayDomain, onClose }: {
  cert: Certificate
  displayDomain: string
  onClose: () => void
}) {
  const issuedDate = formatDate(cert.createdAt)
  const theme = getTypeTheme(cert.type)
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
  const verifyUrl = `${VERIFY_BASE_URL}/${cert.verificationId || ''}`
  const flourish = cornerFlourishSVG(theme.accent)

  const extraLine = comboMeta
    ? `Phase 1: ${comboMeta.phase1Score ?? '-'}/100 &middot; Phase 2: ${comboMeta.phase2Score ?? '-'}/100`
    : projectTitle
      ? `Project: ${projectTitle}`
      : ''

  const description = getCertDescription(cert.type, cert.level, displayDomain)

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
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

/* Top accent stripe — colour identifies the certificate TYPE at a glance */
.accent-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6px;
  background: ${theme.accent};
  z-index: 3;
}

/* Faint diagonal watermark naming the certificate type */
.watermark {
  position: absolute;
  top: 46%;
  left: -8%;
  width: 140%;
  text-align: center;
  transform: rotate(-9deg);
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 90px;
  letter-spacing: 10px;
  color: ${theme.accent};
  opacity: 0.05;
  z-index: 0;
  pointer-events: none;
  white-space: nowrap;
}

/* Ornate double-line frame + four corner flourishes, all in the
   certificate's accent colour so the border reads as one design with
   the seal and top stripe. */
.ornate-frame {
  position: absolute;
  inset: 22px;
  border: 2px solid ${theme.accent};
  opacity: 0.55;
  z-index: 2;
  pointer-events: none;
}
.ornate-frame::after {
  content: '';
  position: absolute;
  inset: 7px;
  border: 1px solid #0f172a;
  opacity: 0.18;
}
.corner-flourish {
  position: absolute;
  width: 90px;
  height: 90px;
  z-index: 3;
  pointer-events: none;
}
.corner-flourish.tl { top: 20px; left: 20px; }
.corner-flourish.tr { top: 20px; right: 20px; transform: scaleX(-1); }
.corner-flourish.bl { bottom: 20px; left: 20px; transform: scaleY(-1); }
.corner-flourish.br { bottom: 20px; right: 20px; transform: scale(-1,-1); }

.content {
  position:absolute;
  inset: 0;
  padding: 56px 110px;
  display:flex;
  flex-direction:column;
  justify-content: center;
  align-items: center;
  text-align: center;
  z-index: 1;
}

/* Logo lockup: gem mark + wordmark, centered at top */
.brand-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 14px;
}

.brand-name img {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: block;
}

.brand-name span {
  font-family: 'Cinzel', serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #0f172a;
}

.brand-name span span { color: #d97706; }

/* Seal / badge medallion — the ring colour follows the LEVEL (metal),
   the mark inside is always the Proeva gem logo, so every certificate
   carries the actual brand mark on its badge, not a generic icon. */
.seal-medallion {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: radial-gradient(circle, ${metal.sealFrom} 0%, ${metal.sealMid} 70%, ${metal.sealTo} 100%);
  border: 4px solid #0f172a;
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  position: relative;
}
.seal-medallion::after {
  content: '';
  position: absolute;
  width: 74px;
  height: 74px;
  border: 1.5px dashed rgba(255,255,255,0.6);
  border-radius: 50%;
}
.seal-logo {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.main-title {
  font-family: 'UnifrakturMaguntia', 'Playfair Display', serif;
  font-size: 62px;
  font-weight: 400;
  color: #0f172a;
  line-height: 1.1;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.sub-title-box {
  background-color: #0f172a;
  color: #ffffff;
  font-family: 'Cinzel', sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 5px;
  padding: 5px 22px 4px 26px;
  text-transform: uppercase;
  margin-bottom: 14px;
  display: inline-block;
}

/* Type badge — coloured pill so SkillCert / ProjCert / ComboCert
   are distinguishable without reading the fine print */
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 16px;
  border-radius: 3px;
  font-family: 'Cinzel', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${theme.accent};
  background: ${theme.accentSoft};
  border: 1px solid ${theme.accent};
  margin-bottom: 24px;
}

.type-badge .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: ${theme.accent};
  display: inline-block;
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
  border-bottom: 2px solid ${theme.accent};
  padding-bottom: 6px;
  margin-bottom: 22px;
  display: inline-block;
  max-width: 600px;
}

.details-text {
  font-family: 'EB Garamond', serif;
  font-size: 19px;
  line-height: 1.6;
  color: #475569;
  margin: 0 auto 8px;
  max-width: 620px;
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
  color: ${theme.accent};
  margin-bottom: 26px;
}

.bottom-meta {
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  justify-content: center;
  align-items: flex-start;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
  margin-top: 10px;
}

.meta-block { display: flex; flex-direction: column; align-items: center; gap: 4px; }

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

.authority-line {
  margin-top: 12px;
  font-family: 'EB Garamond', serif;
  font-style: italic;
  font-size: 12px;
  color: #94a3b8;
}

.authority-line a {
  color: ${theme.accent};
  text-decoration: none;
  font-style: normal;
  font-weight: 600;
}
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="watermark">${theme.watermark}</div>
  <div class="ornate-frame"></div>
  <div class="corner-flourish tl">${flourish}</div>
  <div class="corner-flourish tr">${flourish}</div>
  <div class="corner-flourish bl">${flourish}</div>
  <div class="corner-flourish br">${flourish}</div>

  <div class="content">
    <div class="brand-name"><img src="${PROEVA_LOGO_DATA_URI}" alt="Proeva" /><span><span>Proeva</span></span></div>

    <div class="seal-medallion">
      <img class="seal-logo" src="${PROEVA_LOGO_DATA_URI}" alt="Proeva seal" />
    </div>

    <div class="main-title">Certificate</div>
    <div class="sub-title-box">${theme.subtitle}</div>
    <div class="type-badge"><span class="dot"></span>${theme.typeLabel}</div>

    <div class="certifies-that">This certificate is proudly presented to</div>
    <div class="holder-name">${holderName}</div>

    <div class="details-text">
      ${description}
    </div>
    ${extraLine ? `<div class="extra-line">${extraLine}</div>` : '<div style="margin-bottom:26px"></div>'}

    <div class="bottom-meta">
      <div class="meta-block">
        <span class="meta-lbl">Date Issued</span>
        <span class="meta-val">${issuedDate}</span>
      </div>
      <div class="meta-block">
        <span class="meta-lbl">Score Achieved</span>
        <span class="meta-val">${cert.score} / 100</span>
      </div>
      ${difficultyLabel ? `
      <div class="meta-block">
        <span class="meta-lbl">Difficulty</span>
        <span class="meta-val">${difficultyLabel}</span>
      </div>` : ''}
      <div class="meta-block">
        <span class="meta-lbl">Certificate Number</span>
        <span class="v-id">${cert.verificationId || '0000'}</span>
      </div>
    </div>
    <div class="authority-line">Issued by Proeva Assessment Authority &middot; Verify at <a href="${verifyUrl}">${verifyUrl}</a></div>
  </div>
</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const src = URL.createObjectURL(blob)

  // FIX (black-screen bug): this modal used to be returned directly from
  // this component's render tree. Every page is wrapped in <PageWrapper>,
  // which is a framer-motion `motion.div` that animates `y` via an inline
  // CSS `transform`. Any ancestor with a `transform` other than `none`
  // becomes the containing block for `position: fixed` descendants — so
  // this modal's "fixed inset-0" backdrop was being sized/positioned
  // relative to PageWrapper's box instead of the real viewport, which is
  // exactly why it rendered as a small black rectangle pinned to the
  // top-left instead of a full-screen dark backdrop with the certificate
  // centered on top. Portaling straight to document.body escapes that
  // transformed ancestor entirely, so `fixed` behaves correctly again.
  return createPortal(
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
    </AnimatePresence>,
    document.body
  )
}

export default function CertificateCard({ cert, onUpdate }: CertificateCardProps) {
  // Hooks must run unconditionally, so use a safe default if cert is missing
  const [isPublic, setIsPublic] = useState(cert?.isPublic ?? false)
  const [showPreview, setShowPreview] = useState(false)
  // Tracks the in-flight PDF download so the Download button can show a
  // spinner and disable itself for the duration of the request.
  const [isDownloading, setIsDownloading] = useState(false)

  // Guard against an undefined/null cert (e.g. data still loading, or a
  // bad entry in the certificates array) so the whole tree doesn't crash
  if (!cert) return null

  const displayDomain =
    (cert as any).evaluationReport?.domainReport?.detectedDomain ||
    (cert as any).domainReport?.detectedDomain ||
    cert.domain

  const color = getLevelColor(cert.level)
  const theme = getTypeTheme(cert.type)

  const handleOpenNewTab = () => {
    window.open(`/certificate/${cert.verificationId}`, '_blank')
  }

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const response = await api.get(`/certificates/${cert.id}/download`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `proeva-${cert.verificationId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    } finally {
      setIsDownloading(false)
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
        {/* Top accent stripe on the dashboard card too — same accent colour as the
            certificate itself, so the card and the document read as one identity */}
        <div style={{ height: 4, background: theme.accent }} />

        <div className="p-5 relative" style={{ background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)` }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
              <Award size={20} style={{ color }} />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono font-semibold px-2 py-1 rounded-lg"
                style={{ color: theme.accent, backgroundColor: theme.accentSoft, border: `1px solid ${theme.accent}40` }}
              >
                {theme.label}
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
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Downloading…
              </>
            ) : (
              <>
                <Download size={13} /> Download
              </>
            )}
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