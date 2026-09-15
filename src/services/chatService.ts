import { incidentService } from "./incidentService";
import { pipelineService } from "./pipelineService";
import { sapDataService } from "./sapDataService";
import type { ChatMessage, ChatQueryResult, ChatResultCard, ChatToolCall } from "@/types";
import { formatDuration } from "@/lib/utils";
import { COUNTRIES, PIPELINES } from "@/config/sapPipelineConfig";

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

function extractPipelineId(content: string) {
  return PIPELINES.find(
    (p) => content.includes(p.id) || content.includes(p.label.toLowerCase()),
  );
}

function extractCountryCode(content: string) {
  return COUNTRIES.find((c) => new RegExp(`\\b${c.code.toLowerCase()}\\b`).test(content) || content.includes(c.label.toLowerCase()))?.code;
}

function extractMaterialId(content: string): string | null {
  const match = content.match(/mat\d{3,}/i);
  return match ? match[0].toUpperCase() : null;
}

const IN_SCOPE_KEYWORDS = [
  "material",
  "vendor",
  "procurement",
  "sales",
  "manufactur",
  "gold",
  "pipeline",
  "incident",
  "dq",
  "quality",
  "sla",
  "remediat",
  "country",
  "job",
  "fail",
  "approv",
];

export interface ChatService {
  sendMessage(content: string): Promise<{ toolCalls: ChatToolCall[]; reply: ChatMessage }>;
}

/**
 * Mock implementation — intent matching over the same service layer the
 * rest of the UI uses (pipelineService, incidentService, sapDataService), so
 * its answers stay consistent with what's on screen. A future
 * `ApiChatService` would call POST /api/chat and let a real backend
 * (Databricks Genie / RAG / SQL) resolve the query, returning the same
 * { content, toolCalls, resultCards, queryResult } shape — ChatPanel would
 * not need to change.
 */
