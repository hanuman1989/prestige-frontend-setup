import { CheckLineIcon } from "@/icons";

export const stepLabels = [
  "Basic Details",
  "Categories & Destinations",
  "Itineraries",
  "Package Details",
  "Photos",
];

export default function PackageStepper({ step, record, busy, onNavigate }) {
  return (
    <nav
      aria-label="Package progress"
      className="overflow-x-auto rounded-xl border border-[#dce3f1] bg-white px-5 py-6 dark:border-gray-800 dark:bg-gray-900"
    >
      <ol className="flex min-w-150 items-start">
        {stepLabels.map((label, index) => {
          const number = index + 1;
          const completed =
            record?.completed_steps?.includes(number) ??
            number < (record?.current_step ?? 1);
          const available =
            record?.is_complete ||
            record?.current_step === 6 ||
            completed ||
            number === (record?.current_step ?? 1);
          return (
            <li
              key={label}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {index < 4 && (
                <span
                  aria-hidden="true"
                  className={`absolute start-[calc(50%+28px)] top-6 h-px w-[calc(100%-56px)] ${completed ? "bg-[#004bff]" : "bg-blue-200 dark:bg-gray-700"}`}
                />
              )}
              <button
                type="button"
                disabled={!available || busy}
                aria-current={number === step ? "step" : undefined}
                aria-label={`${label}${completed ? ", saved" : !available ? ", save earlier steps first" : ""}`}
                onClick={() => onNavigate(number)}
                className="relative z-10 flex flex-col items-center gap-3 rounded-md px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:cursor-not-allowed"
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-full border text-lg font-medium ${number === step || completed ? "border-[#004bff] bg-[#004bff] text-white" : "border-blue-200 bg-white text-[#53699b] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"}`}
                >
                  {completed && number !== step ? (
                    <CheckLineIcon
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className="block size-6 shrink-0"
                    />
                  ) : (
                    number
                  )}
                </span>
                <span
                  className={
                    number === step
                      ? "font-semibold text-[#004bff] dark:text-blue-400"
                      : "text-[#53699b] dark:text-gray-400"
                  }
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
