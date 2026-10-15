import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from "@headlessui/react";

export default function DeleteCarDialog({
  car,
  isDeleting,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog
      open
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      className="relative z-99999"
    >
      <DialogBackdrop className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
          <DialogTitle className="text-xl font-semibold text-[#0b164d] dark:text-white">
            Delete Car
          </DialogTitle>
          <Description className="mt-3 text-sm text-[#53699b] dark:text-gray-400">
            Are you sure you want to delete “{car.title}”? This action
            cannot be undone.
          </Description>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="rounded-md border border-[#dce3f1] px-4 py-2 text-sm font-medium text-[#53699b] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Car"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
