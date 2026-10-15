"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// Submission and server errors are shared; each step owns its fields and rules.
export default function usePackageStep({
  step,
  defaultValues,
  onSave,
  onDirty,
  onBusy,
}) {
  const form = useForm({
    defaultValues,
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const submissionRef = useRef(false);
  const focusRef = useRef(null);
  const { isDirty, isSubmitting } = form.formState;
  const { setFocus } = form;

  useEffect(() => {
    onDirty(step, isDirty);
  }, [step, isDirty, onDirty]);
  useEffect(() => {
    if (!isSubmitting && focusRef.current) {
      setFocus(focusRef.current);
      focusRef.current = null;
    }
  }, [isSubmitting, setFocus]);

  async function submit(event, buildPayload) {
    event.preventDefault();
    if (submissionRef.current) return;
    submissionRef.current = true;
    onBusy(true);
    form.clearErrors("root.server");
    try {
      await form.handleSubmit(async (values) => {
        try {
          await onSave(step, buildPayload(values));
        } catch (failure) {
          const unmapped = [];
          const grouped = {};
          Object.entries(failure.errors ?? {}).forEach(
            ([backendName, messages]) => {
              let name =
                step === 3
                  ? backendName.replace(
                      /^(itineraries\.\d+)\.image$/,
                      "$1.image_file",
                    )
                  : backendName;
              if (
                /^(category_ids|destination_ids|deleted_itinerary_ids|deleted_image_ids)\./.test(
                  name,
                )
              )
                name = name.split(".")[0];
              const message = Array.isArray(messages)
                ? messages.join(" ")
                : String(messages);
              if (Object.hasOwn(defaultValues, name.split(".")[0])) {
                grouped[name] = grouped[name]
                  ? `${grouped[name]} ${message}`
                  : message;
                const value = form.getValues(name);
                if (
                  typeof value === "string" ||
                  typeof value === "boolean" ||
                  name.endsWith(".image_file") ||
                  ["category_ids", "destination_ids"].includes(name)
                )
                  focusRef.current ??= name;
                if (step === 5 && /^photos(?:\.|$)/.test(name))
                  focusRef.current ??= "uploads";
              } else unmapped.push(message);
            },
          );
          Object.entries(grouped).forEach(([name, message]) =>
            form.setError(name, { type: "server", message }),
          );
          const message = [
            failure.message || "Unable to save this step. Please try again.",
            ...unmapped,
          ].join(" ");
          form.setError("root.server", { type: "server", message });
          toast.error(message, { position: "bottom-center" });
        }
      })(event);
    } finally {
      submissionRef.current = false;
      onBusy(false);
    }
  }

  return { ...form, submit, submissionRef };
}