class MockChatService implements ChatService {
  async sendMessage(raw: string): Promise<{ toolCalls: ChatToolCall[]; reply: ChatMessage }> {
    const content = raw.toLowerCase();
    const toolCalls: ChatToolCall[] = [];
    let text = "";
    let cards: ChatResultCard[] = [];
    let queryResult: ChatQueryResult | undefined;

    const materialId = extractMaterialId(content);
    const countryCode = extractCountryCode(content);
    const pipeline = extractPipelineId(content);

    if (content.includes("vendor") && materialId) {
      toolCalls.push({ label: `Querying sap_vendor_material for ${materialId}`, status: "done" });
      queryResult = await sapDataService.getVendorsForMaterial(materialId);
      text =
        queryResult.rows.length === 0
          ? `No vendors are on file for ${materialId} in sap_vendor_material.`
          : `${queryResult.rows.length} vendor${queryResult.rows.length > 1 ? "s" : ""} supply ${materialId}.`;
    } else if (content.includes("procurement") && materialId) {
      toolCalls.push({ label: `Joining material master and procurement data for ${materialId}`, status: "done" });
      queryResult = await sapDataService.getProcurementForMaterial(materialId);
      text = `Procurement data for ${materialId}:`;
    } else if (content.includes("top") && content.includes("material") && content.includes("cost")) {
      toolCalls.push({ label: "Querying sap_material_master", status: "done" });
      queryResult = await sapDataService.topMaterialsByStandardCost(5);
      text = "Top materials by standard cost:";
    } else if (content.includes("highest sales") || (content.includes("sales quantity") && content.includes("material"))) {
      toolCalls.push({ label: "Aggregating sap_sales_order_item by material", status: "done" });
      queryResult = await sapDataService.topMaterialsBySalesQuantity(5);
      text = "Materials with the highest sales quantity:";
    } else if (content.includes("sales order") && content.includes("open")) {
      toolCalls.push({ label: "Querying sap_sales_order_item", status: "done" });
      queryResult = await sapDataService.getOpenSalesOrders(countryCode);
      text = countryCode
        ? `Open sales orders for ${countryCode}:`
        : "Open sales orders across all countries:";
    } else if (content.includes("how many") && content.includes("material")) {
      toolCalls.push({ label: "Counting sap_material_master rows", status: "done" });
      const count = await sapDataService.getMaterialCount();
      text = `sap_material_master currently has ${count} records.`;
    } else if (content.includes("material") && (content.includes("active") || content.includes("what materials") || content.includes("show"))) {
      toolCalls.push({ label: "Querying sap_material_master", status: "done" });
      queryResult = await sapDataService.listMaterials(10);
      text = "Active materials in sap_material_master:";
    } else if (content.includes("waiting") || content.includes("approval")) {
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
          subtitle: `${i.pipelineName} (${i.country}) — ${i.recommendation?.action ?? "Recommendation pending"}`,
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
          subtitle: `${i.pipelineName} (${i.country}) — remediation run ${i.remediation?.remediationRunId ?? "pending"}`,
          status: i.status,
          href: `/incidents/${i.incidentId}`,
        }));
      }
    } else if (content.includes("sla")) {
      toolCalls.push({ label: "Checking SLA results", status: "done" });
      const { items } = await pipelineService.getExecutions({
        filters: pipeline ? { pipelineId: [pipeline.id] } : undefined,
        sortKey: "startTime",
        sortDirection: "desc",
        pageSize: 50,
      });
      const match = countryCode ? items.find((e) => e.country === countryCode) : items[0];
      if (!match) {
        text = "I couldn't find a matching pipeline execution to check SLA against.";
      } else if (!match.slaMinutes) {
        text = `${match.pipelineName} (${match.country}) has no configured SLA.`;
      } else {
        const breached = match.status !== "SUCCESS" || (match.durationMinutes ?? 0) > match.slaMinutes;
        text = `${match.pipelineName} (${match.country}, run ${match.runId}) ${
          breached ? "did not meet" : "met"
        } its SLA of ${formatDuration(match.slaMinutes)} — actual duration was ${formatDuration(match.durationMinutes)}.`;
        cards = [
          {
            type: "pipeline",
            title: match.pipelineName,
            subtitle: `${match.country} · Run ${match.runId} — ${match.status}`,
            status: match.status,
            href: `/pipelines/${match.runId}`,
          },
        ];
      }
    } else if (content.includes("dq") || content.includes("quality")) {
      toolCalls.push({ label: "Running DQ analysis", status: "done" });
      const { items } = await pipelineService.getExecutions({
        filters: pipeline ? { pipelineId: [pipeline.id] } : undefined,
        sortKey: "startTime",
        sortDirection: "desc",
        pageSize: 50,
      });
      const match = countryCode ? items.find((e) => e.country === countryCode) : items[0];
      if (!match) {
        text = "I couldn't find that pipeline to run a DQ analysis against.";
      } else if (match.incidentId) {
        const incident = await incidentService.getIncident(match.incidentId);
        const failCount = incident?.dq?.checks.filter((c) => c.status === "FAIL").length ?? 0;
        text = `DQ analysis for ${match.pipelineName} (${match.country}): ${
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
        text = `${match.pipelineName} (${match.country}, run ${match.runId}) completed with status ${match.status} — no DQ issues were flagged.`;
        cards = [
          { type: "pipeline", title: match.pipelineName, subtitle: `${match.country} · Run ${match.runId}`, status: match.status, href: `/pipelines/${match.runId}` },
        ];
      }
    } else if (content.includes("why") && content.includes("fail")) {
      toolCalls.push({ label: "Finding the most recent failure", status: "done" });
      toolCalls.push({ label: "Reading AI investigation", status: "done" });
      const { items } = await pipelineService.getExecutions({
        filters: { status: ["FAILED", "TIMED_OUT"], pipelineId: pipeline ? [pipeline.id] : undefined },
        pageSize: 1,
      });
      const latest = items[0];
      if (!latest?.incidentId) {
        text = "I couldn't find a recent pipeline failure with a completed investigation.";
      } else {
        const incident = await incidentService.getIncident(latest.incidentId);
        text =
          incident?.investigation?.status === "COMPLETE"
            ? `${latest.pipelineName} (${latest.country}) failed — ${incident.investigation.rootCause}`
            : `${latest.pipelineName} (${latest.country}) failed. Investigation is still in progress.`;
        cards = [
          {
            type: "incident",
            title: incident?.incidentId ?? latest.incidentId,
            subtitle: `${latest.pipelineName} — ${incident?.status ?? "OPEN"}`,
            href: `/incidents/${latest.incidentId}`,
          },
        ];
      }
    } else if (content.includes("countr") && content.includes("fail")) {
      toolCalls.push({ label: "Querying failed pipeline executions by country", status: "done" });
      const { items } = await pipelineService.getExecutions({ filters: { status: ["FAILED", "TIMED_OUT"] }, pageSize: 50 });
      const byCountry = new Map<string, number>();
      for (const e of items) byCountry.set(e.country, (byCountry.get(e.country) ?? 0) + 1);
      const ranked = Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1]);
      text =
        ranked.length === 0
          ? "No countries currently have failed pipeline executions."
          : `Failed executions by country: ${ranked.map(([c, n]) => `${c} (${n})`).join(", ")}.`;
    } else if (countryCode && content.includes("fail")) {
      toolCalls.push({ label: `Querying failed executions for ${countryCode}`, status: "done" });
      const { items } = await pipelineService.getExecutions({ filters: { status: ["FAILED", "TIMED_OUT"], country: [countryCode] }, pageSize: 20 });
      text = items.length === 0 ? `No failed pipeline executions for ${countryCode}.` : `${items.length} failed execution${items.length > 1 ? "s" : ""} for ${countryCode}.`;
      cards = items.slice(0, 5).map((e) => ({
        type: "pipeline",
        title: e.pipelineName,
        subtitle: `${e.country} · Run ${e.runId} — ${e.trigger.name}`,
        status: e.status,
        href: `/pipelines/${e.runId}`,
      }));
    } else if (content.includes("failed") && (content.includes("today") || content.includes("pipeline") || content.includes("latest"))) {
      toolCalls.push({ label: "Querying today's pipeline executions", status: "done" });
      const { items } = await pipelineService.getExecutions({
        filters: { status: ["FAILED", "TIMED_OUT"] },
        sortKey: "startTime",
        sortDirection: "desc",
        pageSize: content.includes("latest") ? 1 : 20,
      });
      text = items.length === 0 ? "No pipelines have failed today." : `${items.length} pipeline execution${items.length > 1 ? "s" : ""} failed.`;
      cards = items.slice(0, 5).map((e) => ({
        type: "pipeline",
        title: e.pipelineName,
        subtitle: `${e.country} · Run ${e.runId} — ${e.trigger.name}`,
        status: e.status,
        href: `/pipelines/${e.runId}`,
      }));
    } else if (content.includes("gold")) {
      toolCalls.push({ label: "Querying Gold Integration executions", status: "done" });
      const { items } = await pipelineService.getExecutions({
        filters: { pipelineId: ["gold_integration"], country: countryCode ? [countryCode] : undefined },
        sortKey: "startTime",
        sortDirection: "desc",
        pageSize: 1,
      });
      const latest = items[0];
      text = latest
        ? `Latest Gold Integration run (${latest.country}, run ${latest.runId}): ${latest.status}.`
        : "I couldn't find a recent Gold Integration execution.";
      cards = latest
        ? [{ type: "pipeline", title: latest.pipelineName, subtitle: `${latest.country} · Run ${latest.runId}`, status: latest.status, href: `/pipelines/${latest.runId}` }]
        : [];
    } else {
      const looksLikeDataQuestion = /\btable\b|\bcolumn\b|\bdatabase\b|\bselect\b|\bschema\b/.test(content);
      const inScope = IN_SCOPE_KEYWORDS.some((k) => content.includes(k));

      if (looksLikeDataQuestion && !inScope) {
        toolCalls.push({ label: "Checking Sentinel AI Pipeline data scope", status: "done" });
        text =
          "That's outside the Sentinel AI Pipeline data scope. I can answer questions about material master, vendor/material, sales orders, and the procurement/sales/gold pipeline tables — try one of the suggested prompts.";
      } else {
        toolCalls.push({ label: "Reviewing pipeline status", status: "done" });
        const { items: openIncidents } = await incidentService.getIncidents();
        const attention = openIncidents.filter((i) =>
          ["OPEN", "INVESTIGATING", "WAITING_APPROVAL", "REMEDIATION_FAILED", "VALIDATION_FAILED"].includes(i.status),
        );
        text =
          `I can help with material master, procurement, sales, and Gold Integration data, plus pipeline failures, DQ/SLA, and remediation. ` +
          `Right now there ${attention.length === 1 ? "is" : "are"} ${attention.length} incident${
            attention.length === 1 ? "" : "s"
          } needing attention.`;
        cards = attention.slice(0, 3).map((i) => ({
          type: "incident",
          title: i.incidentId,
          subtitle: `${i.pipelineName} (${i.country}) — ${i.status.replaceAll("_", " ")}`,
          status: i.status,
          href: `/incidents/${i.incidentId}`,
        }));
      }
    }

    const reply: ChatMessage = {
      id: id(),
      role: "assistant",
      content: text,
      timestamp: new Date().toISOString(),
      resultCards: cards.length > 0 ? cards : undefined,
      queryResult,
    };

    return delay({ toolCalls, reply }, 900);
  }
}

export const chatService: ChatService = new MockChatService();
