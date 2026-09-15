import type { ChatQueryResult } from "@/types";

/**
 * Structured tabular answer to a data question — kept distinct from prose so
 * data questions read as data, not conversational text. Renders whatever
 * shape the assistant returns; works unchanged once a real backend replaces
 * the mock SAP lookup with a live Databricks SQL / Genie result.
 */
export function ChatQueryResultTable({ result }: { result: ChatQueryResult }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="bg-surface-muted text-text-tertiary">
              {result.columns.map((col) => (
                <th key={col} className="whitespace-nowrap px-2.5 py-1.5 font-semibold uppercase tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={result.columns.length} className="px-2.5 py-3 text-center text-text-tertiary">
                  No rows found.
                </td>
              </tr>
            ) : (
              result.rows.map((row, i) => (
                <tr key={i} className="border-t border-border bg-surface">
                  {row.map((cell, j) => (
                    <td key={j} className="whitespace-nowrap px-2.5 py-1.5 text-text-primary">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border bg-surface-subtle px-2.5 py-1.5 font-mono text-[10px] text-text-tertiary" title={result.sourceTable}>
        {result.sourceTable}
      </p>
      {result.generatedSql && (
        <p className="truncate border-t border-border bg-navy-950 px-2.5 py-1.5 font-mono text-[10px] text-white/70" title={result.generatedSql}>
          {result.generatedSql}
        </p>
      )}
    </div>
  );
}
