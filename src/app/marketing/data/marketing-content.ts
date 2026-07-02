export interface MarketingModule {
  icon: string;
  title: string;
  description: string;
  color: string;
}

export interface MarketingBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface MarketingCapability {
  icon: string;
  title: string;
  description: string;
}

export interface MarketingIntegration {
  name: string;
  icon: string;
}

export interface MarketingTestimonial {
  institution: string;
  role: string;
  quote: string;
  author: string;
}

export interface MarketingPricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
  enterprise?: boolean;
}

export interface MarketingFaq {
  question: string;
  answer: string;
}

export interface MarketingCarouselItem {
  title: string;
  description: string;
  accent: string;
}

export const TRUST_METRICS = [
  { label: 'Institutions', value: '150+' },
  { label: 'Students', value: '18,000+' },
  { label: 'Teachers', value: '1,250+' },
  { label: 'Platform Uptime', value: '99.99%' }
];

export const INSTITUTION_LOGOS = [
  'Xavier University',
  'Delhi Public School',
  'St. Mary\'s Academy',
  'Greenfield International',
  'Heritage College',
  'Sunrise Public School'
];

export const PLATFORM_MODULES: MarketingModule[] = [
  { icon: 'pi-send', title: 'Admissions', description: 'Streamline inquiries, applications, and enrollment.', color: '#3b82f6' },
  { icon: 'pi-book', title: 'Academics', description: 'Curriculum, timetables, and academic planning.', color: '#6366f1' },
  { icon: 'pi-users', title: 'Student Information', description: 'Complete student profiles and records.', color: '#8b5cf6' },
  { icon: 'pi-clock', title: 'Attendance', description: 'Real-time tracking for students and staff.', color: '#0ea5e9' },
  { icon: 'pi-file-edit', title: 'Examinations', description: 'Schedules, grading, and report cards.', color: '#14b8a6' },
  { icon: 'pi-wallet', title: 'Finance', description: 'Fee collection, billing, and reconciliation.', color: '#22c55e' },
  { icon: 'pi-briefcase', title: 'HR & Payroll', description: 'Staff lifecycle and payroll automation.', color: '#f59e0b' },
  { icon: 'pi-car', title: 'Transport', description: 'Routes, vehicles, and live tracking.', color: '#ef4444' },
  { icon: 'pi-building', title: 'Library', description: 'Catalog, circulation, and digital resources.', color: '#a855f7' },
  { icon: 'pi-home', title: 'Hostel', description: 'Room allocation and hostel operations.', color: '#ec4899' },
  { icon: 'pi-comments', title: 'Communication', description: 'Announcements, SMS, and parent portals.', color: '#06b6d4' },
  { icon: 'pi-chart-bar', title: 'Reports', description: 'Custom reports across every department.', color: '#64748b' },
  { icon: 'pi-chart-line', title: 'Analytics', description: 'Insights that drive better decisions.', color: '#2563eb' }
];

export const BENEFITS: MarketingBenefit[] = [
  { icon: 'pi-bolt', title: 'Reduce Administrative Work', description: 'Automate repetitive tasks so your team focuses on education.' },
  { icon: 'pi-comment', title: 'Improve Parent Communication', description: 'Keep families informed with timely, transparent updates.' },
  { icon: 'pi-cog', title: 'Automate Daily Operations', description: 'From attendance to fees — workflows run on autopilot.' },
  { icon: 'pi-chart-line', title: 'Increase Operational Efficiency', description: 'Unified data eliminates silos and duplicate entry.' },
  { icon: 'pi-sitemap', title: 'Multi Campus Ready', description: 'Manage branches from a single control center.' },
  { icon: 'pi-cloud', title: 'Cloud Native', description: 'Secure, scalable infrastructure with zero maintenance.' },
  { icon: 'pi-shield', title: 'Enterprise Security', description: 'Role-based access, audit trails, and encryption.' },
  { icon: 'pi-lock', title: 'Role Based Access', description: 'Granular permissions for every stakeholder.' },
  { icon: 'pi-sparkles', title: 'AI Assisted Workflows', description: 'Smart suggestions that accelerate decision-making.' }
];

export const CAPABILITIES: MarketingCapability[] = [
  { icon: 'pi-sync', title: 'Automation Engine', description: 'Trigger actions across modules without manual intervention.' },
  { icon: 'pi-sitemap', title: 'Workflow Management', description: 'Design approval chains that match your institution.' },
  { icon: 'pi-key', title: 'Role Based Permissions', description: 'Fine-grained access control for every user type.' },
  { icon: 'pi-check-circle', title: 'Approval Workflows', description: 'Multi-step approvals with full audit history.' },
  { icon: 'pi-bell', title: 'Notifications', description: 'Email, SMS, and in-app alerts in real time.' },
  { icon: 'pi-file', title: 'Custom Reports', description: 'Build reports tailored to your leadership team.' },
  { icon: 'pi-code', title: 'REST APIs', description: 'Integrate with your existing tools and data.' },
  { icon: 'pi-link', title: 'Integrations', description: 'Connect payment, SMS, and productivity platforms.' },
  { icon: 'pi-history', title: 'Audit Logs', description: 'Complete traceability for compliance and security.' },
  { icon: 'pi-chart-bar', title: 'Real Time Analytics', description: 'Live dashboards for operational visibility.' },
  { icon: 'pi-sparkles', title: 'AI Powered Insights', description: 'Predictive analytics for enrollment and performance.' }
];

