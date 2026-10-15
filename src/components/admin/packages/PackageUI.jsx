import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from "@headlessui/react";
import { ChevronLeftIcon, ArrowRightIcon } from "@/icons";

export const inputClasses =
  "mt-2 min-h-11 w-full rounded-md border border-[#dce3f1] bg-white px-3 py-2.5 text-sm text-[#0b164d] outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 aria-invalid:border-red-500 placeholder:text-[#8a9ac0] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";
export const secondaryClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-blue-200 px-5 py-2.5 text-sm font-medium text-[#004bff] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-gray-800";
export const primaryClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#004bff] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

export function Card({ title, description, children, badge }) {
  return (
    <section className="min-w-0 rounded-xl border border-[#dce3f1] bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-[#53699b] dark:text-gray-400">
            {description}
          </p>
        </div>
        {badge}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function FieldError({ name, error }) {
  return error?.message ? (
    <p
      id={`package-${name}-error`}
      role="alert"
      className="mt-1 text-sm text-red-600 dark:text-red-400"
    >
      {error.message}
    </p>
  ) : null;
}

export function StepActions({
  step,
  busy,
  submitDisabled,
  onNavigate,
  finalLabel,
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce3f1] bg-white p-4 md:p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onNavigate(step - 1)}
            className={secondaryClasses}
          >
            <ChevronLeftIcon className="size-5" aria-hidden="true" />
            Back
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onNavigate(null)}
          className={secondaryClasses}
        >
          Cancel
        </button>
      </div>
      <button
        type="submit"
        disabled={busy || submitDisabled}
        className={primaryClasses}
      >
        {busy ? "Saving..." : step === 5 ? finalLabel : "Save & Next"}
        <ArrowRightIcon className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  busy,
  destructive,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog
      open
      onClose={() => {
        if (!busy) onClose();
      }}
      className="relative z-99999"
    >
      <DialogBackdrop className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
          <DialogTitle className="text-xl font-semibold text-[#0b164d] dark:text-white">
            {title}
          </DialogTitle>
          <Description className="mt-3 text-sm text-[#53699b] dark:text-gray-400">
            {description}
          </Description>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className={secondaryClasses}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className={
                destructive
                  ? `${primaryClasses} bg-red-600 hover:bg-red-700`
                  : primaryClasses
              }
            >
              {busy
                ? destructive
                  ? "Deleting..."
                  : "Saving..."
                : confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
