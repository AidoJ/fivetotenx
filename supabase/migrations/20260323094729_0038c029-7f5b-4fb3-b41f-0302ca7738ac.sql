
-- ============================================================
-- STEP 1: Delete existing generic straight_talk questions & categories for Construction
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (
  SELECT id FROM scoping_categories 
  WHERE industry_id = '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f' AND phase = 'straight_talk'
);
DELETE FROM scoping_categories 
WHERE industry_id = '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f' AND phase = 'straight_talk';

-- ============================================================
-- STEP 2: Create 8 new Straight Talk categories for Construction
-- ============================================================
INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('a1000001-0000-0000-0000-000000000001', '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f', 'Site Operations',         'st-site-operations',    'HardHat',     'straight_talk', 0),
  ('a1000001-0000-0000-0000-000000000002', '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f', 'Programme & Deadlines',   'st-programme-deadlines', 'CalendarClock','straight_talk', 1),
  ('a1000001-0000-0000-0000-000000000003', '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f', 'Safety & Compliance',     'st-safety-compliance',   'ShieldCheck',  'straight_talk', 2),
  ('a1000001-0000-0000-0000-000000000004', '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f', 'Quality Control',         'st-quality-control',     'SearchCheck',  'straight_talk', 3),
  ('a1000001-0000-0000-0000-000000000005', '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f', 'Communication',           'st-communication',       'MessageCircle','straight_talk', 4),
  ('a1000001-0000-0000-0000-000000000006', '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f', 'Documentation & Admin',   'st-documentation-admin', 'FileText',     'straight_talk', 5),
  ('a1000001-0000-0000-0000-000000000007', '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f', 'Commercial Pressures',    'st-commercial-pressures','DollarSign',   'straight_talk', 6),
  ('a1000001-0000-0000-0000-000000000008', '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f', 'Technology & Systems',    'st-technology-systems',  'Monitor',      'straight_talk', 7),
  ('a1000001-0000-0000-0000-000000000009', '3109ae5d-c3d1-4550-b564-6f4b82ae6b7f', 'Investment & Next Steps', 'st-investment-closing',  'Handshake',    'straight_talk', 8);

-- ============================================================
-- STEP 3: Site Operations (5 questions)
-- ============================================================
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'How are you currently managing labour availability — do you have visibility into who is available, qualified, and where they are across your sites?', 'text', 'Explore whether they track labour digitally or rely on calls/texts', 0, '[]'),
  ('a1000001-0000-0000-0000-000000000001', 'When subcontractor coordination falls apart — clashes on site, trades turning up at the wrong time — what does that cost you in a typical month?', 'text', 'Quantify the impact of coordination failures', 1, '[]'),
  ('a1000001-0000-0000-0000-000000000001', 'How do you handle materials delivery tracking — do you know in real-time what has been delivered, what is delayed, and what the knock-on effect is?', 'text', 'Probe whether materials tracking is manual or systematic', 2, '[]'),
  ('a1000001-0000-0000-0000-000000000001', 'Walk me through how you schedule plant and equipment across sites — is there ever double-booking or idle equipment eating into your margins?', 'text', 'Uncover plant scheduling inefficiencies', 3, '[]'),
  ('a1000001-0000-0000-0000-000000000001', 'When unexpected conditions hit — weather events, ground issues, hidden services — how quickly can you adapt the programme and communicate changes to all affected parties?', 'text', 'Assess agility and communication speed in crisis', 4, '[]');

-- ============================================================
-- STEP 4: Programme & Deadlines (4 questions)
-- ============================================================
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('a1000001-0000-0000-0000-000000000002', 'How do you keep all trades aligned with the construction schedule — is everyone working from the same up-to-date programme, or do you find people working off old information?', 'text', 'Probe single source of truth for scheduling', 0, '[]'),
  ('a1000001-0000-0000-0000-000000000002', 'When one trade falls behind, how do you manage the knock-on effects — can you quickly resequence and communicate changes, or does it cascade into bigger delays?', 'text', 'Explore ripple-effect management capability', 1, '[]'),
  ('a1000001-0000-0000-0000-000000000002', 'How do you currently sequence works to balance safety, efficiency, and trade dependencies — is that in someone''s head or documented in a system?', 'text', 'Uncover whether sequencing is systematic or tribal knowledge', 2, '[]'),
  ('a1000001-0000-0000-0000-000000000002', 'When the head contractor or client pushes milestone deadlines, how do you absorb that pressure — what breaks first in your current setup?', 'text', 'Identify the weak link under deadline pressure', 3, '[]');

