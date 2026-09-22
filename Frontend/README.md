# Sentinel AI Pipeline

An enterprise pipeline observability and remediation platform: pipeline monitoring, AI-powered
failure investigation, DQ/SLA checks, human-approved automated remediation, post-remediation
validation, incident lifecycle tracking, and an embedded AI assistant.

Built on realistic mock data behind a service-layer abstraction so it can be pointed at a real
FastAPI / Databricks backend later without a frontend rewrite.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
src/
  types/        Domain model (Pipeline, Incident, DQ, SLA, Remediation, Audit, Chat, Metrics)
  lib/           Pure helpers, incl. incidentNarratives.ts (derives DQ/SLA agent summaries
                 from check results — the same synthesis a real backend agent would do)
  data/mock/     Realistic fixtures — the only place mock data lives
  services/      PipelineService, IncidentService, MetricsService, ChatService + apiClient.
                 Each is an interface with a Mock implementation today; swap in an
                 Api* implementation later without touching hooks or components.
  hooks/         Data-fetching hooks (usePipelines, useIncident, useChat, ...) — the
                 boundary between services and UI.
  components/    dashboard/ · pipeline/ · incident/ · chat/ · layout/ · common/
  app/           Next.js App Router pages: /overview, /pipelines, /pipelines/[runId],
                 /incidents, /incidents/[incidentId], /remediation, /analytics
```

**Lifecycle modeled end-to-end:** Detect → Investigate → DQ/SLA → Recommend → Approve
(human-in-the-loop, required) → Remediate → Validate → Resolve. A successful remediation job
does **not** automatically mean the incident is resolved — post-remediation DQ/SLA validation
runs first, and can independently fail (`VALIDATION_FAILED`) even when the job succeeded.

## Connecting a real backend

Set `NEXT_PUBLIC_API_URL` and implement `Api*Service` classes matching the existing service
interfaces in `src/services/`. See `src/services/apiClient.ts` for the fetch wrapper and the
expected REST contract (`GET /api/pipelines`, `GET /api/incidents/{id}`,
`POST /api/incidents/{id}/approve`, `POST /api/chat`, etc.).
