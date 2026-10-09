# Sentinel: SAP Pipeline Operations Console (static demo)

**A demo-ready console for SAP-sourced Databricks pipelines: 15 pipelines across 5 countries, 40 runs a day, an AI-driven incident workflow for 14 failure types, escalation emails, and data validation checks. Everything is static demo data except Genie, the chat assistant, which is live.**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Databricks](https://img.shields.io/badge/Databricks_Apps-FF3621?style=flat-square&logo=databricks&logoColor=white)

> **This is the `static` branch (the repo's default).** It is hosted as a Databricks App only. The live, Databricks-backed variants live on `n-live` and `h-live`.

## What's in it

| Page | What it shows |
|---|---|
| **Overview** | Today's KPIs (runs, failures, success rate, max duration, active incidents), the 5 newest open incidents, and the 5 most recent runs. A **workspace switcher** (All Workspaces / Procurement DE / Sales DE) re-scopes every page. |
| **Pipelines** | All 40 runs for each of the last 15 days (the window always ends on the current date), chosen with a compact date-range picker (a single day by default), as a table with the responsible person, incident status, approval/remediation/validation status, SLA, guardrail and the recommended action in plain English. Filter by status, failure type, or search. |
| **Incidents** | Every incident from the last 15 days (24 active) plus the failure scenario / remediation playbook. Each incident opens an 8-step workflow: created → AI investigation → failure type → SLA → remediation → validation → notification → regression test, followed by the audit history. |
| **Notifications** | Every email and escalation sent in the last 7 days (incident, subject, reason, person, failure type, pipeline); open one to see the full email and resolution. |
| **Data Validation** | The 7 `ai_dataops_poc.sap_demo` tables, grouped as source and resulting tables. Expand a table to run each of the 10 data quality checks (or all at once). |
| **Genie** (chat button) | Live — `POST /api/chat` on the Databricks-hosted assistant. |

### How the incident workflow behaves

Every incident follows one of these status flows:

| Failure type | Flow |
|---|---|
| **Transient Infrastructure**, **Temporary Execution** (safe to rerun) | Automatic remediation → **Resolved**. If it fails: Remediation failed → **Escalation required** (you click *Escalate and send email*) → **Escalated · mail sent** |
| **Other recoverable types** (12 types) | **Waiting for approval** → *Approve and remediate* → **Remediating** → **Resolved**. If it fails: Remediation failed → **Escalated · mail sent** (automatic) |
| **Repeated Failure**, **Unknown** (AI cannot fix) | **Escalation required** → *Escalate and send email* → **Escalated · mail sent** |

- *Approve and remediate* shows a pop-up that the pipeline has been started in Databricks, then runs, validates and resolves (some demo incidents are set up to fail, so you can see the escalation path). *Reject* closes the incident without any action.
- The remediation section shows the flow, which steps the **AI** performs and which need a **person**, and states clearly when AI cannot perform the remediation.
- *Send email* is available on every incident. The email is generated from the incident (reason + the solution for that failure type) and appears under Notifications with a matching entry in the incident's audit history.
- **SLA:** the average pipeline runtime is 15 minutes; a longer run is **Critical**, a shorter one **Safe**.

## Run it

```bash
cd Frontend
npm install
npm run dev      # http://localhost:3000
```

Only Genie needs a backend. Locally, point it at any server that implements `POST /api/chat` (`{ "message": "…" }` → `{ "data": { "message": "…" } }`) via `Frontend/.env.local` (see `.env.local.example`). Without it, the rest of the app still works and Genie says it couldn't answer.

## Hosting (Databricks Apps only)

`Frontend/app.yaml` runs the app as a Databricks App. Genie reaches the assistant through the app's own server-side proxy (`src/app/api/proxy`), which authenticates as a service principal — the browser never holds a Databricks credential — and only forwards `POST /api/chat`. See [`Frontend/README.md`](Frontend/README.md) for the full deployment steps.

## Project structure

```
Frontend/src/
  ops/         The static data model: pipelines, 14 failure types, runs, incidents,
               notifications, validation checks, and the in-memory store (workspace,
               approve/reject/email actions)
  app/         Routes: /overview /pipelines /incidents /notifications /data-validation
  components/  Layout (sidebar, workspace switcher), common UI, chat (Genie), incident modals
  services/    chatService.ts — the one live call (Genie)
Backend/       Legacy FastAPI service — not used by this branch
```

---

Built as a proof of concept during a data engineering internship at KaarTech. More on my [portfolio](https://uthrahrk.vercel.app).