export const INTEGRATIONS: MarketingIntegration[] = [
  { name: 'Google Workspace', icon: 'pi-google' },
  { name: 'Microsoft 365', icon: 'pi-microsoft' },
  { name: 'Zoom', icon: 'pi-video' },
  { name: 'WhatsApp', icon: 'pi-whatsapp' },
  { name: 'Payment Gateway', icon: 'pi-credit-card' },
  { name: 'SMS Gateway', icon: 'pi-mobile' },
  { name: 'REST API', icon: 'pi-code' }
];

export const TESTIMONIALS: MarketingTestimonial[] = [
  {
    institution: 'Xavier University',
    role: 'Director of Operations',
    author: 'Priya Sharma',
    quote: 'ThinkerScave transformed how we manage admissions and finance across three campuses. Our admin team saves over 20 hours every week.'
  },
  {
    institution: 'Delhi Public School',
    role: 'Principal',
    author: 'Rajesh Mehta',
    quote: 'Parent communication improved dramatically. Fee collection is seamless, and teachers finally have one place for attendance and academics.'
  },
  {
    institution: 'Greenfield International',
    role: 'IT Head',
    author: 'Anita Desai',
    quote: 'The platform feels modern and fast. Role-based access gave us enterprise-grade security without slowing anyone down.'
  }
];

export const PRICING_PLANS: MarketingPricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 999,
    yearlyPrice: 799,
    description: 'For small schools getting started with digital operations.',
    features: ['Up to 500 students', 'Core academics & attendance', 'Fee management', 'Email support']
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 1999,
    yearlyPrice: 1599,
    description: 'For growing institutions that need more modules.',
    features: ['Up to 2,000 students', 'All Starter features', 'HR & transport', 'Parent mobile app', 'Priority support']
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 3499,
    yearlyPrice: 2799,
    description: 'Full platform for established institutions.',
    popular: true,
    features: ['Unlimited students', 'All modules included', 'Advanced analytics', 'API access', 'Dedicated success manager']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Custom deployment for large university systems.',
    enterprise: true,
    features: ['Multi-campus architecture', 'Custom integrations', 'SLA & on-prem options', 'White-label branding', '24/7 phone support']
  }
];

export const FAQ_ITEMS: MarketingFaq[] = [
  {
    question: 'How long does implementation take?',
    answer: 'Most schools go live within 2–4 weeks. Our onboarding team handles data migration, training, and configuration tailored to your institution.'
  },
  {
    question: 'Can we migrate from our existing ERP?',
    answer: 'Yes. We provide structured migration tools and dedicated support to move student records, fee history, and academic data with minimal disruption.'
  },
  {
    question: 'Is ThinkerScave secure for sensitive student data?',
    answer: 'Absolutely. We use encryption at rest and in transit, role-based access control, audit logging, and regular security assessments.'
  },
  {
    question: 'Do you offer a mobile app for parents and teachers?',
    answer: 'Yes. Native mobile apps are available for parents and teachers with attendance alerts, fee payments, homework, and announcements.'
  },
  {
    question: 'Can we customize modules for our workflow?',
    answer: 'Professional and Enterprise plans include workflow customization, approval chains, and custom report builders.'
  },
  {
    question: 'What support options are available?',
    answer: 'All plans include email support. Growth and above get priority response. Enterprise customers receive a dedicated account manager and 24/7 phone support.'
  }
];

export const PRODUCT_CAROUSEL: MarketingCarouselItem[] = [
  { title: 'Admin Dashboard', description: 'Bird\'s-eye view of operations, enrollment, and revenue.', accent: '#3b82f6' },
  { title: 'Teacher Dashboard', description: 'Attendance, lesson plans, and grading in one workspace.', accent: '#6366f1' },
  { title: 'Student Dashboard', description: 'Timetables, assignments, and progress at a glance.', accent: '#8b5cf6' },
  { title: 'Parent Mobile App', description: 'Fees, attendance alerts, and direct school communication.', accent: '#0ea5e9' },
  { title: 'Finance Dashboard', description: 'Fee collection, defaulters, and reconciliation reports.', accent: '#22c55e' },
  { title: 'Attendance Dashboard', description: 'Real-time tracking with automated parent notifications.', accent: '#f59e0b' }
];
