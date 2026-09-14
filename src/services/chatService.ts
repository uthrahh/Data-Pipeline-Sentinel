import { incidentService } from "./incidentService";
import { pipelineService } from "./pipelineService";
import type { ChatMessage, ChatResultCard, ChatToolCall } from "@/types";
import { formatDuration } from "@/lib/utils";

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface ChatService {
  sendMessage(content: string): Promise<{ toolCalls: ChatToolCall[]; reply: ChatMessage }>;
}

/**
 * Mock implementation — simple intent matching over the same mock service
 * layer the rest of the UI uses, so its answers stay consistent with what's
 * on screen. A future `ApiChatService` would call POST /api/chat and stream
 * back { content, toolCalls, resultCards } from a real backend agent —
 * ChatPanel would not need to change.
 */
class MockChatService implements ChatService {
  async sendMessage(raw: string): Promise<{ toolCalls: ChatToolCall[]; reply: ChatMessage }> {
    const content = raw.toLowerCase();
    const toolCalls: ChatToolCall[] = [];
    let text = "";
    let cards: ChatResultCard[] = [];

    if (content.includes("waiting") || content.includes("approval")) {
      toolCalls.push({ label: "Querying incidents awaiting approval", status: "done" });
      const { items } = await incidentService.getIncidents({ status: ["WAITING_APPROVAL"] });
      if (items.length === 0) {
        text = "No incidents are currently waiting on human approval.";
      } else {
        text = `${items.length} incident${items.length > 1 ? "s" : ""} ${
          items.length > 1 ? "are" : "is"
        } waiting on your approval before remediation can proceed.`;
        cards = items.map((i) => ({
          type: "incident",
          title: i.incidentId,
          subtitle: `${i.pipelineName} — ${i.recommendation?.action ?? "Recommendation pending"}`,
          status: i.status,
          href: `/incidents/${i.incidentId}`,
        }));
      }
    } else if (content.includes("remediat")) {
      toolCalls.push({ label: "Querying active remediations", status: "done" });
      const { items } = await incidentService.getIncidents({ status: ["REMEDIATING"] });
      if (items.length === 0) {
        text = "No remediations are currently running.";
      } else {
        text = `${items.length} remediation${items.length > 1 ? "s are" : " is"} currently in progress.`;
        cards = items.map((i) => ({
          type: "incident",
          title: i.incidentId,
          subtitle: `${i.pipelineName} — remediation run ${i.remediation?.remediationRunId ?? "pending"}`,
          status: i.status,
          href: `/incidents/${i.incidentId}`,
        }));
      }
    } else if (content.includes("sla")) {
      toolCalls.push({ label: "Checking SLA results", status: "done" });
      const pipelineName = extractPipelineName(content);
      const { items } = await pipelineService.getExecutions({ pageSize: 50 });
      const match = pipelineName
        ? items.find((e) => e.pipelineName.toLowerCase().includes(pipelineName))
        : items.find((e) => e.status === "FAILED" || e.status === "TIMED_OUT");
      if (!match) {
        text = "I couldn't find a matching pipeline execution to check SLA against.";
      } else if (!match.slaMinutes) {
        text = `${match.pipelineName} (run ${match.runId}) has no configured SLA.`;
      } else {
        const breached = match.status !== "SUCCESS" || (match.durationMinutes ?? 0) > match.slaMinutes;
        text = `${match.pipelineName} (run ${match.runId}) ${
          breached ? "did not meet" : "met"
        } its SLA of ${formatDuration(match.slaMinutes)} — actual duration was ${formatDuration(
          match.durationMinutes,
        )}.`;
        cards = [
          {
            type: "pipeline",
            title: match.pipelineName,
            subtitle: `Run ${match.runId} — ${match.status}`,
            status: match.status,
            href: `/pipelines/${match.runId}`,
          },
        ];
      }
    } else if (content.includes("dq") || content.includes("quality")) {
      toolCalls.push({ label: "Running DQ analysis", status: "done" });
      const pipelineName = extractPipelineName(content);
      const { items } = await pipelineService.getExecutions({ pageSize: 50 });
      const match = pipelineName ? items.find((e) => e.pipelineName.toLowerCase().includes(pipelineName)) : items[0];
      if (!match) {
        text = "I couldn't find that pipeline to run a DQ analysis against.";
      } else if (match.incidentId) {
        const incident = await incidentService.getIncident(match.incidentId);
        const failCount = incident?.dq?.checks.filter((c) => c.status === "FAIL").length ?? 0;
        text = `DQ analysis for ${match.pipelineName} (run ${match.runId}): ${
          incident?.dq?.checks.length ?? 0
        } checks evaluated, ${failCount} failing.`;
        cards = [
          {
            type: "incident",
            title: incident?.incidentId ?? match.incidentId,
            subtitle: `${match.pipelineName} — DQ ${incident?.dq?.status ?? "unknown"}`,
            href: `/incidents/${match.incidentId}`,
          },
        ];
      } else {
        text = `${match.pipelineName} (run ${match.runId}) completed with status ${match.status} — no DQ issues were flagged.`;
        cards = [
          { type: "pipeline", title: match.pipelineName, subtitle: `Run ${match.runId}`, status: match.status, href: `/pipelines/${match.runId}` },
        ];
      }
    } else if (content.includes("why") && content.includes("fail")) {
      toolCalls.push({ label: "Finding the most recent failure", status: "done" });
      toolCalls.push({ label: "Reading AI investigation", status: "done" });
      const { items } = await pipelineService.getExecutions({
        filters: { status: ["FAILED", "TIMED_OUT"] },
        pageSize: 1,
      });
      const latest = items[0];
      if (!latest?.incidentId) {
        text = "I couldn't find a recent pipeline failure with a completed investigation.";
      } else {
        const incident = await incidentService.getIncident(latest.incidentId);
        text = incident?.investigation?.status === "COMPLETE"
          ? `${latest.pipelineName} (run ${latest.runId}) failed — ${incident.investigation.rootCause}`
          : `${latest.pipelineName} (run ${latest.runId}) failed. Investigation is still in progress.`;
        cards = [
          {
            type: "incident",
            title: incident?.incidentId ?? latest.incidentId,
            subtitle: `${latest.pipelineName} — ${incident?.status ?? "OPEN"}`,
            href: `/incidents/${latest.incidentId}`,
          },
        ];
      }
    } else if (content.includes("failed") && (content.includes("today") || content.includes("pipeline"))) {
      toolCalls.push({ label: "Querying today's pipeline executions", status: "done" });
      const { items } = await pipelineService.getExecutions({
        filters: { status: ["FAILED", "TIMED_OUT"], dateFrom: "2026-09-14T00:00:00Z" },
        pageSize: 20,
      });
      text = items.length === 0 ? "No pipelines have failed today." : `${items.length} pipeline execution${items.length > 1 ? "s" : ""} failed today.`;
      cards = items.slice(0, 5).map((e) => ({
        type: "pipeline",
        title: e.pipelineName,
        subtitle: `Run ${e.runId} — ${e.trigger.name}`,
        status: e.status,
        href: `/pipelines/${e.runId}`,
      }));
    } else {
      toolCalls.push({ label: "Reviewing platform status", status: "done" });
      const { items: openIncidents } = await incidentService.getIncidents();
      const attention = openIncidents.filter((i) =>
        ["OPEN", "INVESTIGATING", "WAITING_APPROVAL", "REMEDIATION_FAILED", "VALIDATION_FAILED"].includes(i.status),
      );
      text =
        `I can help investigate failures, check DQ/SLA results, and track remediation. ` +
        `Right now there ${attention.length === 1 ? "is" : "are"} ${attention.length} incident${
          attention.length === 1 ? "" : "s"
        } needing attention. Try one of the suggested prompts, or ask about a specific pipeline.`;
      cards = attention.slice(0, 3).map((i) => ({
        type: "incident",
        title: i.incidentId,
        subtitle: `${i.pipelineName} — ${i.status.replaceAll("_", " ")}`,
        status: i.status,
        href: `/incidents/${i.incidentId}`,
      }));
    }

    const reply: ChatMessage = {
      id: id(),
      role: "assistant",
      content: text,
      timestamp: new Date().toISOString(),
      resultCards: cards,
    };

    return delay({ toolCalls, reply }, 900);
  }
}

function extractPipelineName(content: string): string | null {
  const known = [
    "sales_us_load",
    "sales_uk_load",
    "inventory_daily_load",
    "customer_master_refresh",
    "product_dimension_load",
    "finance_fact_load",
    "marketing_analytics_load",
    "anz_metcash",
    "dsr_dachn_accelerate",
    "dimensions_with_country",
    "az_vision_store",
    "pl_extract_images",
  ];
  return known.find((name) => content.includes(name)) ?? null;
}

export const chatService: ChatService = new MockChatService();
