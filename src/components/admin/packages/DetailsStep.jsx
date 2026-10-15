"use client";

import { Controller } from "react-hook-form";
import usePackageStep from "./usePackageStep";
import RichTextEditor from "./RichTextEditor";
import { Card, FieldError, StepActions } from "./PackageUI";

export default function DetailsStep({
  record,
  active,
  busy,
  onSave,
  onNavigate,
  onDirty,
  onBusy,
}) {
  const {
    control,
    submit,
    formState: { errors, isSubmitting },
  } = usePackageStep({
    step: 4,
    onSave,
    onDirty,
    onBusy,
    defaultValues: {
      inclusion: record?.inclusion ?? "",
      exclusion: record?.exclusion ?? "",
      accommodation_details: record?.accommodation_details ?? "",
      transportation: record?.transportation ?? "",
      description: record?.description ?? "",
    },
  });
  return (
    <form
      hidden={!active}
      noValidate
      aria-busy={isSubmitting}
      onSubmit={(event) => submit(event, (values) => values)}
    >
      <FieldError name="details-server" error={errors.root?.server} />
      <fieldset
        disabled={busy || !active}
        className="min-w-0 disabled:opacity-70"
      >
        <legend className="sr-only">Package details</legend>
        <Card
          title="Package Details"
          description="Explain what is included and how the tour is arranged."
        >
          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <Controller
              name="inclusion"
              control={control}
              render={({ field, fieldState }) => (
                <RichTextEditor
                  id="package-inclusion"
                  label="Inclusion"
                  placeholder="List services included in the package."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={fieldState.error}
                  disabled={busy}
                />
              )}
            />
            <Controller
              name="exclusion"
              control={control}
              render={({ field, fieldState }) => (
                <RichTextEditor
                  id="package-exclusion"
                  label="Exclusion"
                  placeholder="List services not included in the package."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={fieldState.error}
                  disabled={busy}
                />
              )}
            />
            <Controller
              name="accommodation_details"
              control={control}
              render={({ field, fieldState }) => (
                <RichTextEditor
                  id="package-accommodation_details"
                  label="Accommodation details"
                  placeholder="Describe hotels and room arrangements."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={fieldState.error}
                  disabled={busy}
                />
              )}
            />
            <Controller
              name="transportation"
              control={control}
              render={({ field, fieldState }) => (
                <RichTextEditor
                  id="package-transportation"
                  label="Transportation"
                  placeholder="Describe transfers and transport."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={fieldState.error}
                  disabled={busy}
                />
              )}
            />
          </div>
          <Controller
            name="description"
            control={control}
            rules={{
              required: "Enter the package description.",
              validate: (value) =>
                /\S/.test(
                  value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " "),
                ) || "Enter the package description.",
            }}
            render={({ field, fieldState }) => (
              <RichTextEditor
                id="package-description"
                label="Description"
                required
                placeholder="Write the package overview and highlights."
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                error={fieldState.error}
                disabled={busy}
              />
            )}
          />
        </Card>
      </fieldset>
      <StepActions step={4} busy={busy} onNavigate={onNavigate} />
    </form>
  );
}
