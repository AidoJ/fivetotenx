-- Proposal tokens for tokenised client links
CREATE TABLE public.proposal_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_tokens_token ON public.proposal_tokens(token);
CREATE INDEX idx_proposal_tokens_proposal_id ON public.proposal_tokens(proposal_id);

ALTER TABLE public.proposal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read proposal tokens"
  ON public.proposal_tokens FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert proposal tokens"
  ON public.proposal_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update proposal tokens"
  ON public.proposal_tokens FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add agreement & revision columns to proposals
ALTER TABLE public.proposals
  ADD COLUMN agreement_accepted_at timestamptz,
  ADD COLUMN agreement_version text,
  ADD COLUMN agreement_signer_name text,
  ADD COLUMN agreement_signer_signature text,
  ADD COLUMN agreement_signer_ip text,
  ADD COLUMN agreement_accepted_total numeric,
  ADD COLUMN agreement_accepted_items jsonb,
  ADD COLUMN countersigned_at timestamptz,
  ADD COLUMN countersigner_name text,
  ADD COLUMN countersigner_signature text,
  ADD COLUMN signed_pdf_url text,
  ADD COLUMN client_revision_requested_at timestamptz;

-- Legal documents (versioned)
CREATE TABLE public.legal_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  version text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, version)
);

CREATE INDEX idx_legal_documents_current ON public.legal_documents(key, is_current) WHERE is_current = true;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read legal documents"
  ON public.legal_documents FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert legal documents"
  ON public.legal_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update legal documents"
  ON public.legal_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed the Initial AI Consultancy Engagement Agreement v1.0
INSERT INTO public.legal_documents (key, version, title, content, is_current) VALUES (
  'initial-engagement',
  '1.0',
  'Initial AI Consultancy Engagement Agreement',
  $AGREEMENT$# INITIAL AI CONSULTANCY ENGAGEMENT AGREEMENT

**Galdon Training Pty Ltd. T/A 5to10x** (*Herein referred to as 5to10x*)

**Purpose:** This Initial Engagement Agreement establishes the commercial and legal framework under which 5to10x provides early-stage AI advisory, discovery, scoping, and transformation consulting services to the Client within Australia.

This document is designed to:
- clarify expectations
- define responsibilities
- manage risk
- protect intellectual property
- ensure appropriate use of AI technologies
- align with Australian legal and privacy obligations

---

## 1. PARTIES

This Agreement is between:

**Galdon Training Pty Ltd. T/A 5to10x** ("Consultant")

and

**Client Name:** {{clientName}}

**ABN (if applicable):** {{clientAbn}}

**Address:** {{clientAddress}}

**Effective Date:** {{effectiveDate}}

---

## 2. SCOPE OF INITIAL ENGAGEMENT

The Initial Engagement is a structured discovery and advisory phase intended to:
- identify business pain points suitable for AI augmentation
- assess operational readiness for automation or AI deployment
- evaluate opportunities for efficiency, insight generation, or capability expansion
- recommend candidate solutions, architectures, or pilot initiatives
- produce a prioritised AI opportunity roadmap

Unless otherwise agreed in writing, this engagement **does not include production software delivery**.

Typical deliverables may include: opportunity mapping, workflow analysis, prototype concepts, automation strategy outlines, vendor/platform recommendations, pilot project definitions, transformation roadmap.

## 3. NATURE OF AI ADVISORY SERVICES

The Client acknowledges that Artificial Intelligence technologies evolve rapidly and may:
- change capability without notice
- vary in accuracy
- produce non-deterministic outputs
- rely on third-party platforms outside Consultant control

Accordingly, 5to10x provides **strategic guidance** and implementation recommendations, not guarantees of business outcomes.

## 4. CLIENT RESPONSIBILITIES

The Client agrees to:
- provide accurate operational information
- disclose relevant systems and constraints
- ensure lawful access to business data
- nominate a decision-maker contact
- review deliverables promptly
- validate recommendations before implementation

The Client remains responsible for: final deployment decisions, regulatory compliance, cybersecurity posture, workforce change management, operational reliance on AI outputs.

## 5. THIRD-PARTY PLATFORMS AND MODELS

AI solutions commonly rely on external platforms including (but not limited to): large language model providers, workflow automation systems, cloud infrastructure providers, analytics engines, integration middleware.

5to10x: does not control third-party availability; does not warrant third-party uptime; does not guarantee pricing stability; is not responsible for vendor roadmap changes. The Client agrees that third-party terms may apply separately.

## 6. PRIVACY AND DATA HANDLING (AUSTRALIAN PRIVACY FRAMEWORK)

Both parties agree to comply with the Privacy Act 1988 (Cth) and Australian Privacy Principles (APPs).

Unless otherwise agreed, 5to10x will not intentionally retain personal data beyond what is necessary for analysis, modelling, scoping, solution design.

The Client must not provide health data, biometric identifiers, financial credentials, or government identifiers unless explicitly agreed in writing. The Client confirms it has authority to share all supplied data.

## 7. CONFIDENTIALITY

Each party agrees to keep confidential: operational processes, internal documentation, pricing models, technical approaches, datasets, strategy material. This obligation survives termination of the Agreement.

Exclusions apply where information becomes public, was already known, is independently developed, or must be disclosed by law.

## 8. INTELLECTUAL PROPERTY

Unless otherwise agreed, 5to10x retains ownership of: frameworks, prompt libraries, advisory methods, automation templates, architecture patterns, reusable components.

The Client retains ownership of its business processes, datasets, and internal documentation.

Upon payment of all fees, the Client receives a **perpetual internal-use licence** to use engagement outputs. Resale or redistribution requires written consent.

## 9. PILOT SOLUTIONS AND PROTOTYPES

Where prototypes are produced, they are provided for evaluation purposes, without production warranty, without performance guarantees. Production deployment requires a separate implementation agreement.

## 10. LIMITATION OF LIABILITY

To the maximum extent permitted by Australian law, 5to10x excludes liability for: indirect loss, consequential loss, lost revenue, lost opportunity, automation decisions made by the Client, reliance on AI-generated outputs.

Total liability is limited to fees paid under this engagement. Nothing excludes rights under the **Australian Consumer Law**.

## 11. PROFESSIONAL RELIANCE DISCLAIMER

AI outputs may contain errors, reflect bias, become outdated, or misinterpret context. They must not be relied upon as legal advice, financial advice, medical advice, or compliance advice. The Client must obtain appropriate professional review where required.

## 12. CHANGE MANAGEMENT

Recommendations involving automation may affect staffing, workflows, governance, responsibilities. The Client remains responsible for organisational change implementation.

## 13. FEES

Fees for the Initial Engagement (Phase 1 Build) are: **{{totalFee}}**

Payment Terms: **{{paymentTerms}}**

Work may pause if invoices become overdue.

## 14. TERM

This Agreement continues until completion of discovery phase deliverables, OR replacement by implementation agreement, OR termination by either party with 7 days written notice.

## 15. TERMINATION

Either party may terminate if obligations are not met, payment is overdue, or cooperation is not provided. Fees for completed work remain payable.

## 16. FUTURE IMPLEMENTATION WORK

Implementation services including automation deployment, software builds, integrations, dashboards, AI agents require a separate agreement.

## 17. GOVERNING LAW

This Agreement is governed by the laws of Australia. Jurisdiction: New South Wales.

## 18. ACCEPTANCE

By signing below, both parties agree to the terms of this Initial AI Consultancy Engagement Agreement.
$AGREEMENT$,
  true
);