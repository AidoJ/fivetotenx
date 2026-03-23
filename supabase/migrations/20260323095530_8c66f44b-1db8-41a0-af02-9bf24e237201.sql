
-- ============================================================
-- PROFESSIONAL SERVICES (6260847a-1bd1-4b26-ba12-bc8e66879f28)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (SELECT id FROM scoping_categories WHERE industry_id = '6260847a-1bd1-4b26-ba12-bc8e66879f28' AND phase = 'straight_talk');
DELETE FROM scoping_categories WHERE industry_id = '6260847a-1bd1-4b26-ba12-bc8e66879f28' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000003-0001-0000-0000-000000000001', '6260847a-1bd1-4b26-ba12-bc8e66879f28', 'Client Acquisition & Pipeline',  'st-client-pipeline',  'TrendingUp',   'straight_talk', 0),
  ('b1000003-0001-0000-0000-000000000002', '6260847a-1bd1-4b26-ba12-bc8e66879f28', 'Service Delivery & Workflow',    'st-delivery-workflow', 'Workflow',      'straight_talk', 1),
  ('b1000003-0001-0000-0000-000000000003', '6260847a-1bd1-4b26-ba12-bc8e66879f28', 'Client Communication & Retention','st-client-comms',     'MessageCircle', 'straight_talk', 2),
  ('b1000003-0001-0000-0000-000000000004', '6260847a-1bd1-4b26-ba12-bc8e66879f28', 'Billing, Time & Cash Flow',      'st-billing-cashflow', 'DollarSign',    'straight_talk', 3),
  ('b1000003-0001-0000-0000-000000000005', '6260847a-1bd1-4b26-ba12-bc8e66879f28', 'Team & Resource Management',     'st-team-resources',   'Users',         'straight_talk', 4),
  ('b1000003-0001-0000-0000-000000000006', '6260847a-1bd1-4b26-ba12-bc8e66879f28', 'Compliance & Documentation',     'st-compliance-docs',  'ShieldCheck',   'straight_talk', 5),
  ('b1000003-0001-0000-0000-000000000007', '6260847a-1bd1-4b26-ba12-bc8e66879f28', 'Technology & Systems',           'st-tech-systems',     'Monitor',       'straight_talk', 6),
  ('b1000003-0001-0000-0000-000000000008', '6260847a-1bd1-4b26-ba12-bc8e66879f28', 'Investment & Next Steps',        'st-investment',       'Handshake',     'straight_talk', 7);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000003-0001-0000-0000-000000000001', 'Where do your best clients come from — referrals, organic search, networking, partnerships? Do you know which channel has the highest lifetime value?', 'text', 'Map lead source quality', 0, '[]'),
  ('b1000003-0001-0000-0000-000000000001', 'What does your sales pipeline look like — from initial enquiry to signed engagement? Where do prospects stall or drop off?', 'text', 'Probe pipeline conversion', 1, '[]'),
  ('b1000003-0001-0000-0000-000000000001', 'How do you nurture leads that aren''t ready to engage yet — is there a system for staying top-of-mind, or do they just go cold?', 'text', 'Assess lead nurture capability', 2, '[]'),
  ('b1000003-0001-0000-0000-000000000001', 'What is your current proposal-to-close ratio — and how much time does your team spend on proposals that don''t convert?', 'text', 'Quantify proposal waste', 3, '[]'),
  ('b1000003-0001-0000-0000-000000000002', 'Once a client engages, how do you manage the delivery workflow — is there a standardised process, or does every engagement run differently?', 'text', 'Probe delivery standardisation', 0, '[]'),
  ('b1000003-0001-0000-0000-000000000002', 'How do you track project milestones and deliverables — can you see at a glance which projects are on track and which are at risk?', 'text', 'Assess project visibility', 1, '[]'),
  ('b1000003-0001-0000-0000-000000000002', 'When scope creep happens — and it always does — how do you manage it? Does extra work get captured and billed, or absorbed?', 'text', 'Explore scope creep management', 2, '[]'),
  ('b1000003-0001-0000-0000-000000000002', 'How do you handle handoffs between team members on a project — is context lost, or is everything documented and accessible?', 'text', 'Probe knowledge transfer', 3, '[]'),
  ('b1000003-0001-0000-0000-000000000003', 'How do clients currently access project updates, documents, and deliverables — email attachments, shared drives, or a proper client portal?', 'text', 'Assess client-facing experience', 0, '[]'),
  ('b1000003-0001-0000-0000-000000000003', 'What does your client retention look like — do most clients come back for repeat engagements, or is each one a new sale?', 'text', 'Probe retention rate', 1, '[]'),
  ('b1000003-0001-0000-0000-000000000003', 'How do you proactively identify additional services a client might need — or do you wait for them to ask?', 'text', 'Explore cross-sell/upsell capability', 2, '[]'),
  ('b1000003-0001-0000-0000-000000000003', 'When a client relationship starts to go sideways — missed expectations, delayed responses — how early do you catch it?', 'text', 'Assess early warning systems', 3, '[]'),
  ('b1000003-0001-0000-0000-000000000004', 'How do you track time across engagements — are your teams diligent about time tracking, or is there significant leakage?', 'text', 'Probe time tracking accuracy', 0, '[]'),
  ('b1000003-0001-0000-0000-000000000004', 'What''s your average time from completing work to issuing an invoice — and from invoice to payment? Where does the delay sit?', 'text', 'Quantify billing cycle delays', 1, '[]'),
  ('b1000003-0001-0000-0000-000000000004', 'Do you have real-time visibility into project profitability — can you tell mid-engagement whether you''re making or losing money?', 'text', 'Assess real-time profitability visibility', 2, '[]'),
  ('b1000003-0001-0000-0000-000000000004', 'How do you handle retainers, recurring billings, or milestone-based payments — is it automated or manual?', 'text', 'Explore billing model complexity', 3, '[]'),
  ('b1000003-0001-0000-0000-000000000005', 'How do you allocate team members to projects — is there a resource planning system, or does it come down to who''s available?', 'text', 'Probe resource allocation', 0, '[]'),
  ('b1000003-0001-0000-0000-000000000005', 'Can you see at a glance who is over-utilised and who has capacity — or do you find out when someone burns out or a deadline is missed?', 'text', 'Assess utilisation visibility', 1, '[]'),
  ('b1000003-0001-0000-0000-000000000005', 'How do you manage knowledge sharing within your team — is expertise documented, or does it walk out the door when someone leaves?', 'text', 'Explore knowledge management', 2, '[]'),
  ('b1000003-0001-0000-0000-000000000006', 'What compliance or regulatory requirements does your practice need to maintain — and how confident are you in passing an audit today?', 'text', 'Gauge compliance confidence', 0, '[]'),
  ('b1000003-0001-0000-0000-000000000006', 'How do you manage client documents — engagement letters, contracts, NDAs — is versioning and storage centralised and secure?', 'text', 'Assess document management', 1, '[]'),
  ('b1000003-0001-0000-0000-000000000006', 'Do you have clear audit trails for client communications and decisions — could you reconstruct the history of any engagement?', 'text', 'Probe audit trail capability', 2, '[]'),
  ('b1000003-0001-0000-0000-000000000007', 'How many systems does your team use daily — and what percentage of their time goes to switching between them or re-entering data?', 'text', 'Uncover platform fragmentation', 0, '[]'),
  ('b1000003-0001-0000-0000-000000000007', 'If you could have one integrated view of your practice — pipeline, projects, team utilisation, profitability — would that change how you make decisions?', 'text', 'Explore desire for unified platform', 1, '[]'),
  ('b1000003-0001-0000-0000-000000000007', 'What is the biggest technology pain point in your practice right now?', 'text', 'Open-ended tech pain discovery', 2, '[]'),
  ('b1000003-0001-0000-0000-000000000008', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', 'Gauge budget readiness', 0, '[]'),
  ('b1000003-0001-0000-0000-000000000008', 'Who else needs to be part of this decision — and what would they need to see to say yes?', 'text', 'Identify decision-makers', 1, '[]'),
  ('b1000003-0001-0000-0000-000000000008', 'If we could show you a solution that addresses the top issues we''ve discussed today, what would your ideal timeline be to get started?', 'text', 'Close with timeline', 2, '[]');


-- ============================================================
-- HOSPITALITY & TOURISM (141d12d8-8f5c-4a5d-a698-aa1c5d946837)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (SELECT id FROM scoping_categories WHERE industry_id = '141d12d8-8f5c-4a5d-a698-aa1c5d946837' AND phase = 'straight_talk');
DELETE FROM scoping_categories WHERE industry_id = '141d12d8-8f5c-4a5d-a698-aa1c5d946837' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000004-0001-0000-0000-000000000001', '141d12d8-8f5c-4a5d-a698-aa1c5d946837', 'Guest Experience & Bookings',    'st-guest-bookings',   'CalendarClock','straight_talk', 0),
  ('b1000004-0001-0000-0000-000000000002', '141d12d8-8f5c-4a5d-a698-aa1c5d946837', 'Operations & Service Delivery',  'st-operations',       'Settings',     'straight_talk', 1),
  ('b1000004-0001-0000-0000-000000000003', '141d12d8-8f5c-4a5d-a698-aa1c5d946837', 'Staffing & Rostering',           'st-staffing',         'Users',        'straight_talk', 2),
  ('b1000004-0001-0000-0000-000000000004', '141d12d8-8f5c-4a5d-a698-aa1c5d946837', 'Revenue & Yield Management',     'st-revenue-yield',    'DollarSign',   'straight_talk', 3),
  ('b1000004-0001-0000-0000-000000000005', '141d12d8-8f5c-4a5d-a698-aa1c5d946837', 'Marketing & Reviews',            'st-marketing-reviews','Star',         'straight_talk', 4),
  ('b1000004-0001-0000-0000-000000000006', '141d12d8-8f5c-4a5d-a698-aa1c5d946837', 'Compliance & Safety',            'st-compliance',       'ShieldCheck',  'straight_talk', 5),
  ('b1000004-0001-0000-0000-000000000007', '141d12d8-8f5c-4a5d-a698-aa1c5d946837', 'Technology & Systems',           'st-tech-systems',     'Monitor',      'straight_talk', 6),
  ('b1000004-0001-0000-0000-000000000008', '141d12d8-8f5c-4a5d-a698-aa1c5d946837', 'Investment & Next Steps',        'st-investment',       'Handshake',    'straight_talk', 7);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000004-0001-0000-0000-000000000001', 'Walk me through how a guest books with you today — from finding you online to confirming their stay/experience. Where do bookings get lost?', 'text', 'Map the booking journey and drop-offs', 0, '[]'),
  ('b1000004-0001-0000-0000-000000000001', 'What percentage of your bookings come through OTAs versus direct — and what does that commission cost you annually?', 'text', 'Quantify OTA dependency cost', 1, '[]'),
  ('b1000004-0001-0000-0000-000000000001', 'How do you handle cancellations and no-shows — can you backfill quickly, or does that capacity just go to waste?', 'text', 'Probe cancellation recovery', 2, '[]'),
  ('b1000004-0001-0000-0000-000000000001', 'What does the pre-arrival experience look like — do guests receive personalised communications, or is it a generic confirmation email?', 'text', 'Assess pre-arrival personalisation', 3, '[]'),
  ('b1000004-0001-0000-0000-000000000002', 'How do you manage daily operations — housekeeping schedules, maintenance requests, F&B prep? Is it coordinated digitally or verbally?', 'text', 'Probe operational coordination', 0, '[]'),
  ('b1000004-0001-0000-0000-000000000002', 'When a guest has a special request or complaint during their stay, how quickly does it get to the right person — and how do you track resolution?', 'text', 'Assess guest request handling', 1, '[]'),
  ('b1000004-0001-0000-0000-000000000002', 'How do you manage inventory — room availability, tour capacity, restaurant covers? Can you see availability across all channels in real-time?', 'text', 'Probe inventory synchronisation', 2, '[]'),
  ('b1000004-0001-0000-0000-000000000002', 'For food and beverage — how do you manage supplier orders, stock levels, and menu costing? Is there wastage you can''t currently track?', 'text', 'Explore F&B cost management', 3, '[]'),
  ('b1000004-0001-0000-0000-000000000003', 'How do you build rosters — is it hours of manual work each week, and how often do you deal with last-minute call-offs?', 'text', 'Quantify rostering pain', 0, '[]'),
  ('b1000004-0001-0000-0000-000000000003', 'What''s your staff turnover like — and how much does it cost you each time you have to recruit and train someone new?', 'text', 'Probe turnover cost', 1, '[]'),
  ('b1000004-0001-0000-0000-000000000003', 'How do you manage casual and seasonal staff — availability, compliance, training records? Is it a logistical headache?', 'text', 'Assess casual/seasonal workforce management', 2, '[]'),
  ('b1000004-0001-0000-0000-000000000003', 'Do your staff have mobile access to schedules, task lists, and guest information — or are they relying on printouts and verbal briefings?', 'text', 'Probe staff digital access', 3, '[]'),
  ('b1000004-0001-0000-0000-000000000004', 'Do you use dynamic pricing or yield management — adjusting rates based on demand, seasonality, and competitor pricing?', 'text', 'Assess pricing sophistication', 0, '[]'),
  ('b1000004-0001-0000-0000-000000000004', 'How do you track revenue per available room/cover/tour — and do you know which products, packages, or upsells drive the most profit?', 'text', 'Probe revenue metrics granularity', 1, '[]'),
  ('b1000004-0001-0000-0000-000000000004', 'What does your upselling look like — do you capture opportunities for upgrades, add-ons, and experiences at every touchpoint?', 'text', 'Explore upsell capture', 2, '[]'),
  ('b1000004-0001-0000-0000-000000000004', 'How quickly do you reconcile payments across channels — cash, card, OTA payouts — and is that a manual headache?', 'text', 'Assess payment reconciliation', 3, '[]'),
  ('b1000004-0001-0000-0000-000000000005', 'How do you manage your online reputation — TripAdvisor, Google, Booking.com reviews — and how quickly do you respond?', 'text', 'Probe reputation management', 0, '[]'),
  ('b1000004-0001-0000-0000-000000000005', 'What does your repeat guest strategy look like — loyalty programs, personalised offers, post-stay engagement?', 'text', 'Assess guest retention strategy', 1, '[]'),
  ('b1000004-0001-0000-0000-000000000005', 'How do you capture and use guest data — preferences, dietary requirements, special occasions — to personalise their next visit?', 'text', 'Explore guest data utilisation', 2, '[]'),
  ('b1000004-0001-0000-0000-000000000006', 'How do you manage food safety, liquor licensing, fire safety, and other compliance requirements — is it audit-ready or a scramble?', 'text', 'Gauge compliance readiness', 0, '[]'),
  ('b1000004-0001-0000-0000-000000000006', 'How do you track maintenance schedules for equipment, pool safety, fire systems — is it preventative or reactive?', 'text', 'Probe maintenance management', 1, '[]'),
  ('b1000004-0001-0000-0000-000000000007', 'How many different systems are running your operation — PMS, POS, channel manager, accounting, marketing? How well do they integrate?', 'text', 'Uncover system fragmentation', 0, '[]'),
  ('b1000004-0001-0000-0000-000000000007', 'What''s the one report or dashboard you wish you could see every morning but currently can''t?', 'text', 'Open-ended data wish', 1, '[]'),
  ('b1000004-0001-0000-0000-000000000007', 'What is the biggest technology frustration in your operation right now?', 'text', 'Open-ended tech pain', 2, '[]'),
  ('b1000004-0001-0000-0000-000000000008', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', 'Gauge budget readiness', 0, '[]'),
  ('b1000004-0001-0000-0000-000000000008', 'Who else needs to be part of this decision — and what would they need to see to say yes?', 'text', 'Identify decision-makers', 1, '[]'),
  ('b1000004-0001-0000-0000-000000000008', 'What would your ideal timeline be to get started?', 'text', 'Close with timeline', 2, '[]');


-- ============================================================
-- FITNESS & RECREATION (797e24c1-f4d1-4cdc-9c43-18bfed1f22bc)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (SELECT id FROM scoping_categories WHERE industry_id = '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc' AND phase = 'straight_talk');
DELETE FROM scoping_categories WHERE industry_id = '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000005-0001-0000-0000-000000000001', '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc', 'Membership & Retention',     'st-membership',       'Users',        'straight_talk', 0),
  ('b1000005-0001-0000-0000-000000000002', '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc', 'Class & Session Management',  'st-class-sessions',   'CalendarClock','straight_talk', 1),
  ('b1000005-0001-0000-0000-000000000003', '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc', 'Staff & Trainer Operations',  'st-trainer-ops',      'UserCheck',    'straight_talk', 2),
  ('b1000005-0001-0000-0000-000000000004', '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc', 'Revenue & Growth',            'st-revenue-growth',   'DollarSign',   'straight_talk', 3),
  ('b1000005-0001-0000-0000-000000000005', '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc', 'Facility & Equipment',        'st-facility',         'Settings',     'straight_talk', 4),
  ('b1000005-0001-0000-0000-000000000006', '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc', 'Member Engagement & Comms',   'st-member-comms',     'MessageCircle','straight_talk', 5),
  ('b1000005-0001-0000-0000-000000000007', '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc', 'Technology & Systems',        'st-tech-systems',     'Monitor',      'straight_talk', 6),
  ('b1000005-0001-0000-0000-000000000008', '797e24c1-f4d1-4cdc-9c43-18bfed1f22bc', 'Investment & Next Steps',     'st-investment',       'Handshake',    'straight_talk', 7);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000005-0001-0000-0000-000000000001', 'What does your member churn look like — how many members leave each month, and do you know the real reasons why?', 'text', 'Probe retention metrics', 0, '[]'),
  ('b1000005-0001-0000-0000-000000000001', 'How do you identify at-risk members before they cancel — declining attendance, payment issues — and what do you do about it?', 'text', 'Assess at-risk member detection', 1, '[]'),
  ('b1000005-0001-0000-0000-000000000001', 'Walk me through your new member onboarding — from sign-up to their fourth visit. What percentage actually become regulars?', 'text', 'Map onboarding to habit formation', 2, '[]'),
  ('b1000005-0001-0000-0000-000000000001', 'How do you handle membership freezes, downgrades, and cancellations — is it a frictionless process that protects your revenue?', 'text', 'Explore membership lifecycle management', 3, '[]'),
  ('b1000005-0001-0000-0000-000000000002', 'How do you manage class schedules, capacity limits, and waitlists — can members self-manage their bookings easily?', 'text', 'Probe class management', 0, '[]'),
  ('b1000005-0001-0000-0000-000000000002', 'What''s your class utilisation rate — are popular sessions overflowing while others sit half-empty? How do you optimise?', 'text', 'Assess class optimisation', 1, '[]'),
  ('b1000005-0001-0000-0000-000000000002', 'How do you handle recurring bookings, late cancellations, and no-shows for classes and PT sessions?', 'text', 'Explore no-show/cancellation management', 2, '[]'),
  ('b1000005-0001-0000-0000-000000000002', 'For personal training — how do trainers manage their client bookings, program tracking, and progress notes?', 'text', 'Probe PT management workflow', 3, '[]'),
  ('b1000005-0001-0000-0000-000000000003', 'How do you build trainer/instructor rosters — and how do you handle substitutions, leave, and availability changes?', 'text', 'Assess rostering complexity', 0, '[]'),
  ('b1000005-0001-0000-0000-000000000003', 'Do you track trainer performance — member retention of their clients, revenue generated, satisfaction scores?', 'text', 'Probe trainer performance tracking', 1, '[]'),
  ('b1000005-0001-0000-0000-000000000003', 'How do you manage trainer certifications, first aid, and CPD requirements — is it tracked centrally?', 'text', 'Assess compliance tracking', 2, '[]'),
  ('b1000005-0001-0000-0000-000000000004', 'Beyond memberships, what other revenue streams do you have — PT, retail, supplements, events, corporate? How much untapped potential is there?', 'text', 'Explore revenue diversification', 0, '[]'),
  ('b1000005-0001-0000-0000-000000000004', 'How do you currently acquire new members — referral programs, social media, walk-ins, corporate partnerships? Which has the best ROI?', 'text', 'Map acquisition channels', 1, '[]'),
  ('b1000005-0001-0000-0000-000000000004', 'Do you have visibility into your revenue per member, cost per acquisition, and lifetime value — or are you flying blind?', 'text', 'Assess financial metrics awareness', 2, '[]'),
  ('b1000005-0001-0000-0000-000000000004', 'How do you handle billing — failed payments, overdue accounts, payment plan flexibility? How much revenue slips through?', 'text', 'Probe billing recovery', 3, '[]'),
  ('b1000005-0001-0000-0000-000000000005', 'How do you manage equipment maintenance — preventative schedules, breakdown reporting, replacement planning?', 'text', 'Probe equipment management', 0, '[]'),
  ('b1000005-0001-0000-0000-000000000005', 'Do you track facility usage patterns — peak times, quiet periods — and use that data to optimise staffing and programming?', 'text', 'Assess usage analytics', 1, '[]'),
  ('b1000005-0001-0000-0000-000000000006', 'How do you communicate with members — app notifications, email, SMS, social? Do you segment communications based on behaviour?', 'text', 'Explore communication sophistication', 0, '[]'),
  ('b1000005-0001-0000-0000-000000000006', 'Do you run challenges, events, or community initiatives to boost engagement — and can you measure their impact on retention?', 'text', 'Probe engagement programs', 1, '[]'),
  ('b1000005-0001-0000-0000-000000000006', 'How do you collect and act on member feedback — NPS, surveys, suggestion boxes? Does it drive real changes?', 'text', 'Assess feedback loops', 2, '[]'),
  ('b1000005-0001-0000-0000-000000000007', 'How many systems are running your business — access control, POS, booking, CRM, billing? How well do they integrate?', 'text', 'Uncover system fragmentation', 0, '[]'),
  ('b1000005-0001-0000-0000-000000000007', 'Do your members have a mobile app experience — bookings, progress tracking, social features? How does it compare to competitors?', 'text', 'Assess member digital experience', 1, '[]'),
  ('b1000005-0001-0000-0000-000000000007', 'What is the biggest technology frustration in your business right now?', 'text', 'Open-ended tech pain', 2, '[]'),
  ('b1000005-0001-0000-0000-000000000008', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', 'Gauge budget readiness', 0, '[]'),
  ('b1000005-0001-0000-0000-000000000008', 'Who else needs to be part of this decision — and what would they need to see to say yes?', 'text', 'Identify decision-makers', 1, '[]'),
  ('b1000005-0001-0000-0000-000000000008', 'What would your ideal timeline be to get started?', 'text', 'Close with timeline', 2, '[]');


-- ============================================================
-- RETAIL & E-COMMERCE (37bd4832-8a3f-4c14-9322-a09308dccbe1)
-- ============================================================
DELETE FROM scoping_questions WHERE category_id IN (SELECT id FROM scoping_categories WHERE industry_id = '37bd4832-8a3f-4c14-9322-a09308dccbe1' AND phase = 'straight_talk');
DELETE FROM scoping_categories WHERE industry_id = '37bd4832-8a3f-4c14-9322-a09308dccbe1' AND phase = 'straight_talk';

INSERT INTO scoping_categories (id, industry_id, label, slug, icon, phase, sort_order) VALUES
  ('b1000006-0001-0000-0000-000000000001', '37bd4832-8a3f-4c14-9322-a09308dccbe1', 'Customer Acquisition & Conversion','st-customer-conv',  'TrendingUp',   'straight_talk', 0),
  ('b1000006-0001-0000-0000-000000000002', '37bd4832-8a3f-4c14-9322-a09308dccbe1', 'Inventory & Supply Chain',         'st-inventory',      'Package',      'straight_talk', 1),
  ('b1000006-0001-0000-0000-000000000003', '37bd4832-8a3f-4c14-9322-a09308dccbe1', 'Omnichannel Operations',           'st-omnichannel',    'Globe',        'straight_talk', 2),
  ('b1000006-0001-0000-0000-000000000004', '37bd4832-8a3f-4c14-9322-a09308dccbe1', 'Customer Retention & Loyalty',     'st-retention',      'Heart',        'straight_talk', 3),
  ('b1000006-0001-0000-0000-000000000005', '37bd4832-8a3f-4c14-9322-a09308dccbe1', 'Pricing & Margins',               'st-pricing-margins','DollarSign',   'straight_talk', 4),
  ('b1000006-0001-0000-0000-000000000006', '37bd4832-8a3f-4c14-9322-a09308dccbe1', 'Fulfilment & Logistics',          'st-fulfilment',     'Truck',        'straight_talk', 5),
  ('b1000006-0001-0000-0000-000000000007', '37bd4832-8a3f-4c14-9322-a09308dccbe1', 'Technology & Data',               'st-tech-data',      'Monitor',      'straight_talk', 6),
  ('b1000006-0001-0000-0000-000000000008', '37bd4832-8a3f-4c14-9322-a09308dccbe1', 'Investment & Next Steps',         'st-investment',     'Handshake',    'straight_talk', 7);

INSERT INTO scoping_questions (category_id, question, question_type, detail_prompt, sort_order, options) VALUES
  ('b1000006-0001-0000-0000-000000000001', 'Where do your customers find you — organic search, social, paid ads, marketplaces, foot traffic? Which channel has the best conversion rate and customer value?', 'text', 'Map acquisition channels', 0, '[]'),
  ('b1000006-0001-0000-0000-000000000001', 'What does your website/store conversion rate look like — and what do you think is causing people to browse but not buy?', 'text', 'Probe conversion barriers', 1, '[]'),
  ('b1000006-0001-0000-0000-000000000001', 'How do you handle abandoned carts — is there automated recovery, or is that revenue just walking away?', 'text', 'Assess cart recovery', 2, '[]'),
  ('b1000006-0001-0000-0000-000000000001', 'What does your customer acquisition cost look like across channels — and are you confident you''re spending in the right places?', 'text', 'Quantify CAC awareness', 3, '[]'),
  ('b1000006-0001-0000-0000-000000000002', 'How do you manage inventory levels — do you have real-time visibility, or do you discover stock issues when a customer tries to order?', 'text', 'Probe inventory visibility', 0, '[]'),
  ('b1000006-0001-0000-0000-000000000002', 'What does your stock forecasting look like — can you predict demand based on trends and seasonality, or is it gut feel?', 'text', 'Assess demand forecasting', 1, '[]'),
  ('b1000006-0001-0000-0000-000000000002', 'How do you manage supplier relationships — lead times, minimum orders, price negotiations? Is there waste from overordering or stockouts?', 'text', 'Explore supplier management', 2, '[]'),
  ('b1000006-0001-0000-0000-000000000002', 'For perishable or seasonal stock, how do you manage markdowns and clearance — is it data-driven or reactive?', 'text', 'Probe markdown strategy', 3, '[]'),
  ('b1000006-0001-0000-0000-000000000003', 'If you sell online and in-store, how well synchronised is inventory, pricing, and promotions across channels?', 'text', 'Assess omnichannel sync', 0, '[]'),
  ('b1000006-0001-0000-0000-000000000003', 'Can customers buy online and pick up in-store, return across channels, or see store-specific stock? How seamless is the experience?', 'text', 'Probe cross-channel capability', 1, '[]'),
  ('b1000006-0001-0000-0000-000000000003', 'Do you sell on marketplaces like Amazon, eBay, or Etsy — and how do you manage listings, pricing, and orders across them?', 'text', 'Explore marketplace management', 2, '[]'),
  ('b1000006-0001-0000-0000-000000000004', 'What percentage of your revenue comes from repeat customers — and what are you doing to increase that?', 'text', 'Assess repeat purchase rate', 0, '[]'),
  ('b1000006-0001-0000-0000-000000000004', 'Do you have a loyalty or rewards program — and does it actually drive behaviour, or is it just giving discounts to people who would buy anyway?', 'text', 'Probe loyalty program effectiveness', 1, '[]'),
  ('b1000006-0001-0000-0000-000000000004', 'How do you re-engage lapsed customers — automated email sequences, personalised offers, or nothing at all?', 'text', 'Assess re-engagement strategy', 2, '[]'),
  ('b1000006-0001-0000-0000-000000000004', 'How do you collect and use customer reviews — and what impact does your online reputation have on sales?', 'text', 'Explore review strategy', 3, '[]'),
  ('b1000006-0001-0000-0000-000000000005', 'How do you set and adjust pricing — competitor monitoring, margin targets, dynamic pricing? How much margin are you leaving on the table?', 'text', 'Probe pricing strategy', 0, '[]'),
  ('b1000006-0001-0000-0000-000000000005', 'Do you know your true margin per product after all costs — shipping, returns, marketing, payment fees? Or is it an estimate?', 'text', 'Assess margin accuracy', 1, '[]'),
  ('b1000006-0001-0000-0000-000000000005', 'How do you manage promotions and discounts — are they strategic and measured, or reactive and eroding your margins?', 'text', 'Explore promotion discipline', 2, '[]'),
  ('b1000006-0001-0000-0000-000000000006', 'How do you handle order fulfilment — in-house, 3PL, dropship? Where do delays or errors creep in?', 'text', 'Probe fulfilment process', 0, '[]'),
  ('b1000006-0001-0000-0000-000000000006', 'What does your returns process look like — is it smooth for the customer and efficient for you, or a headache on both sides?', 'text', 'Assess returns management', 1, '[]'),
  ('b1000006-0001-0000-0000-000000000006', 'How do you handle shipping — rate negotiation, carrier selection, tracking updates? Are customers satisfied with delivery speed?', 'text', 'Explore shipping management', 2, '[]'),
  ('b1000006-0001-0000-0000-000000000007', 'How many platforms does your business run on — e-commerce, POS, accounting, marketing, inventory? How well do they connect?', 'text', 'Uncover system fragmentation', 0, '[]'),
  ('b1000006-0001-0000-0000-000000000007', 'Do you have a single customer view — purchase history, preferences, behaviour across channels — or is data siloed?', 'text', 'Assess customer data unification', 1, '[]'),
  ('b1000006-0001-0000-0000-000000000007', 'What is the biggest technology frustration in your business right now?', 'text', 'Open-ended tech pain', 2, '[]'),
  ('b1000006-0001-0000-0000-000000000008', 'Based on everything we''ve discussed, what is your comfort level with investing in a system that solves these problems?', 'text', 'Gauge budget readiness', 0, '[]'),
  ('b1000006-0001-0000-0000-000000000008', 'Who else needs to be part of this decision — and what would they need to see to say yes?', 'text', 'Identify decision-makers', 1, '[]'),
  ('b1000006-0001-0000-0000-000000000008', 'What would your ideal timeline be to get started?', 'text', 'Close with timeline', 2, '[]');
