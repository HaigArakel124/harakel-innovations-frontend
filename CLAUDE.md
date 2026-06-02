# CLAUDE.md - Harakel Innovations (Frontend)

Standing context and rules for this repo. Read at the start of every session.

## Project
Harakel Innovations - AI business-automation SaaS for beauty salons and med spas.
- Frontend: vanilla HTML/JS on Vercel, domain harakel-innovations.com (this repo).
- Backend: FastAPI on Railway (separate repo: harakel-innovations-backend).
- The backend talks to: Supabase (Postgres), Stripe, SendGrid, Twilio, ElevenLabs, Anthropic (claude-opus-4-7).

## How I work
- Prioritize the safest, most reliable, most secure choice. Favor durable long-term fixes over quick workarounds. On a tradeoff, recommend the most robust path and tell me what the quick option would cost later.
- Investigate before acting - understand the existing code and root cause before changing anything.
- Explain the plain-English rationale before the technical how-to. Why before how.
- Work step by step with a verification step at each stage. Don't batch changes; let me confirm each works before moving on.
- I manage git myself in PowerShell. Do NOT run git commands - tell me what to run if needed.
- I work across two machines; assume I've git-pulled before starting.
- Be direct. If my approach is a bad idea, say so and explain why.

## Status tracking
The living project status doc (harakel-status.md) lives in the BACKEND repo, not here. Do not try to edit it from this repo. If frontend work produces something status-worthy (a shipped feature, a notable decision), remind me at the end of the session so I can log it on the backend side.
