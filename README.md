# Sentinel: Pipeline Health, Data Quality & Incident Console (static demo)

**A fully static UI for SAP-sourced Databricks pipelines — 30 pipelines across 10 countries, pipeline health scoring, real `sap_demo`-grounded data quality checks, and a 6-failure-type incident engine with a full notification/regression-test workflow. No backend, no live data — everything is deterministic fixture data, deployed on Vercel.**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Status](https://img.shields.io/badge/status-static_%E2%80%94_no_backend-2ea44f?style=flat-square)

> **This is the `static` branch.** It is deliberately disconnected from any
> backend — `USE_LIVE_API` is hardcoded `false` in
> [`Frontend/src/lib/liveMode.ts`](Frontend/src/lib/liveMode.ts), so no env
> var can accidentally point it at a live system. The live, Databricks-backed
> versions of this app live on the `n-live` and `h-live` branches.

---

## What it does

| Page | What it shows |
|---|---|
| **Overview** | KPIs across 30 pipelines (10 countries × 3 SAP pipeline categories), configurable settings, and two drill-down boxes: Pipeline Health Check-up and Data Quality Check-up. |
| **Pipeline Health** | Health score and optimization status per pipeline, based on runtime vs. configured average/max baselines. |
| **Data Quality Check-up** | Row counts, load freshness, and DQ pass/fail for the 7 real tables in `ai_dataops_poc.sap_demo`, snapshotted as fixtures. |
| **Incidents** (list + detail) | 10 hand-authored incidents covering all 6 failure types (Transient Job Failure, Known Task Restart, Schema Change, Unknown Error, Data Quality Breach, Permission Issue), each with its own status-machine workflow, investigation/DQ/SLA panels, regression test card, and operational metadata. |
| **Notifications** | Simulated send/reject flow — email recipient is derived from the pipeline's real assignee (no email is actually sent). |

Every value is either hand-authored fixture data or a real snapshot pulled once from Unity Catalog and hardcoded (e.g. the 7 `sap_demo` table schemas). Nothing fetches anything at runtime.

## Quick start

```bash
git clone https://github.com/uthrahh/Data-Pipeline-Sentinel.git
cd Data-Pipeline-Sentinel/Frontend
npm install
npm run dev
# open http://localhost:3000
```

## Deploying to Vercel

```bash
cd Frontend
vercel
```

Set **Root Directory** to `Frontend` in the Vercel project settings (this repo is a monorepo with `Frontend/`/`Backend/` siblings) — `Frontend/vercel.json` pins the build/install/dev commands so Vercel doesn't have to auto-detect them. No environment variables are required; the app has nothing to connect to.

## Project structure

```
Frontend/
  src/app/           Next.js App Router pages: /overview, /pipelines/health,
                      /incidents, /incidents/[incidentId], /data-quality, /notifications
  src/data/mock/      All fixture data — pipelines, incidents, DQ tables, people/owners
  src/lib/            liveMode.ts (hardcoded false here), overviewSettings, lifecycle,
                       incidentStore/notificationStore (in-memory, mutable for demo interactivity)
  src/config/         sapPipelineConfig.ts — 10 countries × 3 pipeline categories
  src/types/          Domain model (Pipeline, Incident, DQ, SLA, Notification, Audit, RegressionTest)
```

---

Built as a proof of concept during a data engineering internship at KaarTech. More on my [portfolio](https://uthrahrk.vercel.app).
