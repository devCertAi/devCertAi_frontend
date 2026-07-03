export interface User {
  id: string
  name: string
  email: string
  username: string
  avatar?: string
  role: 'user' | 'admin' | 'recruiter'
  isPremium: boolean
  premiumExpiresAt?: string
  isEmailVerified: boolean
  createdAt: string
}

export interface Project {
  user: any
  id: string
  userId: string
  title: string
  description?: string
  githubUrl?: string
  liveUrl?: string
  zipFileUrl?: string
  domain: string
  status: 'pending' | 'evaluating' | 'completed' | 'failed'
  score?: number
  level?: 'Beginner' | 'Intermediate' | 'Advanced'
  evaluationReport?: EvaluationReport
  plagiarismScore?: number
  createdAt: string
  certificate?: Certificate
}

export interface EvaluationReport {
  nextSteps: any
  recruiterSummary: any
  projectedScore: any
  certificateHeadline: any
  overallScore: number
  level: string
  categories: {
    codeQuality: CategoryScore
    architecture: CategoryScore
    documentation: CategoryScore
    security: CategoryScore
    performance: CategoryScore
    bestPractices: CategoryScore
  }
  strengths: string[]
  improvements: string[]
  bugsDetected: string[]
  summary: string
  plagiarismRisk: 'low' | 'medium' | 'high'
  estimatedExperience: string
}

export interface CategoryScore {
  score: number
  feedback: string
  issues: string[]
}

export interface ExamAttempt {
  id: string
  userId: string
  domain: string
  phase: 1 | 2
  status: 'pending' | 'active' | 'in_progress' | 'submitted' | 'graded' | 'completed' | 'terminated'
  phase1Score?: number
  phase2Score?: number
  totalScore?: number
  level?: string
  questions?: Question[]
  answers?: Record<string, string>
  timeLimitSec: number
  tabSwitchCount: number
  fullscreenExits: number
  proctorFlags?: ProctorFlag[]
  terminationReason?: string
  startedAt?: string
  submittedAt?: string
  createdAt: string
  certificate?: Certificate
}

export interface Question {
  id: string
  question: string
  options?: string[]
  type: 'mcq' | 'text' | 'explanation'
  context?: string
}

export interface ProctorFlag {
  type: string
  timestamp: string
}

export interface Certificate {
  userName: any
  id: string
  userId: string
  type: 'project_eval' | 'skill_cert'
  domain: string
  level: string
  score: number
  projectId?: string
  examAttemptId?: string
  certificateUrl?: string
  verificationId: string
  isPublic: boolean
  createdAt: string
  user?: User
  project?: Project
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

export interface Payment {
  id: string
  userId: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed'
  plan: string
  createdAt: string
}

export interface DashboardStats {
  // flat shape
  projectsCount?: number
  certificatesCount?: number
  avgScore?: number
  examsCount?: number
  // nested shape (stats.stats.x)
  stats?: {
    projectCount?: number
    certCount?: number
    avgScore?: number
    examCount?: number
  }
  recentProjects: Project[]
  recentActivity: ActivityItem[]
}
export interface ActivityItem {
  id: string
  type: string
  message: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// ============================================================================
// Recruiter hiring pipeline types
// ============================================================================

export interface Skill {
  id: string
  name: string
  level?: 'beginner' | 'intermediate' | 'advanced' | null
}

export interface JobPostingSkillRef {
  name: string
  required: boolean
}

export interface JobPosting {
  id: string
  recruiterId: string
  title: string
  description: string
  companyName: string
  requiredSkills: JobPostingSkillRef[]
  minExperience: number
  openings: number
  ruleScoreThreshold: number
  aiMatchThreshold: number
  assignmentBrief?: string
  assignmentDeadlineDays?: number
  examEnabled: boolean
  examDurationMin: number
  examWindowHours: number
  matchNotificationCap: number
  status: 'active' | 'closed' | 'draft'
  applyLinkSlug: string
  applicationCount?: number
  stageCounts?: Record<string, number>
  rankingSummary?: {
    rankedAt: string
    selectedCount: number
    rejectedCount: number
    cutoffScore: number
    rejectedSummary: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export type ApplicationStage =
  | 'applied' | 'screened' | 'assignment_sent' | 'assignment_submitted'
  | 'project_evaluated' | 'exam_sent' | 'exam_completed' | 'ranked'

export type ApplicationStatus = 'in_progress' | 'rejected' | 'selected'

export interface Application {
  id: string
  jobPostingId: string
  userId: string
  stage: ApplicationStage
  status: ApplicationStatus
  ruleScore?: number
  aiMatchScore?: number
  projectScore?: number
  examScore?: number
  finalScore?: number
  rank?: number
  missingSkills: string[]
  rejectionReason?: string
  selectionNarrative?: string
  assignmentDeadlineAt?: string
  examWindowExpiresAt?: string
  examAttemptId?: string
  projectId?: string
  createdAt: string
  updatedAt: string
  jobPosting?: {
    id: string
    title: string
    companyName: string
    applyLinkSlug?: string
    examEnabled?: boolean
    assignmentBrief?: string
    examDurationMin?: number
  }
  user?: {
    id: string
    name: string
    username: string
    email: string
    avatar?: string
  }
}