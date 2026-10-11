"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from "@headlessui/react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { CloseIcon } from "@/icons";

const inputClasses = "mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 aria-invalid:border-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:aria-invalid:border-red-500";

export default function ChangePasswordDialog({ user, onClose, onUpdate }) {
  const submissionRef = useRef(false);
  const closingRef = useRef(false);
  const serverFocusRef = useRef(null);
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { password: "", password_confirmation: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!isSubmitting && !closingRef.current && serverFocusRef.current) {
      setFocus(serverFocusRef.current);
      serverFocusRef.current = null;
    }
  }, [isSubmitting, setFocus]);

  function closeDialog() {
    if (submissionRef.current) return;
    closingRef.current = true;
    serverFocusRef.current = null;
    reset();
    onClose();
  }

  function handleBlurCapture(event) {
    if (closingRef.current || event.relatedTarget?.closest("[data-close-password-dialog]")) {
      event.stopPropagation();
    }
  }

  async function updatePassword(values) {
    try {
      await onUpdate({
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
    } catch (error) {
      const unmapped = [];
      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        const message = Array.isArray(messages) ? messages.join(" ") : String(messages);
        if (field === "password" || field === "password_confirmation") {
          setError(field, { type: "server", message });
          serverFocusRef.current ??= field;
        } else {
          unmapped.push(message);
        }
      });
      setError("root.server", {
        type: "server",
        message: [error.message || "Unable to change the password. Please try again.", ...unmapped].join(" "),
      });
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (submissionRef.current) return;
    submissionRef.current = true;
    try {
      await handleSubmit(updatePassword)(event);
    } finally {
      submissionRef.current = false;
    }
  }

  return (
    <Dialog open onClose={closeDialog} className="relative z-99999">
      <DialogBackdrop className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel onBlurCapture={handleBlurCapture} className="relative my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8 dark:bg-gray-900">
          <button type="button" data-close-password-dialog onMouseDown={(event) => event.preventDefault()} onClick={closeDialog} disabled={isSubmitting} aria-label="Close change password form" className="absolute end-5 top-5 flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
            <CloseIcon aria-hidden="true" className="block size-6 shrink-0" />
          </button>
          <DialogTitle className="pe-10 text-xl font-semibold text-[#0b164d] dark:text-white">
            Change Password
          </DialogTitle>
          <Description className="mt-3 text-sm text-[#53699b] dark:text-gray-400">
            Set a new password for {user.full_name || user.name || user.email}. They will need to sign in again.
          </Description>
          <form onSubmit={submit} noValidate aria-busy={isSubmitting} className="mt-6 space-y-4">
            {errors.root?.server && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {errors.root.server.message}
              </p>
            )}
            <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-70">
              <legend className="sr-only">New password</legend>
              <div>
                <label htmlFor="change-admin-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  {...register("password", {
                    required: "Enter a new password.",
                    minLength: { value: 8, message: "Use at least 8 characters." },
                    maxLength: { value: 255, message: "Use no more than 255 characters." },
                    deps: ["password_confirmation"],
                  })}
                  id="change-admin-password"
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  maxLength={255}
                  aria-required="true"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={`change-admin-password-hint${errors.password ? " change-admin-password-error" : ""}`}
                  className={inputClasses}
                />
                <p id="change-admin-password-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">Use at least 8 characters.</p>
                {errors.password && <p id="change-admin-password-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
              </div>
              <div>
                <label htmlFor="change-admin-password-confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm password <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  {...register("password_confirmation", {
                    required: "Confirm the new password.",
                    maxLength: { value: 255, message: "Use no more than 255 characters." },
                    validate: (value) => value === getValues("password") || "Passwords must match.",
                  })}
                  id="change-admin-password-confirmation"
                  type="password"
                  autoComplete="new-password"
                  maxLength={255}
                  aria-required="true"
                  aria-invalid={Boolean(errors.password_confirmation)}
                  aria-describedby={errors.password_confirmation ? "change-admin-password-confirmation-error" : undefined}
                  className={inputClasses}
                />
                {errors.password_confirmation && <p id="change-admin-password-confirmation-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password_confirmation.message}</p>}
              </div>
            </fieldset>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <button type="button" data-close-password-dialog disabled={isSubmitting} onMouseDown={(event) => event.preventDefault()} onClick={closeDialog} className="rounded-md border border-[#dce3f1] px-4 py-2 text-sm font-medium text-[#53699b] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-[#004bff] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
                {isSubmitting ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
