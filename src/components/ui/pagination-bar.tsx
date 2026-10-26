"use client";

export interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export function PaginationBar({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = "",
  itemLabel = "items",
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground bg-muted/20 border-t border-border/60 ${className}`}
    >
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const nextSize = Number(e.target.value);
                onPageSizeChange(nextSize);
                onPageChange(1);
              }}
              className="rounded-lg border border-border/60 bg-card px-2 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              aria-label={`Select ${itemLabel} per page`}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-medium text-foreground">
          {totalItems === 0 ? (
            `0 of 0 ${itemLabel}`
          ) : (
            <>
              <span className="font-mono">{startItem}</span>–
              <span className="font-mono">{endItem}</span> of{" "}
              <span className="font-mono">{totalItems}</span>
            </>
          )}
        </span>

        <div className="inline-flex items-center rounded-lg border border-border/60 bg-card p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={!canPrev}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            aria-label="Previous page"
            title="Previous page"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="h-4 w-px bg-border/60" />
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={!canNext}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            aria-label="Next page"
            title="Next page"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
