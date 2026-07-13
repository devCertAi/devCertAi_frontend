/**
 * App.tsx — Updated routing
 *
 * Key changes:
 * 1. Recruiter/admin users → on login always land on /recruiter/dashboard
 * 2. /dashboard route guards: recruiters redirected to /recruiter/dashboard
 * 3. /apply/:slug is treated as auth route (no navbar/sidebar) but still public
 * 4. Added /hiring route for standalone hiring landing (Req 5)
 */

import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useSocket } from '@/hooks/useSocket'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import VerifyEmail from '@/pages/auth/VerifyEmail'

// Pages
import Home from '@/pages/Home'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Dashboard from '@/pages/dashboard/Dashboard'
import ProjectList from '@/pages/projects/ProjectList'
import ProjectDetail from '@/pages/projects/ProjectDetail'
import Submit from '@/pages/projects/Submit'
import ExamSelect from '@/pages/exam/ExamSelect'
import ExamRoom from '@/pages/exam/ExamRoom'
import ExamResult from '@/pages/exam/ExamResult'
import Certificates from '@/pages/certificates/Certificates'
import Verify from '@/pages/certificates/Verify'
import Profile from '@/pages/profile/Profile'
import Pricing from '@/pages/pricing/Pricing'
import Settings from '@/pages/settings/Settings'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminQuestions from '@/pages/admin/AdminQuestions'
import AdminQueues from '@/pages/admin/AdminQueues'
import AdminCompanyVerification from '@/pages/admin/AdminCompanyVerification'
import NotFound from '@/pages/auth/NotFound'
import ApplyPage from '@/pages/apply/ApplyPage'
import RecruiterPostings from '@/pages/recruiter/Postings'
import CreatePosting from '@/pages/recruiter/CreatePosting'
import PostingDetail from '@/pages/recruiter/PostingDetail'
import CompanyVerification from '@/pages/recruiter/CompanyVerification'
import RecruiterDashboard from '@/pages/recruiter/RecruiterDashboard'
import HiringLanding from '@/pages/hiring/HiringLanding'
import RankedList from '@/pages/recruiter/RankedList'
 import RecruiterRegisterOTP from '@/pages/auth/RecruiterRegisterOTP'
import RecruiterLogin from '@/pages/auth/RecruiterLogin'
import RecruiterProfile from '@/pages/recruiter/RecruiterProfile'
import ApplicationDetail from '@/pages/applications/ApplicationDetail'
import ExamGate from '@/pages/applications/ExamGate'
import About from './pages/footer/About'
import PrivacyPolicy from './pages/footer/PrivacyPolicy'
import TermsOfService from './pages/footer/TermsOfService'
import CookiePolicy from './pages/footer/CookiePolicy'
import Contact from './pages/footer/Contact'



// Routes that hide the nav/sidebar (full-screen experiences)
const AUTH_ROUTES = ['/auth/', '/verify/', '/certificate/', '/apply/']
const HIRING_ROUTES = ['/hiring', '/recruiting']
 
const IDENTITY_ENTRY_ROUTES = ['/auth/login', '/auth/register', '/auth/recruiter-login', '/auth/register-recruiter']

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isAuthRoute = AUTH_ROUTES.some((r) => location.pathname.startsWith(r))
  const isHiringRoute = HIRING_ROUTES.some((r) => location.pathname.startsWith(r))
  const isExamRoom = location.pathname.includes('/exam/room')
  const isVerifyPage = location.pathname.startsWith('/verify/')
  const { isAuthenticated, isInitializing, user } = useAuthStore()

  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin'

   const profileMatch = location.pathname.match(/^\/profile\/([^/]+)/)
  const isOtherProfile = profileMatch ? profileMatch[1] !== user?.username : false

  const showSidebar =
    !isInitializing &&
    isAuthenticated &&
    !isAuthRoute &&
    !isExamRoom &&
    !isVerifyPage &&
    !isOtherProfile &&
    !isHiringRoute

  // Recruiter users get the recruiter sidebar — handled inside Sidebar component
  if (isAuthRoute || isExamRoom) return <>{children}</>

  return (
    <>
      <Navbar />
      {showSidebar && <Sidebar />}
      <main className={`pt-16 ${showSidebar ? 'lg:pl-56' : ''}`}>
        {children}
      </main>
    </>
  )
}

