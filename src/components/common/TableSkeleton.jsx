import React from "react";

/**
 * Skeleton loader rows for div-based tables, e.g. the "Recent Weddings" table.
 * Drop it in place of your real row components while data is loading.
 *
 * Usage:
 *   <div>
 *     {isLoading ? (
 *       <TableSkeleton rows={3} columns={5} />
 *     ) : (
 *       weddings.map((wedding) => <WeddingRow key={wedding.id} {...wedding} />)
 *     )}
 *   </div>
 */
export default function TableSkeleton({
  rows = 5,
  columns = 5,
  hasAvatar = true,
  lastColumnIsBadge = true,
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-6 px-6 py-4 border-b border-gray-100 last:border-b-0 dark:border-gray-800"
        >
          {Array.from({ length: columns }).map((_, colIndex) => {
            const isFirstColumn = colIndex === 0;
            const isLastColumn = colIndex === columns - 1;

            return (
              <div
                key={colIndex}
                className={`flex-1 ${isFirstColumn ? "min-w-[180px]" : ""}`}
              >
                {hasAvatar && isFirstColumn ? (
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <div className="flex flex-col gap-2">
                      <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                ) : lastColumnIsBadge && isLastColumn ? (
                  <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                ) : (
                  <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
