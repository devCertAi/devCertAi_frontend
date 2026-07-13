import { motion, AnimatePresence } from 'framer-motion'
import { Award, Download, Share2, Eye, EyeOff, ExternalLink, X, ZoomIn } from 'lucide-react'
import { Certificate } from '@/types'
import { formatDate, getLevelColor } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { useState } from 'react'



// Proeva logo, inlined as a base64 data URI so the printable certificate
// (rendered from a standalone HTML blob, opened in its own tab/window) always
// shows the brand mark regardless of the document's origin or relative paths.
const PROEVA_LOGO_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDYwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8IS0tIEJhY2tncm91bmQgR3JhZGllbnQgLS0+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImJnX2ciIGN4PSI1MCUiIGN5PSI1MCUiIHI9IjkwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxQTIwMjgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMEEwRDEyIi8+CiAgICA8L3JhZGlhbEdyYWRpZW50PgoKICAgIDwhLS0gRGlhbW9uZCBCYXNlIEdyYWRpZW50cyAtLT4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0idGVhbF9nIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwRjVENCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMEEzODkiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InZpb2xldF9nIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0E3OEJGQSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM2RDI4RDkiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAKICAgIDwhLS0gRGlhbW9uZCBEYXJrIEZhY2V0cyAoU2hhZG93KSAtLT4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0idGVhbF9kYXJrIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwODU3MyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMDREM0YiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InZpb2xldF9kYXJrIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzVBM0ZDQyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyRTFBNzMiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CgogICAgPCEtLSBHbGFzcyBIaWdobGlnaHQgR3JhZGllbnQgLS0+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdsYXNzX2ciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0ZGRkZGRiIgc3RvcC1vcGFjaXR5PSIwLjgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkZGRkZGIiBzdG9wLW9wYWNpdHk9IjAiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CgogICAgPCEtLSBQcm9mZXNzaW9uYWwgR2xvdyBiZWhpbmQgdGhlIGRpYW1vbmQgLS0+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9Imdsb3dfZyIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwRjVENCIgc3RvcC1vcGFjaXR5PSIwLjIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDBGNUQ0IiBzdG9wLW9wYWNpdHk9IjAiLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CgogICAgPCEtLSBTdWJ0bGUgQm9yZGVyIEdyYWRpZW50IC0tPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJib3JkZXJfZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMyQTMxM0MiIHN0b3Atb3BhY2l0eT0iMC44Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE0MUEyNCIgc3RvcC1vcGFjaXR5PSIwLjgiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgoKICA8IS0tIEJhY2tncm91bmQgQ2FyZCAtLT4KICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgcng9IjE0MCIgZmlsbD0idXJsKCNiZ19nKSIvPgogIDxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI1OTYiIGhlaWdodD0iNTk2IiByeD0iMTM4IiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjYm9yZGVyX2cpIiBzdHJva2Utd2lkdGg9IjIiLz4KCiAgPCEtLSBBbWJpZW50IEdsb3cgYmVoaW5kIHRoZSBkaWFtb25kIC0tPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9IjI4OCIgcj0iMTgwIiBmaWxsPSJ1cmwoI2dsb3dfZykiIC8+CgogIDwhLS0gRGlhbW9uZCBMb2dvIEdyb3VwIChDZW50ZXJlZCkgLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDQsIDMyKSI+CiAgICAKICAgIDwhLS0gTGVmdCBMYXJnZSBGYWNldCAtLT4KICAgIDxwb2x5Z29uIHBvaW50cz0iMjU2LDExMiAxNTYsMjU2IDI1Niw0MDAiIGZpbGw9InVybCgjdGVhbF9nKSIvPgogICAgCiAgICA8IS0tIFJpZ2h0IExhcmdlIEZhY2V0IC0tPgogICAgPHBvbHlnb24gcG9pbnRzPSIyNTYsMTEyIDM1NiwyNTYgMjU2LDQwMCIgZmlsbD0idXJsKCN2aW9sZXRfZykiLz4KICAgIAogICAgPCEtLSBCb3R0b20gTGVmdCBEYXJrIEZhY2V0IC0tPgogICAgPHBvbHlnb24gcG9pbnRzPSIxNTYsMjU2IDI1Niw0MDAgMjU2LDMwMCIgZmlsbD0idXJsKCN0ZWFsX2RhcmspIiBvcGFjaXR5PSIwLjg1Ii8+CiAgICAKICAgIDwhLS0gQm90dG9tIFJpZ2h0IERhcmsgRmFjZXQgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IjM1NiwyNTYgMjU2LDQwMCAyNTYsMzAwIiBmaWxsPSJ1cmwoI3Zpb2xldF9kYXJrKSIgb3BhY2l0eT0iMC44NSIvPgogICAgCiAgICA8IS0tIFRvcCBMZWZ0IFNtYWxsIEhpZ2hsaWdodCAtLT4KICAgIDxwb2x5Z29uIHBvaW50cz0iMjU2LDExMiAyMTAsMTgyIDI1NiwyMjQiIGZpbGw9IiMwMEY1RDQiIG9wYWNpdHk9IjAuOSIvPgogICAgCiAgICA8IS0tIFRvcCBSaWdodCBTbWFsbCBIaWdobGlnaHQgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IjI1NiwxMTIgMzAyLDE4MiAyNTYsMjI0IiBmaWxsPSIjQzRCNUZEIiBvcGFjaXR5PSIwLjkiLz4KCiAgICA8IS0tIEdsYXNzIFJlZmxlY3Rpb24gRWZmZWN0IChPcHRpb25hbCwgYWRkcyBhIDNEIGdlbSBsb29rKSAtLT4KICAgIDxwb2x5Z29uIHBvaW50cz0iMjU2LDExMiAyMDAsMTYwIDI1NiwyNDAiIGZpbGw9InVybCgjZ2xhc3NfZykiIG9wYWNpdHk9IjAuMTUiIC8+CiAgICAKICAgIDwhLS0gSW5uZXIgRGlhbW9uZCBFZGdlIEhpZ2hsaWdodHMgZm9yIFN0cnVjdHVyZSAtLT4KICAgIDxwYXRoIGQ9Ik0yNTYsMTEyIEwyNTYsNDAwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMS41IiAvPgogICAgPHBhdGggZD0iTTE1NiwyNTYgTDM1NiwyNTYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxLjUiIC8+CiAgICA8cGF0aCBkPSJNMjU2LDExMiBMMjEwLDE4MiBMMjU2LDIyNCBMMzAyLDE4MiBaIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS1vcGFjaXR5PSIwLjIiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgLz4KCiAgPC9nPgo8L3N2Zz4='