/** Guard: recruiter/admin users cannot access student /dashboard */
function StudentRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing, user } = useAuthStore()
  const location = useLocation()

  if (isInitializing) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }
  if (user?.role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return <>{children}</>
}

export default function App() {
  const { fetchMe, user } = useAuthStore()
  const { fetchAll } = useNotificationStore()

  useSocket(user?.id)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const onIdentityEntryRoute = IDENTITY_ENTRY_ROUTES.some((r) => window.location.pathname.startsWith(r))
 
    if (!token || onIdentityEntryRoute) {
      useAuthStore.setState({ isInitializing: false })
      return
    }
    fetchMe()
      .then(() => {
         const role = useAuthStore.getState().user?.role
        if (role === 'user') fetchAll()
      })
      .catch(() => {})
  }, [])

  return (
    <ErrorBoundary>
      <AppLayout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify/:verificationId" element={<Verify />} />
          <Route path="/certificate/:verificationId" element={<Verify />} />
          <Route path="/auth/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Hiring landing — public, no sidebar, shown when "Hire" button clicked */}

          <Route path="/recruiting" element={<HiringLanding />} />
           <Route path="/auth/register-recruiter" element={<RecruiterRegisterOTP />} />
           <Route path="/auth/recruiter-login"    element={<RecruiterLogin />} />
 
          {/* Apply — public page but shows register/login gate if not authed */}
          <Route path="/apply/:slug" element={<ApplyPage />} />

          {/* Student-only protected routes — recruiters redirected to their dashboard */}
          <Route path="/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
          <Route path="/projects" element={<StudentRoute><ProjectList /></StudentRoute>} />
          <Route path="/projects/:id" element={<StudentRoute><ProjectDetail /></StudentRoute>} />
          <Route path="/submit" element={<StudentRoute><Submit /></StudentRoute>} />
          <Route path="/exam" element={<StudentRoute><ExamSelect /></StudentRoute>} />
          <Route path="/exam/room/:id" element={<StudentRoute><ExamRoom /></StudentRoute>} />
          <Route path="/exam/result/:id" element={<StudentRoute><ExamResult /></StudentRoute>} />
          <Route path="/applications/:id" element={<StudentRoute><ApplicationDetail /></StudentRoute>} />
          <Route path="/applications/:id/exam" element={<StudentRoute><ExamGate /></StudentRoute>} />
          <Route path="/certificates" element={<StudentRoute><Certificates /></StudentRoute>} />
          <Route path="/recruiter/settings" element={<ProtectedRoute recruiterOnly><Settings /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Recruiter — recruiter/admin only */}
          <Route path="/recruiter/profile" element={<ProtectedRoute recruiterOnly><RecruiterProfile /></ProtectedRoute>} />
          <Route path="/recruiter/dashboard" element={<ProtectedRoute recruiterOnly><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/recruiter/postings" element={<ProtectedRoute recruiterOnly><RecruiterPostings /></ProtectedRoute>} />
          <Route path="/recruiter/postings/new" element={<ProtectedRoute recruiterOnly><CreatePosting /></ProtectedRoute>} />
          <Route path="/recruiter/postings/:id" element={<ProtectedRoute recruiterOnly><PostingDetail /></ProtectedRoute>} />
          <Route path="/recruiter/postings/:id/ranked" element={<ProtectedRoute recruiterOnly><RankedList /></ProtectedRoute>} />
          <Route path="/recruiter/company/verify" element={<ProtectedRoute recruiterOnly><CompanyVerification /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute adminOnly><AdminQuestions /></ProtectedRoute>} />
          <Route path="/admin/queues" element={<ProtectedRoute adminOnly><AdminQueues /></ProtectedRoute>} />
          <Route path="/admin/companies" element={<ProtectedRoute adminOnly><AdminCompanyVerification /></ProtectedRoute>} />

          {/* about */}
          <Route path="/about" element={<About />} /> 
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />


          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-surface)' } },
          error: { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-surface)' } },
        }}
      />
    </ErrorBoundary>
  )
}