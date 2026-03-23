
-- ============================================================
-- HEALTH & WELLNESS (c9fe1334-1b64-42cf-9e85-7b1290e98f22)
-- Clear existing straight_talk
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (
  SELECT id FROM scoping_categories WHERE industry_id = 'c9fe1334-1b64-42cf-9e85-7b1290e98f22' AND phase = 'straight_talk'
);
DELETE FROM scoping_categories WHERE industry_id = 'c9fe1334-1b64-42cf-9e85-7b1290e98f22' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000001-0001-0000-0000-000000000001', 'c9fe1334-1b64-42cf-9e85-7b1290e98f22', 'Patient & Client Flow',        'st-patient-flow',        'Users',       'straight_talk', 0),
  ('b1000001-0001-0000-0000-000000000002', 'c9fe1334-1b64-42cf-9e85-7b1290e98f22', 'Booking & Scheduling',         'st-booking-scheduling',  'CalendarClock','straight_talk', 1),
  ('b1000001-0001-0000-0000-000000000003', 'c9fe1334-1b64-42cf-9e85-7b1290e98f22', 'Clinical Records & Compliance','st-clinical-compliance',  'ShieldCheck', 'straight_talk', 2),
  ('b1000001-0001-0000-0000-000000000004', 'c9fe1334-1b64-42cf-9e85-7b1290e98f22', 'Revenue & Retention',          'st-revenue-retention',   'DollarSign',  'straight_talk', 3),
  ('b1000001-0001-0000-0000-000000000005', 'c9fe1334-1b64-42cf-9e85-7b1290e98f22', 'Staff & Practitioner Management','st-staff-management',  'UserCheck',   'straight_talk', 4),
  ('b1000001-0001-0000-0000-000000000006', 'c9fe1334-1b64-42cf-9e85-7b1290e98f22', 'Communication & Follow-up',    'st-communication',       'MessageCircle','straight_talk', 5),
  ('b1000001-0001-0000-0000-000000000007', 'c9fe1334-1b64-42cf-9e85-7b1290e98f22', 'Technology & Systems',          'st-tech-systems',        'Monitor',     'straight_talk', 6),
  ('b1000001-0001-0000-0000-000000000008', 'c9fe1334-1b64-42cf-9e85-7b1290e98f22', 'Investment & Next Steps',       'st-investment-closing',  'Handshake',   'straight_talk', 7);

-- Patient & Client Flow
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000001-0001-0000-0000-000000000001', 'Walk me through a new patient''s journey — from first contact to their third appointment. Where do they typically drop off, and what do you think causes it?', 'text', 'Map the patient journey and identify drop-off points', 0, '[]'),
  ('b1000001-0001-0000-0000-000000000001', 'How many potential patients do you lose each month because they couldn''t book at a convenient time or didn''t follow through after an enquiry?', 'text', 'Quantify lost patient opportunities', 1, '[]'),
  ('b1000001-0001-0000-0000-000000000001', 'What does your waitlist management look like — do you have a system to fill cancelled slots quickly, or do they just become lost revenue?', 'text', 'Explore waitlist and cancellation management', 2, '[]'),
  ('b1000001-0001-0000-0000-000000000001', 'How do you currently handle patient intake forms — are they digital before the appointment, or is someone spending time entering data from paper forms?', 'text', 'Assess intake digitisation', 3, '[]');

-- Booking & Scheduling
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000001-0001-0000-0000-000000000002', 'What percentage of your bookings are made online versus phone/walk-in — and do no-shows cost you significantly each month?', 'text', 'Quantify booking channel mix and no-show cost', 0, '[]'),
  ('b1000001-0001-0000-0000-000000000002', 'How do you manage multi-practitioner scheduling — room allocation, equipment sharing, appointment type durations? Does it ever cause double-bookings or idle time?', 'text', 'Explore scheduling complexity', 1, '[]'),
  ('b1000001-0001-0000-0000-000000000002', 'What happens when a patient cancels last-minute — can you automatically offer that slot to someone else, or does it sit empty?', 'text', 'Assess cancellation recovery', 2, '[]'),
  ('b1000001-0001-0000-0000-000000000002', 'How are appointment reminders handled — automated SMS/email, or does someone manually call patients? What''s your current no-show rate?', 'text', 'Probe reminder automation', 3, '[]');