interface CertificateCardProps { cert: Certificate; onUpdate?: () => void }

// Shared certificate design tokens — per-level metal palette. Keep this in
// sync with backend/src/services/certificateService.js LEVEL_METAL.
// Level controls the SEAL COLOR (gold/silver/bronze = Advanced/Intermediate/Beginner).
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

// Per-type certificate theme — controls ACCENT COLOR, ICON, SUBTITLE, and
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
  iconPaths: string
}

const TYPE_THEME: Record<string, CertTheme> = {
  skill_cert: {
    label: 'SkillCert',
    typeLabel: 'SkillCert — Verified Skill Certificate',
    accent: '#1d4ed8',
    accentSoft: 'rgba(29,78,216,0.12)',
    subtitle: 'Of Proficiency',
    watermark: 'SKILL ASSESSMENT',
    iconPaths: '<path d="M12 3.2l6.2 2.3v5.1c0 4.6-2.7 8-6.2 9.2-3.5-1.2-6.2-4.6-6.2-9.2V5.5L12 3.2z"/><path d="M8.7 12.4l2.3 2.3 4.3-4.6"/>',
  },
  project_eval: {
    label: 'ProjCert',
    typeLabel: 'ProjCert — Project Evaluation Certificate',
    accent: '#b45309',
    accentSoft: 'rgba(180,83,9,0.12)',
    subtitle: 'Of Project Excellence',
    watermark: 'PROJECT EVALUATION',
    iconPaths: '<path d="M12 4.2v3.4"/><circle cx="12" cy="4.2" r="1.3" fill="#ffffff"/><path d="M12 7.6L7.6 19M12 7.6L16.4 19"/><path d="M9.2 15.2h5.6"/>',
  },
  combo_cert: {
    label: 'ComboCert',
    typeLabel: 'ComboCert — Phase 1 + Phase 2 Combined Certificate',
    accent: '#0f766e',
    accentSoft: 'rgba(15,118,110,0.12)',
    subtitle: 'Of Comprehensive Achievement',
    watermark: 'COMBINED CERTIFICATION',
    iconPaths: '<path d="M8.2 4.6l1.1 2.3 2.5.9-2.5.9-1.1 2.3-1.1-2.3-2.5-.9 2.5-.9 1.1-2.3z"/><path d="M15.8 10.2l1.1 2.3 2.5.9-2.5.9-1.1 2.3-1.1-2.3-2.5-.9 2.5-.9 1.1-2.3z"/>',
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

/* Metallic badge overlapping the ribbon — colour follows LEVEL,
   icon inside follows TYPE */
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
  z-index: 1;
}

.brand-name {
  position: absolute;
  top: 60px;
  right: 80px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Cinzel', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #0f172a;
  z-index: 2;
}

.brand-name img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: block;
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
  margin-bottom: 26px;
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
  color: ${theme.accent};
  margin-bottom: 30px;
}

.bottom-meta {
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  justify-content: space-between;
  align-items: flex-end;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
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

.authority-line {
  margin-top: 10px;
  font-family: 'EB Garamond', serif;
  font-style: italic;
  font-size: 11px;
  color: #94a3b8;
}
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="watermark">${theme.watermark}</div>
  <div class="vertical-ribbon"></div>
  <div class="gold-seal">
     <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.25">
       ${theme.iconPaths}
     </svg>
  </div>

  <div class="content">
    <div class="brand-name"><img src="${PROEVA_LOGO_DATA_URI}" alt="Proeva" /><span>Proeva</span></div>

    <div class="main-title">Certificate</div>
    <div class="sub-title-box">${theme.subtitle}</div>
    <div class="type-badge"><span class="dot"></span>${theme.typeLabel}</div>

    <div class="certifies-that">This certificate is proudly presented to</div>
    <div class="holder-name">${holderName}</div>

    <div class="details-text">
      ${description}
    </div>
    ${extraLine ? `<div class="extra-line">${extraLine}</div>` : '<div style="margin-bottom:30px"></div>'}

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
    <div class="authority-line">Issued by Proeva Assessment Authority &middot; Verifiable at proeva.io/verify</div>
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
  const theme = getTypeTheme(cert.type)

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
      a.download = `proeva-${cert.verificationId}.pdf`
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