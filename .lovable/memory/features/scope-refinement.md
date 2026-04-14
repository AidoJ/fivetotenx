---
name: Scope Refinement
description: AI-powered gap analysis tab between Discovery and Analysis that identifies unanswered questions before building
type: feature
---
The 'Scope Refinement' tab sits between Discovery and Analysis in the ClientDetailModal. It provides:
1. **Data Completeness Audit** — checks for Reality Check™, Straight Talk™, transcripts, artifacts, and notes
2. **AI Gap Detection** — edge function 'scope-refinement' feeds all client data to Gemini 2.5 Flash with tool calling to extract structured questions
3. **Refinement Questions Board** — questions grouped by category, with priority (blocker/important/nice_to_know), status (unanswered/answered/N/A), source context, and inline answer capture
4. **Build Readiness Score** — percentage based on resolved questions

Questions are persisted in the `refinement_questions` table. Re-analysis clears and regenerates. Answers feed back as context for the Analysis tab.