-- Clinical Records & Compliance
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000001-0001-0000-0000-000000000003', 'How confident are you that your patient records and consent forms would pass an audit today — is everything digital, current, and easily accessible?', 'text', 'Gauge compliance confidence', 0, '[]'),
  ('b1000001-0001-0000-0000-000000000003', 'How do you handle treatment notes — are practitioners documenting during or after appointments? How much unbilled time goes into documentation?', 'text', 'Quantify documentation burden', 1, '[]'),
  ('b1000001-0001-0000-0000-000000000003', 'For insurance or Medicare claims, how streamlined is the process — are claims going out same-day, or is there a backlog that delays your cash flow?', 'text', 'Assess claims processing efficiency', 2, '[]'),
  ('b1000001-0001-0000-0000-000000000003', 'How do you manage prescription tracking, referral letters, and inter-practitioner communication within your practice?', 'text', 'Explore clinical communication flow', 3, '[]');

-- Revenue & Retention
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000001-0001-0000-0000-000000000004', 'What does your patient retention look like — do you know your average patient lifetime value and what percentage return for ongoing care versus one-off visits?', 'text', 'Assess retention metrics awareness', 0, '[]'),
  ('b1000001-0001-0000-0000-000000000004', 'How do you currently re-engage patients who haven''t been in for a while — is there an automated recall system or is it manual?', 'text', 'Probe re-engagement automation', 1, '[]'),
  ('b1000001-0001-0000-0000-000000000004', 'Are you capturing opportunities for treatment plan upsells, packages, or wellness programs — or does revenue only come from single appointments?', 'text', 'Explore revenue diversification', 2, '[]'),
  ('b1000001-0001-0000-0000-000000000004', 'Do you have visibility into which services, practitioners, or time slots are most profitable — can you make data-driven decisions about your business mix?', 'text', 'Assess data-driven decision capability', 3, '[]');

-- Staff & Practitioner Management
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000001-0001-0000-0000-000000000005', 'How do you manage practitioner availability, leave, and CPD requirements — is it centralised or scattered across different systems?', 'text', 'Probe staff management centralisation', 0, '[]'),
  ('b1000001-0001-0000-0000-000000000005', 'For multi-practitioner clinics, how do you handle performance tracking — utilisation rates, revenue per practitioner, patient satisfaction?', 'text', 'Explore practitioner performance visibility', 1, '[]'),
  ('b1000001-0001-0000-0000-000000000005', 'How do you onboard new practitioners — is there a system for credentialing, room setup, and getting them visible for bookings quickly?', 'text', 'Assess onboarding efficiency', 2, '[]');

-- Communication & Follow-up
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000001-0001-0000-0000-000000000006', 'After a patient visit, what follow-up happens — care plan reminders, check-ins, satisfaction surveys? Is any of it automated?', 'text', 'Probe post-visit engagement', 0, '[]'),
  ('b1000001-0001-0000-0000-000000000006', 'How do you communicate with patients between appointments — portal, email, SMS? Do patients wish they had more ways to reach you?', 'text', 'Explore patient communication channels', 1, '[]'),
  ('b1000001-0001-0000-0000-000000000006', 'How do you handle referrals — both incoming and outgoing? Is there a tracking system so nothing falls through the cracks?', 'text', 'Assess referral tracking', 2, '[]'),
  ('b1000001-0001-0000-0000-000000000006', 'Do you collect and respond to patient reviews — and is your online reputation actively managed or left to chance?', 'text', 'Probe reputation management', 3, '[]');

-- Technology & Systems
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000001-0001-0000-0000-000000000007', 'How many different software systems does your practice use — and how much time is wasted on duplicate data entry between them?', 'text', 'Uncover platform fragmentation', 0, '[]'),
  ('b1000001-0001-0000-0000-000000000007', 'Does your current system integrate with Medicare, health funds, or accounting software — or are there manual handoffs?', 'text', 'Assess integration gaps', 1, '[]'),
  ('b1000001-0001-0000-0000-000000000007', 'If you could see one dashboard with all your key metrics — utilisation, revenue, patient satisfaction, outstanding claims — would that change how you run your practice?', 'text', 'Explore desire for unified visibility', 2, '[]'),
  ('b1000001-0001-0000-0000-000000000007', 'What is the biggest technology frustration in your practice right now — the thing that makes you think "there has to be a better way"?', 'text', 'Open-ended tech pain discovery', 3, '[]');

-- Investment & Next Steps
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000001-0001-0000-0000-000000000008', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', 'Gauge budget readiness', 0, '[]'),
  ('b1000001-0001-0000-0000-000000000008', 'Who else in your organisation needs to be part of this decision — and what would they need to see to say yes?', 'text', 'Identify decision-makers and blockers', 1, '[]'),
  ('b1000001-0001-0000-0000-000000000008', 'If we could show you a solution that addresses the top issues we''ve discussed today, what would your ideal timeline be to get started?', 'text', 'Close with timeline and urgency', 2, '[]');


