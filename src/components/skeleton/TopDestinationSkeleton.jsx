export default function TopDestinationSkeleton({ count = 5 }) {
  const cardCount = Number.isInteger(count) && count > 0 ? count : 5;

  return (
    <div role="status">
      <span className="sr-only">Loading top destinations...</span>
      <div
        className="grid grid-flow-col auto-cols-[100%] overflow-hidden min-[767px]:auto-cols-[var(--skeleton-tablet-width)] min-[992px]:auto-cols-[var(--skeleton-laptop-width)] min-[1025px]:auto-cols-[var(--skeleton-desktop-width)]"
        style={{
          "--skeleton-tablet-width": `${100 / Math.min(cardCount, 3)}%`,
          "--skeleton-laptop-width": `${100 / Math.min(cardCount, 4)}%`,
          "--skeleton-desktop-width": `${100 / Math.min(cardCount, 5)}%`,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: cardCount }, (_, index) => (
          <div key={index} className="min-w-0">
            <div className="relative m-2 h-72 animate-pulse overflow-hidden rounded-md bg-slate-200 shadow-sm motion-reduce:animate-none dark:bg-slate-800 dark:shadow-gray-800">
              <div className="absolute inset-x-0 bottom-0 space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-slate-300 dark:bg-slate-700" />
                <div className="h-3 w-1/2 rounded bg-slate-300 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
