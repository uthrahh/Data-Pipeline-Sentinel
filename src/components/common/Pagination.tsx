import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNumbers = getPageWindow(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-text-tertiary">
        Showing <span className="font-medium text-text-secondary">{start}-{end}</span> of{" "}
        <span className="font-medium text-text-secondary">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex size-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pageNumbers.map((n, i) =>
          n === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-text-tertiary">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                n === page
                  ? "bg-accent-500 text-white"
                  : "text-text-secondary hover:bg-surface-muted",
              )}
            >
              {n}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex size-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function getPageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = Array.from(pages)
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) result.push("…");
    result.push(n);
    prev = n;
  }
  return result;
}
