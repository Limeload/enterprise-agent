# Enterprise Knowledge & Action Agent

An AI-powered enterprise assistant that answers questions across your company's tools (GitHub, Slack, Notion, HubSpot, and more) and can take actions on your behalf — all through a chat interface, with role-based permissions, citations, and a full audit trail.

## Features

- **Conversational knowledge agent** — ask natural-language questions ("what's the status of PROJ-123?", "summarize last week's Slack thread on the outage") and get answers grounded in your real company data, with source citations.
- **Multi-agent orchestration** — a LangGraph pipeline classifies intent, selects relevant sources, checks permissions, retrieves data, plans tool calls, executes them, and validates citations before responding.
- **30+ SaaS connectors** — real implementations for GitHub, Slack, Notion, and HubSpot, with stub connectors ready to wire up for Jira, Salesforce, Zendesk, Google Workspace, Confluence, and more.
- **Per-user "Connect" flows** — each user logs in and connects their own accounts from the UI (no code or env-var edits required); credentials are encrypted at rest and scoped per user.
- **Role-based access control** — Admin, Engineer, Analyst, and Viewer roles gate which connectors and which actions (read/write/delete/send) each user can use.
- **Human-in-the-loop actions** — write actions (e.g. creating a GitHub issue, posting to Slack) can require explicit human approval before executing.
- **Audit logging & observability** — every query and action is logged; LangSmith and OpenTelemetry tracing are built in for debugging and monitoring agent behavior.
- **Streaming responses** — answers stream token-by-token with live visibility into which agent step is currently running.

## User flow

1. **Sign up / log in** at `/login` with email and password (powered by Supabase Auth).
2. **Connect your accounts** at `/connectors` — click "Connect" next to GitHub, Slack, Notion, HubSpot, etc. to authorize via OAuth (handled by Composio). Disconnect anytime.
3. **Chat** at `/` — ask a question or request an action. The agent figures out which connectors are relevant, checks you have permission, retrieves and cites sources, and streams back an answer.
4. **Approve actions** — if the agent wants to take a write action (e.g. create an issue, send a message), it pauses for human approval before proceeding.
5. **Audit trail** — every interaction is recorded for compliance and debugging.

## Tech stack

**Backend**
- FastAPI (Python) — REST API and SSE streaming
- LangGraph + LangChain — multi-agent orchestration pipeline
- Anthropic Claude / OpenAI / Gemini / Groq — pluggable LLM providers
- Supabase (Postgres + pgvector) — auth, vector store for RAG, audit logs, per-user connector credentials
- Composio — hosted OAuth for per-user connector "Connect" flows
- LangSmith + OpenTelemetry — tracing and observability
- Redis — caching

**Frontend**
- Next.js 15 (React 19, TypeScript)
- Tailwind CSS
- Supabase JS client (auth session management)
- Vercel AI SDK primitives for streaming chat UI

**Infra**
- Docker Compose (backend, frontend, Redis, OpenTelemetry collector)

## Why use this platform

- **One place to ask, instead of ten tabs to search.** Stop hopping between GitHub, Slack, Notion, and your CRM to piece together an answer — ask once and get a cited, synthesized response.
- **Self-service, not IT-gated.** Anyone can log in and connect their own accounts through the UI — no waiting on an admin to hardcode API keys or redeploy the backend.
- **Safe by default.** Role-based permissions and human-approval gates mean the agent can be genuinely useful (including taking actions) without becoming a liability.
- **Trustworthy answers.** Citation validation means responses point back to the real source document, not a hallucinated summary.
- **Built to extend.** New connectors follow a simple base-class interface, and the agent pipeline is a swappable LangGraph — add a data source or a new reasoning step without rearchitecting the system.
- **Observable from day one.** Tracing and audit logs are wired in up front, so you can debug agent behavior and demonstrate compliance instead of bolting on observability later.
