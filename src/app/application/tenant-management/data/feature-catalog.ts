import { PlanTier } from './tenant-view.model';

export type MatrixTier = Exclude<PlanTier, 'unknown'>;

export interface PlanDefinition {
  id: MatrixTier;
  name: string;
  tagline: string;
  badge?: string;
  audience: string;
  priceLabel: string;
  priceHint: string;
  ctaLabel: string;
  highlight?: boolean;
}

export interface MatrixCell {
  value: string | boolean;
  hint?: string;
}

export interface MatrixRow {
  label: string;
  description?: string;
  values: Record<MatrixTier, MatrixCell>;
}

export interface MatrixGroup {
  title: string;
  caption: string;
  icon: string;
  rows: MatrixRow[];
}

export const PLAN_DEFS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Try ThinkersCave with a single campus',
    audience: 'Pilot programs · single branch',
    priceLabel: 'Free 30-day trial',
    priceHint: 'No credit card required',
    ctaLabel: 'Start trial'
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Run academic operations end-to-end',
    badge: 'Most chosen',
    audience: 'Mid-sized colleges · multi-branch',
    priceLabel: 'From ₹ 12 / user / mo',
    priceHint: 'Billed annually',
    ctaLabel: 'Choose Professional',
    highlight: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Scale across regions with governance',
    audience: 'Universities · institutional groups',
    priceLabel: 'Volume pricing',
    priceHint: 'Talk to sales',
    ctaLabel: 'Contact sales'
  },
  {
    id: 'custom',
    name: 'Custom',
    tagline: 'Hand-picked modules + dedicated tenancy',
    audience: 'Strategic accounts · custom contracts',
    priceLabel: 'Tailored',
    priceHint: 'Net-30 invoicing',
    ctaLabel: 'Design plan'
  }
];

const cell = (s: string | boolean, hint?: string): MatrixCell => ({ value: s, hint });
const yes = cell(true);
const no = cell(false);
const addOn = cell('Add-on');

export const FEATURE_MATRIX: MatrixGroup[] = [
  {
    title: 'Capacity & limits',
    caption: 'Operational ceilings that scale with each tier',
    icon: 'pi-chart-line',
    rows: [
      { label: 'Active users', values: { starter: cell('Up to 25'), professional: cell('Up to 500'), enterprise: cell('Unlimited'), custom: cell('Unlimited') } },
      { label: 'Students', values: { starter: cell('500'), professional: cell('10,000'), enterprise: cell('Unlimited'), custom: cell('Unlimited') } },
      { label: 'Branches / campuses', values: { starter: cell('1'), professional: cell('10'), enterprise: cell('Unlimited'), custom: cell('Unlimited') } },
      { label: 'Storage', values: { starter: cell('5 GB'), professional: cell('200 GB'), enterprise: cell('2 TB'), custom: cell('Negotiated') } },
      { label: 'API rate limit', values: { starter: cell('60 / min'), professional: cell('600 / min'), enterprise: cell('5,000 / min'), custom: cell('Bespoke') } }
    ]
  },
  {
    title: 'Academic modules',
    caption: 'Day-to-day modules used by faculty and staff',
    icon: 'pi-book',
    rows: [
      { label: 'Admissions', values: { starter: yes, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Academics & syllabus', values: { starter: yes, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Attendance', values: { starter: yes, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Examinations', values: { starter: cell('Basic'), professional: yes, enterprise: yes, custom: yes } },
      { label: 'Library', values: { starter: no, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Hostel', values: { starter: no, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Transport', values: { starter: no, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Inventory & stores', values: { starter: no, professional: addOn, enterprise: yes, custom: yes } },
      { label: 'HRMS', values: { starter: no, professional: addOn, enterprise: yes, custom: yes } }
    ]
  },
  {
    title: 'Finance & communication',
    caption: 'Revenue, parent engagement and outreach',
    icon: 'pi-wallet',
    rows: [
      { label: 'Fee management', values: { starter: cell('Basic'), professional: yes, enterprise: yes, custom: yes } },
      { label: 'Payment gateway', values: { starter: addOn, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Communication (Email / SMS)', values: { starter: cell('Email only'), professional: yes, enterprise: yes, custom: yes } },
      { label: 'WhatsApp + push', values: { starter: no, professional: addOn, enterprise: yes, custom: yes } },
      { label: 'Reports & dashboards', values: { starter: cell('Standard'), professional: cell('Advanced'), enterprise: cell('Advanced + BI'), custom: cell('Advanced + BI') } }
    ]
  },
  {
    title: 'Security & governance',
    caption: 'Identity, compliance and tenant isolation',
    icon: 'pi-shield',
    rows: [
      { label: 'Role-based access control', values: { starter: yes, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Two-factor authentication', values: { starter: yes, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Single sign-on (SAML / OIDC)', values: { starter: no, professional: addOn, enterprise: yes, custom: yes } },
      { label: 'Audit log retention', values: { starter: cell('30 days'), professional: cell('1 year'), enterprise: cell('7 years'), custom: cell('Custom') } },
      { label: 'White labeling', values: { starter: no, professional: cell('Logo + colours'), enterprise: cell('Full branding'), custom: cell('Full branding + domain') } },
      { label: 'Dedicated tenancy', values: { starter: no, professional: no, enterprise: addOn, custom: yes } }
    ]
  },
  {
    title: 'Platform & support',
    caption: 'How quickly we respond when things matter',
    icon: 'pi-headphones',
    rows: [
      { label: 'API access', values: { starter: cell('Read only'), professional: yes, enterprise: yes, custom: yes } },
      { label: 'Webhooks & integrations', values: { starter: no, professional: yes, enterprise: yes, custom: yes } },
      { label: 'Onboarding programme', values: { starter: cell('Self-serve'), professional: cell('Guided'), enterprise: cell('White-glove'), custom: cell('Dedicated CSM') } },
      { label: 'Support', values: { starter: cell('Community'), professional: cell('8×5 chat'), enterprise: cell('24×7 priority'), custom: cell('Named CSM') } },
      { label: 'SLA', values: { starter: cell('Best effort'), professional: cell('99.5%'), enterprise: cell('99.9%'), custom: cell('Custom') } }
    ]
  }
];