-- ============================================================
-- STEP 5: Safety & Compliance (5 questions)
-- ============================================================
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('a1000001-0000-0000-0000-000000000003', 'How confident are you that WHS compliance is being maintained consistently across all your sites right now — or is it a best-effort situation?', 'text', 'Gauge real vs aspirational compliance', 0, '[]'),
  ('a1000001-0000-0000-0000-000000000003', 'Walk me through how you manage site inductions and toolbox talks — is the documentation current and easy to audit, or is it a scramble when an inspector arrives?', 'text', 'Explore induction/toolbox talk admin burden', 1, '[]'),
  ('a1000001-0000-0000-0000-000000000003', 'For high-risk activities — working at heights, confined spaces, hot works — how do you monitor and sign off that all controls are in place before work starts?', 'text', 'Probe high-risk work controls', 2, '[]'),
  ('a1000001-0000-0000-0000-000000000003', 'Is PPE compliance something you actively monitor or more of an honour system? How would you know right now if someone on Site B isn''t wearing the right gear?', 'text', 'Assess PPE monitoring capability', 3, '[]'),
  ('a1000001-0000-0000-0000-000000000003', 'When incidents or near-misses happen, how quickly do they get reported and investigated — and do you see patterns that help you prevent the next one?', 'text', 'Explore incident reporting maturity', 4, '[]');

-- ============================================================
-- STEP 6: Quality Control (4 questions)
-- ============================================================
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('a1000001-0000-0000-0000-000000000004', 'How do you ensure works meet specifications — is there a systematic check at each stage, or does it rely on the foreman''s eye and experience?', 'text', 'Probe systematic vs ad-hoc quality checking', 0, '[]'),
  ('a1000001-0000-0000-0000-000000000004', 'When defects are found, how early in the process are you catching them — and what does rework from incorrect installs typically cost you per project?', 'text', 'Quantify defect/rework cost', 1, '[]'),
  ('a1000001-0000-0000-0000-000000000004', 'How do you manage the rework cycle — from identifying the issue, to getting the responsible trade back, to sign-off? Is that tracked or does it fall through the cracks?', 'text', 'Explore rework tracking and accountability', 2, '[]'),
  ('a1000001-0000-0000-0000-000000000004', 'How are inspections and hold points coordinated — do you ever miss inspection windows or have trades waiting idle because an inspection hasn''t been booked?', 'text', 'Uncover inspection coordination pain', 3, '[]');

-- ============================================================
-- STEP 7: Communication (4 questions)
-- ============================================================
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('a1000001-0000-0000-0000-000000000005', 'When drawings or specifications get updated, how quickly does that information reach the crews on the ground — and have you ever had work done to superseded drawings?', 'text', 'Probe drawing version control on site', 0, '[]'),
  ('a1000001-0000-0000-0000-000000000005', 'How do you manage RFIs between engineers, architects, and trades — is there a clear trail, or do things get lost in email chains and phone calls?', 'text', 'Explore RFI tracking and accountability', 1, '[]'),
  ('a1000001-0000-0000-0000-000000000005', 'When it comes to managing client expectations on site — progress updates, issue escalation, decision requests — how does that communication flow and how often does it cause friction?', 'text', 'Assess client communication pain points', 2, '[]'),
  ('a1000001-0000-0000-0000-000000000005', 'How well connected are your office and field teams — can your project managers see what''s happening on site in real-time, or do they rely on end-of-day reports and phone calls?', 'text', 'Probe office-field information gap', 3, '[]');