-- ============================================================
-- INDIVIDUAL TRADE BUSINESS (61c5e06f-96d6-415f-ab49-e6ba31f0273e)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (
  SELECT id FROM scoping_categories WHERE industry_id = '61c5e06f-96d6-415f-ab49-e6ba31f0273e' AND phase = 'straight_talk'
);
DELETE FROM scoping_categories WHERE industry_id = '61c5e06f-96d6-415f-ab49-e6ba31f0273e' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000002-0001-0000-0000-000000000001', '61c5e06f-96d6-415f-ab49-e6ba31f0273e', 'Job Flow & Scheduling',    'st-job-flow',       'CalendarClock','straight_talk', 0),
  ('b1000002-0001-0000-0000-000000000002', '61c5e06f-96d6-415f-ab49-e6ba31f0273e', 'Quoting & Pricing',        'st-quoting',        'FileText',    'straight_talk', 1),
  ('b1000002-0001-0000-0000-000000000003', '61c5e06f-96d6-415f-ab49-e6ba31f0273e', 'Customer Communication',   'st-customer-comms', 'MessageCircle','straight_talk', 2),
  ('b1000002-0001-0000-0000-000000000004', '61c5e06f-96d6-415f-ab49-e6ba31f0273e', 'Cash Flow & Invoicing',    'st-cash-flow',      'DollarSign',  'straight_talk', 3),
  ('b1000002-0001-0000-0000-000000000005', '61c5e06f-96d6-415f-ab49-e6ba31f0273e', 'Materials & Suppliers',    'st-materials',      'Package',     'straight_talk', 4),
  ('b1000002-0001-0000-0000-000000000006', '61c5e06f-96d6-415f-ab49-e6ba31f0273e', 'Compliance & Licensing',   'st-compliance',     'ShieldCheck', 'straight_talk', 5),
  ('b1000002-0001-0000-0000-000000000007', '61c5e06f-96d6-415f-ab49-e6ba31f0273e', 'Growth & Lead Generation', 'st-growth-leads',   'TrendingUp',  'straight_talk', 6),
  ('b1000002-0001-0000-0000-000000000008', '61c5e06f-96d6-415f-ab49-e6ba31f0273e', 'Technology & Systems',     'st-tech-systems',   'Monitor',     'straight_talk', 7),
  ('b1000002-0001-0000-0000-000000000009', '61c5e06f-96d6-415f-ab49-e6ba31f0273e', 'Investment & Next Steps',  'st-investment',     'Handshake',   'straight_talk', 8);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000002-0001-0000-0000-000000000001', 'Walk me through a typical week — how do you decide which jobs to do when, and how often do urgent call-outs blow up your planned schedule?', 'text', 'Understand scheduling chaos', 0, '[]'),
  ('b1000002-0001-0000-0000-000000000001', 'When a customer calls for a job, how quickly can you give them a confirmed date — and how often do you have to reschedule because things run over?', 'text', 'Probe booking responsiveness', 1, '[]'),
  ('b1000002-0001-0000-0000-000000000001', 'How do you track where your team is during the day — do you have visibility into job progress, or do you find out when someone calls saying they''re done?', 'text', 'Assess real-time job visibility', 2, '[]'),
  ('b1000002-0001-0000-0000-000000000001', 'How much driving time could you save each week if jobs were optimised by location rather than the order they came in?', 'text', 'Quantify route inefficiency', 3, '[]'),
  ('b1000002-0001-0000-0000-000000000002', 'How do you currently quote jobs — on-the-spot estimates, detailed written quotes, or a mix? How many quotes don''t convert and why?', 'text', 'Explore quoting process and conversion', 0, '[]'),
  ('b1000002-0001-0000-0000-000000000002', 'How long does it take you to get a quote back to a customer — and do you lose jobs because someone else responded faster?', 'text', 'Probe quote speed competitive pressure', 1, '[]'),
  ('b1000002-0001-0000-0000-000000000002', 'Do you know your actual costs per job type — labour, materials, travel — well enough to know if you''re pricing profitably?', 'text', 'Assess job costing accuracy', 2, '[]'),
  ('b1000002-0001-0000-0000-000000000002', 'How do you handle scope creep on a job — when the work turns out bigger than quoted? Do you lose money or re-quote on the spot?', 'text', 'Explore scope creep management', 3, '[]'),
  ('b1000002-0001-0000-0000-000000000003', 'How do your customers typically contact you — phone, text, email, social media? Is keeping track of all those channels manageable?', 'text', 'Map communication channels', 0, '[]'),
  ('b1000002-0001-0000-0000-000000000003', 'After you complete a job, what follow-up happens — do you ask for reviews, offer maintenance plans, or send reminders for annual services?', 'text', 'Probe post-job engagement', 1, '[]'),
  ('b1000002-0001-0000-0000-000000000003', 'How much time per day do you spend on the phone answering enquiries, giving updates, or chasing customers for approvals?', 'text', 'Quantify phone/admin time', 2, '[]'),
  ('b1000002-0001-0000-0000-000000000003', 'When a customer complains or a job needs a callback, how do you track and resolve it — is there a system or does it rely on memory?', 'text', 'Assess complaint/callback tracking', 3, '[]'),
  ('b1000002-0001-0000-0000-000000000004', 'What does your invoicing process look like — are you invoicing same-day on completion, or do invoices sometimes go out days or weeks late?', 'text', 'Probe invoicing speed', 0, '[]'),
  ('b1000002-0001-0000-0000-000000000004', 'How much money is sitting in overdue invoices right now — and what do you do to chase them?', 'text', 'Quantify accounts receivable pain', 1, '[]'),
  ('b1000002-0001-0000-0000-000000000004', 'Do you have clear visibility into your weekly cash flow — do you know what''s coming in and going out, or is it a guessing game?', 'text', 'Assess cash flow visibility', 2, '[]'),
  ('b1000002-0001-0000-0000-000000000004', 'How do you handle payment on-site — card payments, bank transfers, or still chasing cheques and cash?', 'text', 'Explore payment methods', 3, '[]'),
  ('b1000002-0001-0000-0000-000000000005', 'How do you manage your materials — do you know what''s on the van, what needs ordering, and when supplier prices have changed?', 'text', 'Probe inventory management', 0, '[]'),
  ('b1000002-0001-0000-0000-000000000005', 'How often does a job get delayed because the right materials aren''t on hand — and what does that cost you in wasted trips and rescheduling?', 'text', 'Quantify materials delay impact', 1, '[]'),
  ('b1000002-0001-0000-0000-000000000005', 'Do you have preferred supplier relationships with trade accounts — and do you track whether you''re getting the best pricing?', 'text', 'Assess supplier relationship management', 2, '[]'),
  ('b1000002-0001-0000-0000-000000000006', 'Are all your licenses, insurance, and certifications current and easily accessible — could you produce them in under a minute if asked?', 'text', 'Probe compliance document management', 0, '[]'),
  ('b1000002-0001-0000-0000-000000000006', 'How do you manage compliance certificates for completed work — do you issue them on the spot or is there a backlog?', 'text', 'Assess certificate issuance', 1, '[]'),
  ('b1000002-0001-0000-0000-000000000006', 'For safety documentation — JSAs, risk assessments, before-and-after photos — how do you capture and store these for each job?', 'text', 'Explore safety documentation', 2, '[]'),
  ('b1000002-0001-0000-0000-000000000007', 'Where do your new customers come from — word of mouth, Google, social media, directories? Do you know which channel brings the best-value jobs?', 'text', 'Map lead sources and ROI', 0, '[]'),
  ('b1000002-0001-0000-0000-000000000007', 'What percentage of your revenue comes from repeat customers versus new ones — and do you actively nurture those repeat relationships?', 'text', 'Assess repeat vs new customer mix', 1, '[]'),
  ('b1000002-0001-0000-0000-000000000007', 'Are you turning away work because you''re too busy, or are there quiet periods where more leads would make a big difference?', 'text', 'Probe capacity utilisation', 2, '[]'),
  ('b1000002-0001-0000-0000-000000000007', 'Have you ever thought about offering maintenance contracts or service agreements for recurring revenue — and what stopped you?', 'text', 'Explore recurring revenue opportunity', 3, '[]'),
  ('b1000002-0001-0000-0000-000000000008', 'How many apps or systems are you using right now — scheduling, invoicing, accounting, CRM — and how well do they talk to each other?', 'text', 'Uncover platform fragmentation', 0, '[]'),
  ('b1000002-0001-0000-0000-000000000008', 'What''s the one thing you wish your current software could do that it can''t — the thing that would save you the most time?', 'text', 'Open-ended tech wish', 1, '[]'),
  ('b1000002-0001-0000-0000-000000000008', 'Does your team actually use the systems you''ve set up — or do they revert to texts, notepads, and memory?', 'text', 'Assess adoption reality', 2, '[]'),
  ('b1000002-0001-0000-0000-000000000009', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', 'Gauge budget readiness', 0, '[]'),
  ('b1000002-0001-0000-0000-000000000009', 'Who else in your business needs to be part of this decision — and what would they need to see to say yes?', 'text', 'Identify decision-makers', 1, '[]'),
  ('b1000002-0001-0000-0000-000000000009', 'If we could show you a solution that addresses the top issues we''ve discussed today, what would your ideal timeline be to get started?', 'text', 'Close with timeline', 2, '[]');
