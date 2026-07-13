import type { LucideIcon } from 'lucide-react'
import { Monitor, Server, Rocket, Smartphone, PieChart, Wrench, Code2 } from 'lucide-react'

export interface Domain {
  id: string
  name: string
  icon: LucideIcon
  description: string
  color: string
  avgScore: number
}

export const DOMAINS: Domain[] = [
  {
    id: 'frontend',
    name: 'Frontend',
    icon: Monitor,
    description: 'React, Vue, Angular, CSS, HTML',
    color: 'var(--color-primary)',
    avgScore: 74,
  },
  {
    id: 'backend',
    name: 'Backend',
    icon: Server,
    description: 'Node.js, Python, Java, Go, APIs',
    color: 'var(--color-secondary)',
    avgScore: 71,
  },
  {
    id: 'fullstack',
    name: 'Full Stack',
    icon: Rocket,
    description: 'End-to-end web applications',
    color: 'var(--color-success)',
    avgScore: 68,
  },
  {
    id: 'mobile',
    name: 'Mobile',
    icon: Smartphone,
    description: 'React Native, Flutter, Swift, Kotlin',
    color: 'var(--color-warning)',
    avgScore: 72,
  },
  {
    id: 'data',
    name: 'Data Science',
    icon: PieChart,
    description: 'ML, Python, TensorFlow, Analysis',
    color: 'var(--color-danger)',
    avgScore: 69,
  },
  {
    id: 'devops',
    name: 'DevOps',
    icon: Wrench,
    description: 'Docker, K8s, CI/CD, Cloud',
    color: 'var(--color-purple)',
    avgScore: 66,
  },
  {
    id: 'programming',
    name: 'Programming Languages',
    icon: Code2,
    description: 'Java, C/C++, Python, JavaScript',
    color: 'var(--color-primary-d)',
    avgScore: 70,
  },
]

export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    description: 'Get started with AI evaluation',
    features: [
      '3 project evaluations/month',
      '1 skill exam/month',
      'Phase 1 exams only',
      'Basic evaluation report',
      'Community certificate',
      'Public profile',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    period: '',
    description: 'A small top-up for one or two extra evaluations',
    features: [
      '3 project evaluation credits',
      '2 skill exam credits',
      'Phase 1 + Phase 2 exams',
      'Detailed AI evaluation report',
      'Credits valid for 30 days',
    ],
    cta: 'Buy Starter',
    highlighted: false,
    razorpayAmount: 900,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 29,
    period: '',
    description: 'The best value for active job seekers',
    features: [
      '10 project evaluation credits',
      '6 skill exam credits',
      'Phase 1 + Phase 2 exams',
      'Detailed AI evaluation report',
      'PDF certificate download',
      'LinkedIn sharing',
      'No ads',
      'Credits valid for 45 days',
    ],
    cta: 'Buy Growth',
    highlighted: true,
    razorpayAmount: 2900,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    period: '',
    description: 'For heavy prep across multiple domains',
    features: [
      '22 project evaluation credits',
      '14 skill exam credits',
      'Phase 1 + Phase 2 exams',
      'Detailed AI evaluation report',
      'PDF certificate download',
      'LinkedIn sharing',
      'No ads',
      'Priority evaluation queue',
      'Re-evaluate up to 10 times',
      'Credits valid for 60 days',
    ],
    cta: 'Buy Pro',
    highlighted: false,
    razorpayAmount: 5900,
  },
  {
    id: 'recruiter',
    name: 'Recruiter',
    price: 999,
    period: '/month',
    description: 'For hiring teams & organizations',
    features: [
      '50 project evaluation credits',
      '20 skill exam credits',
      'Verify any certificate',
      'Bulk candidate evaluation',
      'Team dashboard',
      'API access',
      'Priority support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
    razorpayAmount: 99900,
  },
]

export const EXAM_ROUTES_NO_ADS = ['/exam']
export const PAYMENT_ROUTES_NO_ADS = ['/pricing']
export const DASHBOARD_ROUTES_NO_ADS = ['/dashboard']