-- ============================================================
-- STEP 8: Documentation & Admin (5 questions)
-- ============================================================
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('a1000001-0000-0000-0000-000000000006', 'How much time does your team spend on daily site diaries and reporting — is it quick and digital, or is someone spending an hour at the end of each day writing things up?', 'text', 'Quantify admin time on site diaries', 0, '[]'),
  ('a1000001-0000-0000-0000-000000000006', 'How do you manage SWMS — tracking versions, getting sign-offs, ensuring the right ones are on the right sites? Could you pull up the current SWMS for any task in under a minute?', 'text', 'Assess SWMS management maturity', 1, '[]'),
  ('a1000001-0000-0000-0000-000000000006', 'When deliveries arrive on site, how do you verify and document them — is there a system that matches dockets to purchase orders, or is it paper and hope?', 'text', 'Explore delivery verification process', 2, '[]'),
  ('a1000001-0000-0000-0000-000000000006', 'How do you track variations as they happen on site — from the moment a change is identified to getting it approved and priced? Do any fall through the cracks?', 'text', 'Probe variation capture and tracking', 3, '[]'),
  ('a1000001-0000-0000-0000-000000000006', 'Walk me through your permit management — council permits, work permits, hot work permits — how do you ensure nothing expires or gets missed across multiple sites?', 'text', 'Assess permit management complexity', 4, '[]');

-- ============================================================
-- STEP 9: Commercial Pressures (4 questions)
-- ============================================================
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('a1000001-0000-0000-0000-000000000007', 'How often do variations become disputes because they weren''t captured or communicated early enough — and what does that typically cost you in time and money?', 'text', 'Quantify variation-to-dispute cost', 0, '[]'),
  ('a1000001-0000-0000-0000-000000000007', 'Can you see in real-time how actual labour costs compare to budget on any given project — or is that something you only discover at the end?', 'text', 'Probe real-time cost visibility', 1, '[]'),
  ('a1000001-0000-0000-0000-000000000007', 'Where is money leaking on your projects right now — wasted materials, idle time, double-handling, downtime between trades? What keeps you up at night?', 'text', 'Open-ended margin erosion discovery', 2, '[]'),
  ('a1000001-0000-0000-0000-000000000007', 'How do you protect your contractor margin on site — do you have the data and controls in place to catch overruns before they blow out, or is it more reactive?', 'text', 'Assess proactive vs reactive cost management', 3, '[]');

-- ============================================================
-- STEP 10: Technology & Systems (4 questions)
-- ============================================================
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('a1000001-0000-0000-0000-000000000008', 'When someone on site needs the latest drawing, how do they access it — is it always current, always available, or do they sometimes work off PDFs saved weeks ago?', 'text', 'Probe digital drawing access and currency', 0, '[]'),
  ('a1000001-0000-0000-0000-000000000008', 'How many different software platforms is your team using across the business — and how well do they talk to each other? Is data being entered in multiple places?', 'text', 'Uncover platform fragmentation', 1, '[]'),
  ('a1000001-0000-0000-0000-000000000008', 'How accurately are you capturing progress data from site — do you trust the numbers you''re seeing, or is there a gap between what''s reported and what''s actually happening?', 'text', 'Assess data accuracy and trust', 2, '[]'),
  ('a1000001-0000-0000-0000-000000000008', 'Be honest — when you roll out a new app or system, how well does your team actually adopt it? What''s the biggest barrier to getting your crews to use technology consistently?', 'text', 'Explore adoption challenges', 3, '[]');

-- ============================================================
-- STEP 11: Investment & Closing (3 questions — retained from generic)
-- ============================================================
INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('a1000001-0000-0000-0000-000000000009', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', 'Gauge budget readiness', 0, '[]'),
  ('a1000001-0000-0000-0000-000000000009', 'Who else in your organisation needs to be part of this decision — and what would they need to see to say yes?', 'text', 'Identify decision-makers and blockers', 1, '[]'),
  ('a1000001-0000-0000-0000-000000000009', 'If we could show you a solution that addresses the top issues we''ve discussed today, what would your ideal timeline be to get started?', 'text', 'Close with timeline and urgency', 2, '[]');
