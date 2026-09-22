"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { PipelineFilters } from "@/components/dashboard/PipelineFilters";
import { PipelineTable } from "@/components/dashboard/PipelineTable";
import { Pagination } from "@/components/common/Pagination";
import { usePipelines } from "@/hooks/usePipelines";
import type { PipelineExecutionFilters, PipelineExecutionSortKey } from "@/types";

const PAGE_SIZE = 10;

export default function PipelinesPage() {
  const [filters, setFilters] = useState<PipelineExecutionFilters>({});
  const [sortKey, setSortKey] = useState<PipelineExecutionSortKey>("startTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = usePipelines({
    filters,
    sortKey,
    sortDirection,
    page,
    pageSize: PAGE_SIZE,
  });

  const handleFilterChange = (next: PipelineExecutionFilters) => {
    setFilters(next);
    setPage(1);
  };

  const handleSort = (key: PipelineExecutionSortKey) => {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
    setPage(1);
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pipeline Executions"
        description="Every pipeline run tracked by the connected Databricks workspace, in UTC."
      />

      <div className="p-4 sm:p-6">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <PipelineFilters filters={filters} onChange={handleFilterChange} resultCount={data.total} />
          <PipelineTable
            executions={data.items}
            isLoading={isLoading}
            error={error}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          {!isLoading && !error && data.total > 0 && (
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
}
