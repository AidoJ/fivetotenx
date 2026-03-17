// Industry-specific scoping question banks
// Each question uses Yes/No format — if Yes, a detail dialog opens

export interface ScopingQuestion {
  id: string;
  question: string;
  detailPrompt: string; // shown in dialog when "Yes"
}

export interface QuestionCategory {
  id: string;
  label: string;
  icon: string; // lucide icon name
  questions: ScopingQuestion[];
}

export interface IndustryQuestionBank {
  id: string;
  label: string;
  description: string;
  examples: string[];
  available: boolean; // false = greyed out, questionnaire not yet built
  categories: QuestionCategory[];
}

// ─── HEALTH & BEAUTY ────────────────────────────────────────
const healthBeautyCategories: QuestionCategory[] = [
  {
    id: 'services',
    label: 'Services & Offerings',
    icon: 'Sparkles',
    questions: [
      { id: 'hb-s1', question: 'Do you offer multiple service types or categories?', detailPrompt: 'List all your service categories and any variations (e.g. duration options, treatment levels, combo packages).' },
      { id: 'hb-s2', question: 'Does your pricing vary by duration, time of day, or therapist level?', detailPrompt: 'Describe your pricing structure and any variable pricing rules.' },
      { id: 'hb-s3', question: 'Do you sell packages or series of sessions?', detailPrompt: 'Describe your package offerings (e.g. "5 sessions for $X", monthly memberships, etc.).' },
      { id: 'hb-s4', question: 'Do you sell gift cards or vouchers?', detailPrompt: 'Are they physical, digital, or both? Do they expire? Can they be used for any service?' },
      { id: 'hb-s5', question: 'Do you offer discount or promo codes?', detailPrompt: 'Describe the types of discounts (% off, $ off, first-time, referral, seasonal) and any rules.' },
      { id: 'hb-s6', question: 'Do any services require special equipment, rooms, or multiple staff?', detailPrompt: 'List which services have resource constraints and what resources they need.' },
      { id: 'hb-s7', question: 'Do you offer add-on services or upsells during booking?', detailPrompt: 'Describe the add-ons available and how they relate to main services.' },
    ],
  },
  {
    id: 'booking',
    label: 'Booking & Scheduling',
    icon: 'Calendar',
    questions: [
      { id: 'hb-b1', question: 'Can customers choose a specific staff member when booking?', detailPrompt: 'Describe how staff selection works — do customers pick, or are they auto-assigned? Can they request favourites?' },
      { id: 'hb-b2', question: 'Do you provide mobile or on-location services?', detailPrompt: 'Describe your mobile service model — travel radius, address capture, travel surcharges, etc.' },
      { id: 'hb-b3', question: 'Do you require a minimum booking lead time?', detailPrompt: 'What is the minimum notice period? Do you allow same-day bookings? Does it vary by service?' },
      { id: 'hb-b4', question: 'Do bookings require staff confirmation before they\'re finalised?', detailPrompt: 'Describe your confirmation workflow — instant confirm, staff accept/decline, timeout rules, etc.' },
      { id: 'hb-b5', question: 'Do you handle recurring or repeat bookings?', detailPrompt: 'Describe recurring booking needs — weekly, fortnightly, custom intervals, auto-payment, etc.' },
      { id: 'hb-b6', question: 'Do you have a cancellation or rescheduling policy?', detailPrompt: 'Describe your cancellation window, late-cancel fees, rescheduling rules, and refund policy.' },
      { id: 'hb-b7', question: 'Do clients need to fill in an intake form or health questionnaire before their appointment?', detailPrompt: 'Describe the information you need to collect — health conditions, allergies, consent, preferences, etc.' },
      { id: 'hb-b8', question: 'Do you operate across multiple locations or time zones?', detailPrompt: 'List your locations and any timezone considerations for scheduling.' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff & Team',
    icon: 'Users',
    questions: [
      { id: 'hb-t1', question: 'Do you have multiple staff members or contractors?', detailPrompt: 'How many staff? Are they employees or independent contractors? Do they have different pay rates?' },
      { id: 'hb-t2', question: 'Do staff manage their own availability?', detailPrompt: 'Describe how availability is currently managed — fixed roster, self-managed, split shifts, time-off requests.' },
      { id: 'hb-t3', question: 'Do staff have different qualifications or service capabilities?', detailPrompt: 'Describe how staff skills map to services — certifications, specialisations, experience levels.' },
      { id: 'hb-t4', question: 'Do staff have geographic service areas?', detailPrompt: 'How are service areas defined — by suburb, radius, postcode, or region?' },
      { id: 'hb-t5', question: 'Do you need a staff onboarding process in the system?', detailPrompt: 'Describe the onboarding steps — application form, document uploads, agreements, admin approval, etc.' },
      { id: 'hb-t6', question: 'Do staff need their own portal or dashboard?', detailPrompt: 'What would staff need to see and do — upcoming bookings, earnings, availability, profile management?' },
      { id: 'hb-t7', question: 'Do customers leave reviews for specific staff members?', detailPrompt: 'Are reviews public? Do you moderate them? Do they affect staff visibility or ranking?' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & Finance',
    icon: 'CreditCard',
    questions: [
      { id: 'hb-p1', question: 'Do you accept online payments?', detailPrompt: 'Which payment methods do you accept — credit card, PayPal, Apple Pay, etc.? Which gateway do you use or prefer?' },
      { id: 'hb-p2', question: 'Do you authorise payment upfront and capture later?', detailPrompt: 'Describe your payment flow — pre-auth, deposit, pay-on-day, or full upfront charge.' },
      { id: 'hb-p3', question: 'Do you need to store customer payment methods for future charges?', detailPrompt: 'Describe recurring charge needs — saved cards, auto-debit for memberships, etc.' },
      { id: 'hb-p4', question: 'Do you pay staff/contractors through the system?', detailPrompt: 'Describe how staff are paid — commission splits, invoice submission, expense claims, payment recording.' },
      { id: 'hb-p5', question: 'Do you issue quotes or estimates before confirming a booking?', detailPrompt: 'Describe your quoting process — what triggers a quote vs direct booking?' },
      { id: 'hb-p6', question: 'Do you need financial reporting?', detailPrompt: 'What reports matter most — revenue by period, by staff, by service, outstanding invoices, tax summaries?' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin & Operations',
    icon: 'Settings',
    questions: [
      { id: 'hb-a1', question: 'Do you need multiple admin users with different permission levels?', detailPrompt: 'Describe the roles you need — owner, manager, receptionist, read-only, etc.' },
      { id: 'hb-a2', question: 'Do admins need to create or edit bookings on behalf of customers?', detailPrompt: 'Describe admin booking scenarios — phone bookings, walk-ins, manual adjustments.' },
      { id: 'hb-a3', question: 'Do you need an admin dashboard with key metrics?', detailPrompt: 'What metrics matter most — today\'s bookings, revenue, staff utilisation, customer stats?' },
      { id: 'hb-a4', question: 'Do you need an activity or audit log?', detailPrompt: 'What actions should be logged — booking changes, payment events, staff updates, admin actions?' },
      { id: 'hb-a5', question: 'Are there manual processes you\'d like to automate?', detailPrompt: 'Describe the admin tasks that take the most time — follow-ups, reminders, roster management, reporting.' },
      { id: 'hb-a6', question: 'Do you need self-service settings (business hours, pricing, templates)?', detailPrompt: 'What settings should admins be able to change without developer help?' },
    ],
  },
  {
    id: 'comms',
    label: 'Communications',
    icon: 'MessageSquare',
    questions: [
      { id: 'hb-c1', question: 'Do you send booking confirmation emails?', detailPrompt: 'What emails do you currently send — confirmation, reminder, follow-up, receipt, review request?' },
      { id: 'hb-c2', question: 'Do you need SMS notifications?', detailPrompt: 'For which events — booking confirmation, reminders, staff alerts, promotions?' },
      { id: 'hb-c3', question: 'Do you send marketing or bulk communications?', detailPrompt: 'Describe your marketing needs — newsletters, promotions, re-engagement campaigns, opt-out management.' },
      { id: 'hb-c4', question: 'Do you need editable email templates in the admin panel?', detailPrompt: 'Who manages email content? How often does it change? Do you need dynamic merge fields?' },
      { id: 'hb-c5', question: 'Do you need automated reminder sequences?', detailPrompt: 'Describe the timing — 24hr before, morning-of, post-visit follow-up, review request, rebooking nudge.' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers & CRM',
    icon: 'UserCircle',
    questions: [
      { id: 'hb-cr1', question: 'Do customers need to create accounts?', detailPrompt: 'Can they book as guests? Do you want social login? What profile info do you need?' },
      { id: 'hb-cr2', question: 'Do you need a customer portal?', detailPrompt: 'What should customers see — booking history, upcoming appointments, loyalty points, saved payment methods?' },
      { id: 'hb-cr3', question: 'Do you need internal customer notes or tags?', detailPrompt: 'What CRM-style info do you track — preferences, allergies, VIP status, communication notes?' },
      { id: 'hb-cr4', question: 'Do you run a loyalty or rewards program?', detailPrompt: 'Describe the program — points per visit, referral bonuses, tier levels, redemption rules.' },
      { id: 'hb-cr5', question: 'Do you track marketing consent and email preferences?', detailPrompt: 'Describe your privacy/consent requirements — GDPR, opt-in/out, data retention policies.' },
    ],
  },
  {
    id: 'tech',
    label: 'Technology & Integrations',
    icon: 'Plug',
    questions: [
      { id: 'hb-i1', question: 'Do you have existing software that needs to integrate?', detailPrompt: 'List all current tools — POS, accounting (Xero, MYOB), CRM, email marketing, scheduling, etc.' },
      { id: 'hb-i2', question: 'Do you need calendar sync (Google Calendar, Outlook)?', detailPrompt: 'Who needs calendar sync — staff, admin, customers? One-way or two-way sync?' },
      { id: 'hb-i3', question: 'Do you have an existing website?', detailPrompt: 'Should the new system integrate with it, replace it, or work alongside it? What platform is it on?' },
      { id: 'hb-i4', question: 'Do you need a mobile app or PWA?', detailPrompt: 'For customers, staff, or both? Does it need to work offline? Push notifications?' },
      { id: 'hb-i5', question: 'Do you need mapping or location services?', detailPrompt: 'For what — address autocomplete, staff service areas, directions, distance calculations?' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance & Security',
    icon: 'Shield',
    questions: [
      { id: 'hb-x1', question: 'Do you handle sensitive data (health records, financial info)?', detailPrompt: 'Describe the types of sensitive data and any specific encryption or access control requirements.' },
      { id: 'hb-x2', question: 'Are there industry regulations you must comply with?', detailPrompt: 'List applicable regulations — HIPAA, AHPRA, PCI-DSS, GDPR, state/national health regulations.' },
      { id: 'hb-x3', question: 'Do you have data residency requirements?', detailPrompt: 'Where must your data be hosted? Any country-specific requirements?' },
      { id: 'hb-x4', question: 'Do you need document storage?', detailPrompt: 'What types of documents — contracts, consent forms, photos, certificates? Estimated volumes?' },
    ],
  },
  {
    id: 'launch',
    label: 'Launch & Growth',
    icon: 'Rocket',
    questions: [
      { id: 'hb-l1', question: 'Do you have a target launch date?', detailPrompt: 'What is the date and is it a hard deadline? Are there business events tied to it?' },
      { id: 'hb-l2', question: 'Would you prefer a phased launch (MVP first)?', detailPrompt: 'What features are absolutely essential for day one vs. nice-to-have for later phases?' },
      { id: 'hb-l3', question: 'Do you have defined success metrics?', detailPrompt: 'What does success look like at 3, 6, and 12 months — bookings per week, revenue targets, customer growth?' },
      { id: 'hb-l4', question: 'Will you need ongoing support and feature development?', detailPrompt: 'How often do you anticipate needing changes? Do you need a support plan or SLA?' },
      { id: 'hb-l5', question: 'Do you need training or documentation for your team?', detailPrompt: 'Who needs training — admin staff, field staff, management? Video tutorials, written guides, or live sessions?' },
    ],
  },
];

// ─── BUILDING & TRADES ──────────────────────────────────────
const buildingTradesCategories: QuestionCategory[] = [
  {
    id: 'services',
    label: 'Services & Quoting',
    icon: 'Hammer',
    questions: [
      { id: 'bt-s1', question: 'Do you offer multiple trade services or specialisations?', detailPrompt: 'List all services — e.g. renovations, new builds, plumbing, electrical, landscaping, maintenance.' },
      { id: 'bt-s2', question: 'Do you provide formal quotes or estimates before starting work?', detailPrompt: 'Describe your quoting process — site visit, itemised breakdown, validity period, approval workflow.' },
      { id: 'bt-s3', question: 'Do you have tiered pricing (standard, premium, emergency)?', detailPrompt: 'Describe pricing variations — call-out fees, after-hours rates, material markups, travel charges.' },
      { id: 'bt-s4', question: 'Do you manage ongoing maintenance contracts?', detailPrompt: 'Describe contract types — annual inspections, retainer agreements, warranty periods.' },
      { id: 'bt-s5', question: 'Do jobs require multiple site visits or stages?', detailPrompt: 'Describe typical project stages — inspection, quote, materials, execution, sign-off.' },
    ],
  },
  {
    id: 'scheduling',
    label: 'Job Scheduling & Dispatch',
    icon: 'Calendar',
    questions: [
      { id: 'bt-b1', question: 'Do you dispatch staff to customer locations?', detailPrompt: 'How is dispatch managed — manual assignment, nearest available, skill-based, round-robin?' },
      { id: 'bt-b2', question: 'Do you need to schedule multi-day jobs?', detailPrompt: 'Describe complex scheduling needs — multi-day projects, crew allocation, equipment booking.' },
      { id: 'bt-b3', question: 'Do customers need to book appointments online?', detailPrompt: 'For what — inspections, consultations, emergency call-outs? Or is all scheduling internal?' },
      { id: 'bt-b4', question: 'Do you track job progress through stages?', detailPrompt: 'Describe your workflow stages — quoted, approved, scheduled, in-progress, completed, invoiced.' },
      { id: 'bt-b5', question: 'Do you need GPS tracking or route optimisation?', detailPrompt: 'For what purpose — track staff location, optimise daily routes, calculate travel time?' },
    ],
  },
  {
    id: 'staff',
    label: 'Crew & Subcontractors',
    icon: 'Users',
    questions: [
      { id: 'bt-t1', question: 'Do you manage subcontractors alongside employees?', detailPrompt: 'How many of each? Different payment models? Do subs need system access?' },
      { id: 'bt-t2', question: 'Do staff have different trade qualifications or licenses?', detailPrompt: 'Describe licensing requirements — which jobs need which certifications? Expiry tracking?' },
      { id: 'bt-t3', question: 'Do you need to track staff certifications and expiry dates?', detailPrompt: 'Which certifications — white card, electrical license, working with children, insurance? Auto-reminders?' },
      { id: 'bt-t4', question: 'Do you assign crews or teams to jobs?', detailPrompt: 'How are teams structured — lead + labourers, fixed teams, or ad-hoc assignment?' },
      { id: 'bt-t5', question: 'Do staff submit timesheets or log hours?', detailPrompt: 'How are hours tracked — clock in/out, daily logs, per-job tracking? Approval workflow?' },
    ],
  },
  {
    id: 'payments',
    label: 'Invoicing & Payments',
    icon: 'CreditCard',
    questions: [
      { id: 'bt-p1', question: 'Do you invoice customers after job completion?', detailPrompt: 'Describe your invoicing — progress payments, deposit + final, itemised invoices, payment terms.' },
      { id: 'bt-p2', question: 'Do you need progress billing for large projects?', detailPrompt: 'How are milestones defined? Who approves progress claims? Retention amounts?' },
      { id: 'bt-p3', question: 'Do you track materials and costs per job?', detailPrompt: 'How are materials tracked — purchase orders, receipts, markup calculations, inventory?' },
      { id: 'bt-p4', question: 'Do you need to generate financial reports?', detailPrompt: 'What reports — job profitability, revenue by period, outstanding invoices, tax summaries?' },
      { id: 'bt-p5', question: 'Do you integrate with accounting software?', detailPrompt: 'Which system — Xero, MYOB, QuickBooks? What data needs to sync — invoices, payments, contacts?' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin & Operations',
    icon: 'Settings',
    questions: [
      { id: 'bt-a1', question: 'Do you need multiple admin roles (owner, office manager, foreman)?', detailPrompt: 'Describe the permission levels each role needs.' },
      { id: 'bt-a2', question: 'Do you need a job management dashboard?', detailPrompt: 'What key metrics — active jobs, revenue pipeline, overdue invoices, staff utilisation?' },
      { id: 'bt-a3', question: 'Do you need document management (plans, permits, photos)?', detailPrompt: 'What documents are managed — building plans, permits, site photos, compliance certs? Per-job filing?' },
      { id: 'bt-a4', question: 'Do you capture before/after photos for jobs?', detailPrompt: 'How are photos used — client reports, insurance claims, portfolio, compliance?' },
      { id: 'bt-a5', question: 'Do you need safety/compliance checklists?', detailPrompt: 'Describe safety requirements — site safety plans, JSAs, incident reporting, toolbox talks.' },
    ],
  },
  {
    id: 'comms',
    label: 'Communications',
    icon: 'MessageSquare',
    questions: [
      { id: 'bt-c1', question: 'Do you send job status updates to customers?', detailPrompt: 'At which stages — scheduled, on-the-way, completed, invoice sent? Via email, SMS, or both?' },
      { id: 'bt-c2', question: 'Do you need automated reminders?', detailPrompt: 'For what — upcoming appointments, overdue invoices, certification expiry, follow-ups?' },
      { id: 'bt-c3', question: 'Do you communicate with customers through the system?', detailPrompt: 'Describe communication needs — in-app messaging, quote discussions, job notes shared with clients.' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers & CRM',
    icon: 'UserCircle',
    questions: [
      { id: 'bt-cr1', question: 'Do you need to manage both residential and commercial clients?', detailPrompt: 'Are there different workflows, pricing, or communication needs for each type?' },
      { id: 'bt-cr2', question: 'Do customers need a portal to view job progress?', detailPrompt: 'What should they see — job status, photos, invoices, documents, communication history?' },
      { id: 'bt-cr3', question: 'Do you need to track job history per property address?', detailPrompt: 'Is history tied to the customer, the property address, or both? For warranty or maintenance tracking?' },
    ],
  },
  {
    id: 'tech',
    label: 'Technology & Integrations',
    icon: 'Plug',
    questions: [
      { id: 'bt-i1', question: 'Do you have existing job management or CRM software?', detailPrompt: 'List current tools — ServiceM8, Tradify, Fergus, Simpro, spreadsheets, etc.' },
      { id: 'bt-i2', question: 'Do you need your system to work offline on job sites?', detailPrompt: 'What needs to work offline — job details, photos, timesheets, forms? Sync when back online?' },
      { id: 'bt-i3', question: 'Do you need mapping for job locations?', detailPrompt: 'For what — address lookup, route planning, service area definition, job proximity?' },
    ],
  },
  {
    id: 'launch',
    label: 'Launch & Growth',
    icon: 'Rocket',
    questions: [
      { id: 'bt-l1', question: 'Do you have a target launch date?', detailPrompt: 'What is the date? Is it tied to a business event — busy season, new contract, expansion?' },
      { id: 'bt-l2', question: 'Would you prefer a phased rollout?', detailPrompt: 'What is essential for day one vs later phases? Are you replacing existing software?' },
      { id: 'bt-l3', question: 'Do you need training for office and field staff?', detailPrompt: 'Who needs training? Preferred format — in-person, video, written guides?' },
    ],
  },
];

// ─── PROFESSIONAL SERVICES ──────────────────────────────────
const professionalServicesCategories: QuestionCategory[] = [
  {
    id: 'services',
    label: 'Service Offerings',
    icon: 'Briefcase',
    questions: [
      { id: 'ps-s1', question: 'Do you offer different service tiers or engagement types?', detailPrompt: 'Describe your service structure — consulting, advisory, retainer, project-based, hourly, etc.' },
      { id: 'ps-s2', question: 'Do you provide proposals or statements of work before engagement?', detailPrompt: 'Describe your proposal process — templates, approval workflow, e-signatures, conversion tracking.' },
      { id: 'ps-s3', question: 'Do you offer subscription or retainer-based services?', detailPrompt: 'Describe the model — monthly retainers, prepaid hours, credit-based, auto-renewal.' },
      { id: 'ps-s4', question: 'Do you need to scope and estimate projects?', detailPrompt: 'Describe your estimation process — time estimates, fixed-fee, T&M, milestone-based.' },
    ],
  },
  {
    id: 'scheduling',
    label: 'Appointments & Meetings',
    icon: 'Calendar',
    questions: [
      { id: 'ps-b1', question: 'Do clients book consultations or meetings online?', detailPrompt: 'Describe booking needs — initial consults, recurring check-ins, ad-hoc calls, video vs in-person.' },
      { id: 'ps-b2', question: 'Do you need video conferencing integration?', detailPrompt: 'Which platform — Zoom, Teams, Google Meet? Auto-generate links? Record sessions?' },
      { id: 'ps-b3', question: 'Do you have multiple team members clients can book with?', detailPrompt: 'How is assignment managed — client chooses, round-robin, skill-based, account manager?' },
      { id: 'ps-b4', question: 'Do you need to track billable vs non-billable time?', detailPrompt: 'How is time tracked — manual entry, timer, calendar-based? Approval workflow?' },
    ],
  },
  {
    id: 'staff',
    label: 'Team & Resources',
    icon: 'Users',
    questions: [
      { id: 'ps-t1', question: 'Do team members have different specialisations or practice areas?', detailPrompt: 'Describe how skills map to client needs — practice areas, seniority levels, certifications.' },
      { id: 'ps-t2', question: 'Do you need resource allocation across multiple projects?', detailPrompt: 'Describe capacity planning needs — availability tracking, utilisation rates, conflict detection.' },
      { id: 'ps-t3', question: 'Do team members need individual dashboards?', detailPrompt: 'What should they see — assigned clients, tasks, time tracked, performance metrics?' },
    ],
  },
  {
    id: 'payments',
    label: 'Billing & Finance',
    icon: 'CreditCard',
    questions: [
      { id: 'ps-p1', question: 'Do you bill clients on a time-and-materials basis?', detailPrompt: 'Describe billing — hourly rates by role, expense pass-through, minimum billing increments.' },
      { id: 'ps-p2', question: 'Do you need to generate professional invoices?', detailPrompt: 'Describe invoice requirements — itemised, branded, payment terms, late fees, recurring invoices.' },
      { id: 'ps-p3', question: 'Do clients pay via multiple methods?', detailPrompt: 'Describe payment methods — bank transfer, credit card, direct debit, milestone-based.' },
      { id: 'ps-p4', question: 'Do you track project profitability?', detailPrompt: 'What metrics — cost vs revenue per project, realisation rate, write-offs, budget vs actual?' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin & Operations',
    icon: 'Settings',
    questions: [
      { id: 'ps-a1', question: 'Do you manage client matters or cases?', detailPrompt: 'Describe your case/matter structure — per-client, per-project, nested, status tracking.' },
      { id: 'ps-a2', question: 'Do you need document management?', detailPrompt: 'Describe document needs — client files, contracts, reports, version control, sharing permissions.' },
      { id: 'ps-a3', question: 'Do you need task or project management features?', detailPrompt: 'Describe workflow — task assignment, deadlines, dependencies, status tracking, kanban.' },
      { id: 'ps-a4', question: 'Do you need approval workflows?', detailPrompt: 'What needs approval — proposals, invoices, time entries, expense claims, document releases?' },
    ],
  },
  {
    id: 'comms',
    label: 'Communications',
    icon: 'MessageSquare',
    questions: [
      { id: 'ps-c1', question: 'Do you need a client communication portal?', detailPrompt: 'Describe needs — secure messaging, file sharing, status updates, meeting notes sharing.' },
      { id: 'ps-c2', question: 'Do you send automated client updates?', detailPrompt: 'At which stages — engagement start, milestone completion, invoice, review request?' },
      { id: 'ps-c3', question: 'Do you need email integration?', detailPrompt: 'Describe integration — log emails to client records, send from system, template library.' },
    ],
  },
  {
    id: 'customers',
    label: 'Client Management',
    icon: 'UserCircle',
    questions: [
      { id: 'ps-cr1', question: 'Do you need a full CRM for client relationships?', detailPrompt: 'Describe CRM needs — contact management, interaction history, pipeline tracking, segmentation.' },
      { id: 'ps-cr2', question: 'Do clients need a self-service portal?', detailPrompt: 'What should clients access — project status, documents, invoices, booking, communication?' },
      { id: 'ps-cr3', question: 'Do you track referral sources or business development?', detailPrompt: 'Describe BD tracking — referral sources, conversion rates, pipeline value, partner relationships.' },
    ],
  },
  {
    id: 'tech',
    label: 'Technology & Integrations',
    icon: 'Plug',
    questions: [
      { id: 'ps-i1', question: 'Do you use practice management software currently?', detailPrompt: 'List current tools — time tracking, billing, CRM, document management, project management.' },
      { id: 'ps-i2', question: 'Do you need integration with accounting software?', detailPrompt: 'Which system — Xero, MYOB, QuickBooks? What needs to sync — invoices, payments, time entries?' },
      { id: 'ps-i3', question: 'Do you need e-signature capabilities?', detailPrompt: 'For what — proposals, contracts, engagement letters, NDAs? Which provider — DocuSign, Adobe Sign?' },
    ],
  },
  {
    id: 'launch',
    label: 'Launch & Growth',
    icon: 'Rocket',
    questions: [
      { id: 'ps-l1', question: 'Do you have a target launch date?', detailPrompt: 'What is the date? Is it tied to a business event — new financial year, client onboarding?' },
      { id: 'ps-l2', question: 'Would you prefer a phased rollout?', detailPrompt: 'What is the MVP vs. future phases? How many users in the initial rollout?' },
      { id: 'ps-l3', question: 'Do you need data migration from existing systems?', detailPrompt: 'What data needs migrating — client records, project history, documents, financial data? From which systems?' },
    ],
  },
];

// ─── MASTER REGISTRY ────────────────────────────────────────
export const INDUSTRY_QUESTION_BANKS: IndustryQuestionBank[] = [
  {
    id: 'health-wellness',
    label: 'Health & Wellness',
    description: 'Businesses focused on personal care, treatment, and wellbeing',
    examples: ['Massage therapists', 'Physiotherapists', 'Chiropractors', 'Acupuncturists', 'Beauty salons & skin clinics', 'Personal trainers & yoga studios'],
    available: true,
    categories: healthBeautyCategories,
  },
  {
    id: 'trades-field-services',
    label: 'Trades & Field Services',
    description: 'Mobile or on-site service providers with scheduling/logistics needs',
    examples: ['Electricians', 'Plumbers', 'Builders & renovators', 'HVAC technicians', 'Landscapers & gardeners', 'Cleaning services'],
    available: true,
    categories: buildingTradesCategories,
  },
  {
    id: 'professional-services',
    label: 'Professional Services',
    description: 'Knowledge-based, client-facing advisory services',
    examples: ['Accountants', 'Lawyers', 'Financial planners', 'Business consultants', 'Marketing agencies', 'Mortgage brokers'],
    available: true,
    categories: professionalServicesCategories,
  },
  {
    id: 'hospitality-tourism',
    label: 'Hospitality & Tourism',
    description: 'Customer experience-driven, booking-heavy businesses',
    examples: ['Hotels & resorts', 'Airbnb/property managers', 'Tour operators', 'Event planners', 'Spas & retreat centres'],
    available: false,
    categories: [],
  },
  {
    id: 'fitness-recreation',
    label: 'Fitness & Recreation',
    description: 'Membership, class-based, or activity-driven businesses',
    examples: ['Gyms & fitness centres', 'Martial arts schools', 'Dance studios', 'Sports coaching businesses', 'Outdoor adventure companies'],
    available: false,
    categories: [],
  },
  {
    id: 'retail-ecommerce',
    label: 'Retail & E-commerce',
    description: 'Product-based businesses with online/offline sales',
    examples: ['Boutique stores', 'Health food shops', 'Beauty product brands', 'Specialty retailers', 'Subscription box businesses'],
    available: false,
    categories: [],
  },
  {
    id: 'education-coaching',
    label: 'Education & Coaching',
    description: 'Learning, development, and transformation-focused services',
    examples: ['Online course creators', 'Business coaches', 'Life coaches', 'Tutoring services', 'Training organisations'],
    available: false,
    categories: [],
  },
  {
    id: 'property-real-estate',
    label: 'Property & Real Estate',
    description: 'Asset management and transaction-based businesses',
    examples: ['Real estate agencies', 'Property managers', 'Buyers agents', 'Commercial leasing firms', 'Short-term rental managers'],
    available: false,
    categories: [],
  },
  {
    id: 'automotive-services',
    label: 'Automotive Services',
    description: 'Service, maintenance, and booking-driven vehicle businesses',
    examples: ['Mechanics', 'Mobile car detailers', 'Auto electricians', 'Tyre services', 'Fleet servicing companies'],
    available: false,
    categories: [],
  },
  {
    id: 'events-creative',
    label: 'Events & Creative Services',
    description: 'Project-based, creative, and client-experience businesses',
    examples: ['Photographers & videographers', 'Wedding planners', 'Stylists & makeup artists', 'DJs & entertainers', 'Event production companies'],
    available: false,
    categories: [],
  },
  {
    id: 'home-personal-services',
    label: 'Home & Personal Services',
    description: 'Recurring or convenience-based consumer services',
    examples: ['Home cleaning', 'NDIS providers', 'Pet grooming & boarding', 'Pool maintenance', 'Handyman services'],
    available: false,
    categories: [],
  },
];
