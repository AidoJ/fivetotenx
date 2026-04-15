---
name: Scope Refinement
description: AI-powered gap analysis tab with client-facing portal for collecting answers to scope gaps
type: feature
---
The 'Scope Refinement' tab sits between Discovery and Analysis in the ClientDetailModal. It provides:
1. **Data Completeness Audit** — checks for Reality Check™, Straight Talk™, transcripts, artifacts, and notes
2. **AI Gap Detection** — edge function 'scope-refinement' feeds all client data to Gemini 2.5 Flash with tool calling to extract structured questions
3. **Refinement Questions Board** — questions grouped by category, with priority (blocker/important/nice_to_know), status (unanswered/answered/N/A), source context, and inline answer capture
4. **Build Readiness Score** — percentage based on resolved questions
5. **Custom Questions** — admins can add manual questions alongside AI-detected ones (source_type: 'manual')
6. **Send to Client** — admin selects questions via checkboxes, clicks "Send to Client" which:
   - Creates a secure token in `refinement_tokens` table (14-day expiry)
   - Sends a branded email via `send-refinement-invite` edge function (CC'd to Aidan + Eoghan)
   - Marks questions as `sent_to_client: true`
7. **Client Portal** — `/refinement/:token` public page where clients answer questions with text + file/link uploads
   - Files upload to `interview-audio` bucket under `{assessmentId}/refinement/`
   - Links and files create `client_artifacts` entries tagged "Re: {question}"
   - Token marked as used after submission

Questions are persisted in the `refinement_questions` table. Re-analysis clears and regenerates. Answers feed back as context for the Analysis tab. Deep Dive removed from audit.
