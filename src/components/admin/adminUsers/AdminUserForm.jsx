import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Description } from "@headlessui/react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { CloseIcon } from "@/icons";
import {
  applyAdminUserErrors,
  buildAdminUserPayload,
  getAdminUserDefaults,
  getAdminUserRules,
} from "@/lib/validation/adminUser";

const fieldClasses = "mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 aria-invalid:border-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:aria-invalid:border-red-500";
const fields = [
  { name: "first_name", label: "First name", type: "text", autoComplete: "given-name", maxLength: 255 },
  { name: "last_name", label: "Last name", type: "text", autoComplete: "family-name", maxLength: 255 },
  { name: "mobile", label: "Mobile", type: "tel", autoComplete: "tel", maxLength: 30 },
  { name: "email", label: "Email", type: "email", autoComplete: "email", maxLength: 255 },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", maxLength: 255 },
  { name: "password_confirmation", label: "Confirm password", type: "password", autoComplete: "new-password", maxLength: 255 },
];

export default function AdminUserForm({ user, onClose, onSave }) {
  const isEditing = Boolean(user);
  const submissionRef = useRef(false);
  const serverErrorRef = useRef(null);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: getAdminUserDefaults(user),
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const rules = getAdminUserRules(isEditing);

  useEffect(() => {
    if (!isSubmitting && serverErrorRef.current) {
      setFocus(serverErrorRef.current);
      serverErrorRef.current = null;
    }
  }, [isSubmitting, setFocus]);

  function closeForm() {
    if (!submissionRef.current) onClose();
  }

  async function saveForm(values) {
    try {
      await onSave(buildAdminUserPayload(values, isEditing));
    } catch (error) {
      serverErrorRef.current = applyAdminUserErrors(error, setError, isEditing);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (submissionRef.current) return;

    submissionRef.current = true;
    try {
      await handleSubmit(saveForm)(event);
    } finally {
      submissionRef.current = false;
    }
  }

  return (
    <Dialog open onClose={closeForm} className="relative z-99999">
      <DialogBackdrop className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="relative my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8 dark:bg-gray-900">
          <button
            type="button"
            onClick={closeForm}
            disabled={isSubmitting}
            aria-label="Close admin form"
            className="absolute end-5 top-5 flex size-9 items-center justify-center rounded-full bg-gray-100 p-0 leading-none text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <CloseIcon aria-hidden="true" className="block size-6 shrink-0" />
          </button>
          <DialogTitle className="pe-10 text-2xl font-semibold text-[#0b164d] dark:text-white">
            {isEditing ? "Edit Admin" : "Add Admin"}
          </DialogTitle>
          <Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage account details and administrator access.
          </Description>
          <form onSubmit={submit} noValidate aria-busy={isSubmitting} className="mt-6 space-y-4">
            {errors.root?.server && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {errors.root.server.message}
              </p>
            )}
            <fieldset disabled={isSubmitting} className="grid gap-4 sm:grid-cols-2 disabled:opacity-70">
              <legend className="sr-only">Administrator details</legend>
              {fields.map(({ name, label, ...inputProps }) => {
                if (isEditing && inputProps.type === "password") return null;
                const error = errors[name];
                const isPassword = name === "password";
                const isOptional = name === "mobile";
                const isDisabled = isEditing && name === "email";
                const describedBy = [
                  isPassword && "admin-password-hint",
                  error && `admin-${name}-error`,
                ].filter(Boolean).join(" ") || undefined;

                return (
                  <div key={name} className={name === "first_name" || name === "last_name" ? "" : "sm:col-span-2"}>
                    <label htmlFor={`admin-${name}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}{isOptional && <span className="ms-1 font-normal text-gray-400">(optional)</span>}
                    </label>
                    <input
                      {...inputProps}
                      {...register(name, rules[name])}
                      id={`admin-${name}`}
                      autoFocus={name === "first_name"}
                      aria-required={!isOptional && !isDisabled}
                      aria-invalid={Boolean(error)}
                      aria-describedby={describedBy}
                      className={fieldClasses}
                    />
                    {isPassword && (
                      <p id="admin-password-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Use at least 8 characters.
                      </p>
                    )}
                    {error && <p id={`admin-${name}-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>}
                  </div>
                );
              })}
              <div className="sm:col-span-2">
                <label htmlFor="admin-form-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  {...register("status", rules.status)}
                  id="admin-form-status"
                  aria-required="true"
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={errors.status ? "admin-form-status-error" : undefined}
                  className={fieldClasses}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
                {errors.status && <p id="admin-form-status-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>}
              </div>
            </fieldset>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <button type="button" onClick={closeForm} disabled={isSubmitting} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#004bff] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Admin"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
