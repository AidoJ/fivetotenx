
-- ============================================================
-- EDUCATION & COACHING (5eb90dbc-ee4b-4e4c-ba37-3a085e473341)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (SELECT id FROM scoping_categories WHERE industry_id = '5eb90dbc-ee4b-4e4c-ba37-3a085e473341' AND phase = 'straight_talk');
DELETE FROM scoping_categories WHERE industry_id = '5eb90dbc-ee4b-4e4c-ba37-3a085e473341' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000007-0001-0000-0000-000000000001', '5eb90dbc-ee4b-4e4c-ba37-3a085e473341', 'Student & Client Acquisition', 'st-student-acq',    'TrendingUp',   'straight_talk', 0),
  ('b1000007-0001-0000-0000-000000000002', '5eb90dbc-ee4b-4e4c-ba37-3a085e473341', 'Program & Content Delivery',   'st-program-delivery','BookOpen',     'straight_talk', 1),
  ('b1000007-0001-0000-0000-000000000003', '5eb90dbc-ee4b-4e4c-ba37-3a085e473341', 'Engagement & Outcomes',        'st-engagement',     'Target',       'straight_talk', 2),
  ('b1000007-0001-0000-0000-000000000004', '5eb90dbc-ee4b-4e4c-ba37-3a085e473341', 'Revenue & Pricing',            'st-revenue',        'DollarSign',   'straight_talk', 3),
  ('b1000007-0001-0000-0000-000000000005', '5eb90dbc-ee4b-4e4c-ba37-3a085e473341', 'Admin & Scheduling',           'st-admin-sched',    'CalendarClock','straight_talk', 4),
  ('b1000007-0001-0000-0000-000000000006', '5eb90dbc-ee4b-4e4c-ba37-3a085e473341', 'Technology & Systems',         'st-tech',           'Monitor',      'straight_talk', 5),
  ('b1000007-0001-0000-0000-000000000007', '5eb90dbc-ee4b-4e4c-ba37-3a085e473341', 'Investment & Next Steps',      'st-investment',     'Handshake',    'straight_talk', 6);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000007-0001-0000-0000-000000000001', 'Where do your students or coaching clients find you — and which channel brings the highest-value, most committed participants?', 'text', '', 0, '[]'),
  ('b1000007-0001-0000-0000-000000000001', 'What does your enrolment funnel look like — from enquiry to sign-up? Where do people drop off and why?', 'text', '', 1, '[]'),
  ('b1000007-0001-0000-0000-000000000001', 'How do you nurture people who express interest but don''t enrol immediately — is there automated follow-up?', 'text', '', 2, '[]'),
  ('b1000007-0001-0000-0000-000000000001', 'Do you offer free tasters, trials, or discovery sessions — and what percentage convert to paying?', 'text', '', 3, '[]'),
  ('b1000007-0001-0000-0000-000000000002', 'How do you deliver your programs — live sessions, pre-recorded, hybrid, in-person? What limitations does your current setup create?', 'text', '', 0, '[]'),
  ('b1000007-0001-0000-0000-000000000002', 'How do you manage course materials, resources, and curriculum updates — is it centralised or scattered?', 'text', '', 1, '[]'),
  ('b1000007-0001-0000-0000-000000000002', 'For group programs, how do you manage cohorts, progress tracking, and completion rates?', 'text', '', 2, '[]'),
  ('b1000007-0001-0000-0000-000000000002', 'How do you handle assessments, certifications, or progress milestones — is it automated or manual?', 'text', '', 3, '[]'),
  ('b1000007-0001-0000-0000-000000000003', 'What does student/client engagement look like between sessions — do they have access to a community, resources, or accountability tools?', 'text', '', 0, '[]'),
  ('b1000007-0001-0000-0000-000000000003', 'How do you measure outcomes and success — completion rates, transformation metrics, testimonials? Can you prove your impact?', 'text', '', 1, '[]'),
  ('b1000007-0001-0000-0000-000000000003', 'What''s your dropout rate — and do you know when someone is disengaging before they quit?', 'text', '', 2, '[]'),
  ('b1000007-0001-0000-0000-000000000003', 'How do you collect testimonials and case studies — and do you use them systematically in marketing?', 'text', '', 3, '[]'),
  ('b1000007-0001-0000-0000-000000000004', 'What''s your pricing model — one-off, subscription, tiered packages? Is there recurring revenue, or does every month start from zero?', 'text', '', 0, '[]'),
  ('b1000007-0001-0000-0000-000000000004', 'Do you offer upsells — advanced programs, 1:1 coaching, group masterminds, certifications? How much untapped revenue is there?', 'text', '', 1, '[]'),
  ('b1000007-0001-0000-0000-000000000004', 'How do you handle payments — upfront, payment plans, failed payments? How much revenue leaks through billing issues?', 'text', '', 2, '[]'),
  ('b1000007-0001-0000-0000-000000000005', 'How much admin time goes into scheduling, rescheduling, sending reminders, and chasing people who don''t show up?', 'text', '', 0, '[]'),
  ('b1000007-0001-0000-0000-000000000005', 'How do you manage your calendar across 1:1 sessions, group calls, and content creation time — is it overwhelming?', 'text', '', 1, '[]'),
  ('b1000007-0001-0000-0000-000000000005', 'What admin tasks eat up time that should be spent on teaching or coaching — invoicing, emails, content formatting?', 'text', '', 2, '[]'),
  ('b1000007-0001-0000-0000-000000000006', 'How many platforms are you using — LMS, Zoom, email marketing, payment, scheduling, community? Do they integrate?', 'text', '', 0, '[]'),
  ('b1000007-0001-0000-0000-000000000006', 'What is the biggest technology frustration in your business right now?', 'text', '', 1, '[]'),
  ('b1000007-0001-0000-0000-000000000006', 'If you could have one unified platform for your entire business, what would it need to do?', 'text', '', 2, '[]'),
  ('b1000007-0001-0000-0000-000000000007', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', '', 0, '[]'),
  ('b1000007-0001-0000-0000-000000000007', 'Who else needs to be part of this decision?', 'text', '', 1, '[]'),
  ('b1000007-0001-0000-0000-000000000007', 'What would your ideal timeline be to get started?', 'text', '', 2, '[]');

-- ============================================================
-- PROPERTY & REAL ESTATE (45576e21-3d63-48cd-8f6a-bc748be7443d)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (SELECT id FROM scoping_categories WHERE industry_id = '45576e21-3d63-48cd-8f6a-bc748be7443d' AND phase = 'straight_talk');
DELETE FROM scoping_categories WHERE industry_id = '45576e21-3d63-48cd-8f6a-bc748be7443d' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000008-0001-0000-0000-000000000001', '45576e21-3d63-48cd-8f6a-bc748be7443d', 'Lead Generation & Listings',  'st-leads-listings', 'TrendingUp',  'straight_talk', 0),
  ('b1000008-0001-0000-0000-000000000002', '45576e21-3d63-48cd-8f6a-bc748be7443d', 'Sales & Transaction Process', 'st-sales-process',  'FileText',    'straight_talk', 1),
  ('b1000008-0001-0000-0000-000000000003', '45576e21-3d63-48cd-8f6a-bc748be7443d', 'Property Management',         'st-property-mgmt',  'Building2',   'straight_talk', 2),
  ('b1000008-0001-0000-0000-000000000004', '45576e21-3d63-48cd-8f6a-bc748be7443d', 'Client Relationships',        'st-client-rels',    'Users',       'straight_talk', 3),
  ('b1000008-0001-0000-0000-000000000005', '45576e21-3d63-48cd-8f6a-bc748be7443d', 'Compliance & Documentation',  'st-compliance',     'ShieldCheck', 'straight_talk', 4),
  ('b1000008-0001-0000-0000-000000000006', '45576e21-3d63-48cd-8f6a-bc748be7443d', 'Technology & Systems',        'st-tech',           'Monitor',     'straight_talk', 5),
  ('b1000008-0001-0000-0000-000000000007', '45576e21-3d63-48cd-8f6a-bc748be7443d', 'Investment & Next Steps',     'st-investment',     'Handshake',   'straight_talk', 6);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000008-0001-0000-0000-000000000001', 'Where do your best leads come from — portals, referrals, social media, signage? Which source produces the fastest, highest-value conversions?', 'text', '', 0, '[]'),
  ('b1000008-0001-0000-0000-000000000001', 'How quickly do you respond to new enquiries — and how many leads go cold because follow-up wasn''t fast enough?', 'text', '', 1, '[]'),
  ('b1000008-0001-0000-0000-000000000001', 'How do you manage listing marketing — photography, copywriting, portal syndication, social promotion? How much time does each listing take?', 'text', '', 2, '[]'),
  ('b1000008-0001-0000-0000-000000000001', 'Do you have a system for nurturing buyers/tenants who aren''t ready now but will be in 3-6 months?', 'text', '', 3, '[]'),
  ('b1000008-0001-0000-0000-000000000002', 'Walk me through a typical sale from listing to settlement — where are the bottlenecks and delays?', 'text', '', 0, '[]'),
  ('b1000008-0001-0000-0000-000000000002', 'How do you manage open homes, inspections, and buyer feedback — is it systematic or relying on agent memory?', 'text', '', 1, '[]'),
  ('b1000008-0001-0000-0000-000000000002', 'How do you track offers, negotiations, and contract conditions — can you see the status of every deal at a glance?', 'text', '', 2, '[]'),
  ('b1000008-0001-0000-0000-000000000002', 'How do you keep vendors informed about their campaign performance, enquiry levels, and market feedback?', 'text', '', 3, '[]'),
  ('b1000008-0001-0000-0000-000000000003', 'For property management — how do you handle maintenance requests, tenant communications, and lease renewals? Is it efficient or a time drain?', 'text', '', 0, '[]'),
  ('b1000008-0001-0000-0000-000000000003', 'How do you manage rent arrears and payment follow-ups — is it automated or manual chasing?', 'text', '', 1, '[]'),
  ('b1000008-0001-0000-0000-000000000003', 'How do you coordinate routine inspections, condition reports, and compliance checks across your portfolio?', 'text', '', 2, '[]'),
  ('b1000008-0001-0000-0000-000000000004', 'How do you stay in touch with past clients — birthday/anniversary touches, market updates, referral requests?', 'text', '', 0, '[]'),
  ('b1000008-0001-0000-0000-000000000004', 'What percentage of your business comes from referrals and repeat clients — and are you actively nurturing that?', 'text', '', 1, '[]'),
  ('b1000008-0001-0000-0000-000000000004', 'How do agents manage their personal pipeline and prospecting — is there accountability and visibility?', 'text', '', 2, '[]'),
  ('b1000008-0001-0000-0000-000000000005', 'How do you manage compliance — trust accounts, agency agreements, disclosure requirements? Is it audit-ready?', 'text', '', 0, '[]'),
  ('b1000008-0001-0000-0000-000000000005', 'How do you handle document management — contracts, certificates, condition reports — across your portfolio?', 'text', '', 1, '[]'),
  ('b1000008-0001-0000-0000-000000000006', 'How many systems are running your agency — CRM, portal feeds, trust accounting, marketing? How well do they integrate?', 'text', '', 0, '[]'),
  ('b1000008-0001-0000-0000-000000000006', 'What is the biggest technology frustration in your agency right now?', 'text', '', 1, '[]'),
  ('b1000008-0001-0000-0000-000000000007', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', '', 0, '[]'),
  ('b1000008-0001-0000-0000-000000000007', 'Who else needs to be part of this decision?', 'text', '', 1, '[]'),
  ('b1000008-0001-0000-0000-000000000007', 'What would your ideal timeline be to get started?', 'text', '', 2, '[]');

-- ============================================================
-- AUTOMOTIVE SERVICES (de731bc8-4cea-4189-89e7-2517504db780)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (SELECT id FROM scoping_categories WHERE industry_id = 'de731bc8-4cea-4189-89e7-2517504db780' AND phase = 'straight_talk');
DELETE FROM scoping_categories WHERE industry_id = 'de731bc8-4cea-4189-89e7-2517504db780' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000009-0001-0000-0000-000000000001', 'de731bc8-4cea-4189-89e7-2517504db780', 'Workshop Flow & Scheduling',  'st-workshop-flow',  'CalendarClock','straight_talk', 0),
  ('b1000009-0001-0000-0000-000000000002', 'de731bc8-4cea-4189-89e7-2517504db780', 'Customer Communication',      'st-customer-comms', 'MessageCircle','straight_talk', 1),
  ('b1000009-0001-0000-0000-000000000003', 'de731bc8-4cea-4189-89e7-2517504db780', 'Parts & Inventory',           'st-parts-inventory','Package',     'straight_talk', 2),
  ('b1000009-0001-0000-0000-000000000004', 'de731bc8-4cea-4189-89e7-2517504db780', 'Quoting, Invoicing & Revenue','st-quoting-revenue','DollarSign',   'straight_talk', 3),
  ('b1000009-0001-0000-0000-000000000005', 'de731bc8-4cea-4189-89e7-2517504db780', 'Compliance & Warranties',     'st-compliance',     'ShieldCheck', 'straight_talk', 4),
  ('b1000009-0001-0000-0000-000000000006', 'de731bc8-4cea-4189-89e7-2517504db780', 'Growth & Retention',          'st-growth',         'TrendingUp',  'straight_talk', 5),
  ('b1000009-0001-0000-0000-000000000007', 'de731bc8-4cea-4189-89e7-2517504db780', 'Technology & Systems',        'st-tech',           'Monitor',     'straight_talk', 6),
  ('b1000009-0001-0000-0000-000000000008', 'de731bc8-4cea-4189-89e7-2517504db780', 'Investment & Next Steps',     'st-investment',     'Handshake',   'straight_talk', 7);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000009-0001-0000-0000-000000000001', 'How do you manage your workshop schedule — can you see bay utilisation, technician workload, and estimated completion times at a glance?', 'text', '', 0, '[]'),
  ('b1000009-0001-0000-0000-000000000001', 'How often do jobs run over time — and what impact does that have on the rest of the day''s bookings?', 'text', '', 1, '[]'),
  ('b1000009-0001-0000-0000-000000000001', 'How do you handle walk-ins versus booked jobs — and do you lose potential customers because you can''t fit them in?', 'text', '', 2, '[]'),
  ('b1000009-0001-0000-0000-000000000001', 'How do you manage vehicle check-in, diagnosis, and job card creation — is it digital or paper-based?', 'text', '', 3, '[]'),
  ('b1000009-0001-0000-0000-000000000002', 'How do you keep customers updated during a service — do they get proactive updates, or do they call you chasing?', 'text', '', 0, '[]'),
  ('b1000009-0001-0000-0000-000000000002', 'When additional work is found during an inspection, how do you get approval — phone calls, texts, or a digital approval with photos?', 'text', '', 1, '[]'),
  ('b1000009-0001-0000-0000-000000000002', 'How do you handle service reminders — rego renewals, scheduled services, tyre rotations? Is it automated?', 'text', '', 2, '[]'),
  ('b1000009-0001-0000-0000-000000000002', 'How do you collect and manage customer reviews — and does your online reputation drive new customers?', 'text', '', 3, '[]'),
  ('b1000009-0001-0000-0000-000000000003', 'How do you manage parts inventory — do you know what''s on the shelf, what needs ordering, and when parts will arrive?', 'text', '', 0, '[]'),
  ('b1000009-0001-0000-0000-000000000003', 'How often does a job get delayed because the right part isn''t in stock — and what does that cost you in bay time?', 'text', '', 1, '[]'),
  ('b1000009-0001-0000-0000-000000000003', 'Do you track parts margins and supplier pricing — are you confident you''re buying at the best price?', 'text', '', 2, '[]'),
  ('b1000009-0001-0000-0000-000000000004', 'How quickly do quotes go out — and how many do you lose because someone else responded faster?', 'text', '', 0, '[]'),
  ('b1000009-0001-0000-0000-000000000004', 'Do you know your true profitability per job type — labour, parts, consumables? Or is it a rough estimate?', 'text', '', 1, '[]'),
  ('b1000009-0001-0000-0000-000000000004', 'How do you handle invoicing and payment — is it same-day on completion, or do invoices lag?', 'text', '', 2, '[]'),
  ('b1000009-0001-0000-0000-000000000004', 'What does your average revenue per customer look like — and are you capturing all the upsell opportunities?', 'text', '', 3, '[]'),
  ('b1000009-0001-0000-0000-000000000005', 'How do you track warranty claims and manufacturer recalls — is there a system, or does it rely on memory?', 'text', '', 0, '[]'),
  ('b1000009-0001-0000-0000-000000000005', 'How do you manage compliance documentation — technician certifications, equipment calibration, environmental requirements?', 'text', '', 1, '[]'),
  ('b1000009-0001-0000-0000-000000000006', 'What percentage of your revenue comes from repeat customers — and do you actively nurture those relationships?', 'text', '', 0, '[]'),
  ('b1000009-0001-0000-0000-000000000006', 'Do you offer service plans, fleet accounts, or loyalty programs — and is there untapped recurring revenue?', 'text', '', 1, '[]'),
  ('b1000009-0001-0000-0000-000000000006', 'Where do your new customers come from — and do you know which channel has the best lifetime value?', 'text', '', 2, '[]'),
  ('b1000009-0001-0000-0000-000000000007', 'How many systems are running your workshop — booking, job management, parts, accounting? How well do they connect?', 'text', '', 0, '[]'),
  ('b1000009-0001-0000-0000-000000000007', 'What is the biggest technology frustration in your workshop right now?', 'text', '', 1, '[]'),
  ('b1000009-0001-0000-0000-000000000008', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', '', 0, '[]'),
  ('b1000009-0001-0000-0000-000000000008', 'Who else needs to be part of this decision?', 'text', '', 1, '[]'),
  ('b1000009-0001-0000-0000-000000000008', 'What would your ideal timeline be to get started?', 'text', '', 2, '[]');

-- ============================================================
-- EVENTS & CREATIVE SERVICES (88f03544-f597-4313-a129-9895af8c3bd9)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (SELECT id FROM scoping_categories WHERE industry_id = '88f03544-f597-4313-a129-9895af8c3bd9' AND phase = 'straight_talk');
DELETE FROM scoping_categories WHERE industry_id = '88f03544-f597-4313-a129-9895af8c3bd9' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000010-0001-0000-0000-000000000001', '88f03544-f597-4313-a129-9895af8c3bd9', 'Client Acquisition & Proposals','st-client-acq',    'TrendingUp',   'straight_talk', 0),
  ('b1000010-0001-0000-0000-000000000002', '88f03544-f597-4313-a129-9895af8c3bd9', 'Project & Event Management',    'st-project-mgmt',  'CalendarClock','straight_talk', 1),
  ('b1000010-0001-0000-0000-000000000003', '88f03544-f597-4313-a129-9895af8c3bd9', 'Vendor & Supplier Coordination','st-vendor-coord',  'Users',        'straight_talk', 2),
  ('b1000010-0001-0000-0000-000000000004', '88f03544-f597-4313-a129-9895af8c3bd9', 'Creative Workflow & Assets',    'st-creative-flow', 'Palette',      'straight_talk', 3),
  ('b1000010-0001-0000-0000-000000000005', '88f03544-f597-4313-a129-9895af8c3bd9', 'Pricing, Billing & Profitability','st-billing',     'DollarSign',   'straight_talk', 4),
  ('b1000010-0001-0000-0000-000000000006', '88f03544-f597-4313-a129-9895af8c3bd9', 'Technology & Systems',          'st-tech',          'Monitor',      'straight_talk', 5),
  ('b1000010-0001-0000-0000-000000000007', '88f03544-f597-4313-a129-9895af8c3bd9', 'Investment & Next Steps',       'st-investment',    'Handshake',    'straight_talk', 6);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000010-0001-0000-0000-000000000001', 'Where do your best clients come from — referrals, social media, directories, past events? Which channel is most profitable?', 'text', '', 0, '[]'),
  ('b1000010-0001-0000-0000-000000000001', 'What does your proposal process look like — from enquiry to signed contract? How much time do you spend on proposals that don''t convert?', 'text', '', 1, '[]'),
  ('b1000010-0001-0000-0000-000000000001', 'How do you showcase your portfolio — website, social, lookbooks? Does it effectively convert browsers to enquiries?', 'text', '', 2, '[]'),
  ('b1000010-0001-0000-0000-000000000001', 'How quickly do you respond to enquiries — and are you losing bookings to faster competitors?', 'text', '', 3, '[]'),
  ('b1000010-0001-0000-0000-000000000002', 'How do you manage all the moving parts of an event or project — timelines, tasks, milestones, dependencies? Is it systematic or chaotic?', 'text', '', 0, '[]'),
  ('b1000010-0001-0000-0000-000000000002', 'On event day, how do you coordinate teams, manage run sheets, and handle last-minute changes?', 'text', '', 1, '[]'),
  ('b1000010-0001-0000-0000-000000000002', 'How do you manage client approvals and feedback loops — does the revision process eat into your margins?', 'text', '', 2, '[]'),
  ('b1000010-0001-0000-0000-000000000002', 'When you''re running multiple events or projects simultaneously, how do you prevent things from falling through the cracks?', 'text', '', 3, '[]'),
  ('b1000010-0001-0000-0000-000000000003', 'How do you manage vendor and supplier relationships — preferred lists, contracts, availability, pricing?', 'text', '', 0, '[]'),
  ('b1000010-0001-0000-0000-000000000003', 'How do you coordinate freelancers, contractors, and crew — scheduling, briefings, payments?', 'text', '', 1, '[]'),
  ('b1000010-0001-0000-0000-000000000003', 'When a vendor cancels or underperforms, how quickly can you find a replacement and communicate changes?', 'text', '', 2, '[]'),
  ('b1000010-0001-0000-0000-000000000004', 'How do you manage creative assets — files, versions, client feedback? Is everything in one place or scattered across drives and inboxes?', 'text', '', 0, '[]'),
  ('b1000010-0001-0000-0000-000000000004', 'How many revision rounds do projects typically go through — and is scope creep eating your profit on creative work?', 'text', '', 1, '[]'),
  ('b1000010-0001-0000-0000-000000000004', 'How do you present proofs and get sign-offs — email attachments, shared drives, or a proper approval workflow?', 'text', '', 2, '[]'),
  ('b1000010-0001-0000-0000-000000000005', 'Do you know your true profitability per event or project — after all vendor costs, labour, revisions, and overruns?', 'text', '', 0, '[]'),
  ('b1000010-0001-0000-0000-000000000005', 'How do you handle deposits, milestone payments, and final invoicing — is cash flow predictable or lumpy?', 'text', '', 1, '[]'),
  ('b1000010-0001-0000-0000-000000000005', 'How do you price your services — fixed fee, hourly, packages? Are you confident you''re not undercharging?', 'text', '', 2, '[]'),
  ('b1000010-0001-0000-0000-000000000006', 'How many platforms does your business run on — and what''s the biggest technology frustration?', 'text', '', 0, '[]'),
  ('b1000010-0001-0000-0000-000000000006', 'If you could have one system that managed clients, projects, vendors, and finances — would that transform your business?', 'text', '', 1, '[]'),
  ('b1000010-0001-0000-0000-000000000007', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', '', 0, '[]'),
  ('b1000010-0001-0000-0000-000000000007', 'Who else needs to be part of this decision?', 'text', '', 1, '[]'),
  ('b1000010-0001-0000-0000-000000000007', 'What would your ideal timeline be to get started?', 'text', '', 2, '[]');

-- ============================================================
-- HOME & PERSONAL SERVICES (9f15808a-9034-4eee-bcac-af59507c76ba)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (SELECT id FROM scoping_categories WHERE industry_id = '9f15808a-9034-4eee-bcac-af59507c76ba' AND phase = 'straight_talk');
DELETE FROM scoping_categories WHERE industry_id = '9f15808a-9034-4eee-bcac-af59507c76ba' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000011-0001-0000-0000-000000000001', '9f15808a-9034-4eee-bcac-af59507c76ba', 'Booking & Scheduling',       'st-booking',        'CalendarClock','straight_talk', 0),
  ('b1000011-0001-0000-0000-000000000002', '9f15808a-9034-4eee-bcac-af59507c76ba', 'Customer Experience & Comms', 'st-customer-exp',   'MessageCircle','straight_talk', 1),
  ('b1000011-0001-0000-0000-000000000003', '9f15808a-9034-4eee-bcac-af59507c76ba', 'Staff & Team Management',    'st-staff-mgmt',     'Users',        'straight_talk', 2),
  ('b1000011-0001-0000-0000-000000000004', '9f15808a-9034-4eee-bcac-af59507c76ba', 'Revenue & Pricing',          'st-revenue',        'DollarSign',   'straight_talk', 3),
  ('b1000011-0001-0000-0000-000000000005', '9f15808a-9034-4eee-bcac-af59507c76ba', 'Quality & Consistency',      'st-quality',        'ShieldCheck',  'straight_talk', 4),
  ('b1000011-0001-0000-0000-000000000006', '9f15808a-9034-4eee-bcac-af59507c76ba', 'Growth & Marketing',         'st-growth',         'TrendingUp',   'straight_talk', 5),
  ('b1000011-0001-0000-0000-000000000007', '9f15808a-9034-4eee-bcac-af59507c76ba', 'Technology & Systems',       'st-tech',           'Monitor',      'straight_talk', 6),
  ('b1000011-0001-0000-0000-000000000008', '9f15808a-9034-4eee-bcac-af59507c76ba', 'Investment & Next Steps',    'st-investment',     'Handshake',    'straight_talk', 7);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000011-0001-0000-0000-000000000001', 'How do customers book your services — phone, website, app, social? What percentage are self-service versus requiring your intervention?', 'text', '', 0, '[]'),
  ('b1000011-0001-0000-0000-000000000001', 'What''s your no-show and late-cancellation rate — and what does that cost you each month in lost revenue?', 'text', '', 1, '[]'),
  ('b1000011-0001-0000-0000-000000000001', 'How do you manage recurring bookings — weekly cleans, regular lawn care, ongoing maintenance? Is it automated?', 'text', '', 2, '[]'),
  ('b1000011-0001-0000-0000-000000000001', 'How do you optimise routes and scheduling to minimise travel time between jobs?', 'text', '', 3, '[]'),
  ('b1000011-0001-0000-0000-000000000002', 'How do you keep customers informed — job confirmations, on-my-way notifications, completion updates? Is any of it automated?', 'text', '', 0, '[]'),
  ('b1000011-0001-0000-0000-000000000002', 'After a service, do you follow up for feedback, reviews, or rebooking? What happens to that data?', 'text', '', 1, '[]'),
  ('b1000011-0001-0000-0000-000000000002', 'How do you handle customer complaints or rework requests — is there a process, or does it depend on who picks up the phone?', 'text', '', 2, '[]'),
  ('b1000011-0001-0000-0000-000000000002', 'Do customers have a way to see their service history, upcoming bookings, and invoices — or do they have to call you?', 'text', '', 3, '[]'),
  ('b1000011-0001-0000-0000-000000000003', 'How do you manage your team''s schedule, availability, and job assignments — is it centralised or ad-hoc?', 'text', '', 0, '[]'),
  ('b1000011-0001-0000-0000-000000000003', 'How do you handle last-minute staff absences or call-offs — can you quickly reassign jobs?', 'text', '', 1, '[]'),
  ('b1000011-0001-0000-0000-000000000003', 'How do you track staff performance — job completion times, customer ratings, consistency?', 'text', '', 2, '[]'),
  ('b1000011-0001-0000-0000-000000000003', 'For contractors or casual staff, how do you manage onboarding, insurance, and compliance?', 'text', '', 3, '[]'),
  ('b1000011-0001-0000-0000-000000000004', 'How do you price your services — flat rate, hourly, package deals? Are you confident your pricing covers costs and delivers margin?', 'text', '', 0, '[]'),
  ('b1000011-0001-0000-0000-000000000004', 'How quickly do invoices go out after service completion — and how much money sits in overdue accounts?', 'text', '', 1, '[]'),
  ('b1000011-0001-0000-0000-000000000004', 'Do you offer packages, bundles, or subscription services — and is there untapped recurring revenue potential?', 'text', '', 2, '[]'),
  ('b1000011-0001-0000-0000-000000000005', 'How do you ensure consistent service quality across different staff members and locations?', 'text', '', 0, '[]'),
  ('b1000011-0001-0000-0000-000000000005', 'Do you use checklists, photo documentation, or quality checks — and are they enforced systematically?', 'text', '', 1, '[]'),
  ('b1000011-0001-0000-0000-000000000005', 'How do you manage supplies and equipment across your team — do people ever turn up without what they need?', 'text', '', 2, '[]'),
  ('b1000011-0001-0000-0000-000000000006', 'Where do your new customers come from — and which channel produces the highest lifetime value?', 'text', '', 0, '[]'),
  ('b1000011-0001-0000-0000-000000000006', 'What percentage of your business is repeat versus one-off — and are you actively nurturing repeat customers?', 'text', '', 1, '[]'),
  ('b1000011-0001-0000-0000-000000000006', 'How do you manage your online presence — Google Business, social media, reviews? Is it driving growth?', 'text', '', 2, '[]'),
  ('b1000011-0001-0000-0000-000000000007', 'How many systems are running your business — and what is the biggest technology frustration?', 'text', '', 0, '[]'),
  ('b1000011-0001-0000-0000-000000000007', 'If you could have one platform for bookings, scheduling, invoicing, and customer management, would that change how you operate?', 'text', '', 1, '[]'),
  ('b1000011-0001-0000-0000-000000000008', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', '', 0, '[]'),
  ('b1000011-0001-0000-0000-000000000008', 'Who else needs to be part of this decision?', 'text', '', 1, '[]'),
  ('b1000011-0001-0000-0000-000000000008', 'What would your ideal timeline be to get started?', 'text', '', 2, '[]');
