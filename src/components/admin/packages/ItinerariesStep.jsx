"use client";

import { useRef } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { PlusIcon, TrashBinIcon, ArrowUpIcon, ArrowDownIcon } from "@/icons";
import ImageUpload from "@/components/admin/common/ImageUpload";
import usePackageStep from "./usePackageStep";
import RichTextEditor from "./RichTextEditor";
import {
  Card,
  FieldError,
  StepActions,
  inputClasses,
  secondaryClasses,
} from "./PackageUI";

export default function ItinerariesStep({
  record,
  active,
  busy,
  onSave,
  onNavigate,
  onDirty,
  onBusy,
}) {
  const dragRef = useRef(null);
  const {
    control,
    register,
    watch,
    setValue,
    getValues,
    submit,
    formState: { errors, isSubmitting },
  } = usePackageStep({
    step: 3,
    onSave,
    onDirty,
    onBusy,
    defaultValues: {
      itineraries: record?.itineraries?.length
        ? record.itineraries.map((item) => ({ ...item, image_file: [] }))
        : [{ title: "", description: "", image_file: [] }],
      deleted_itinerary_ids: [],
    },
  });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "itineraries",
    keyName: "fieldKey",
    rules: {
      required: "Add at least one itinerary.",
      minLength: { value: 1, message: "Add at least one itinerary." },
      maxLength: { value: 100, message: "Use no more than 100 itineraries." },
    },
  });
  const items = watch("itineraries");

  function validateImage(files) {
    if (files?.length > 1) return "Choose one image.";
    const file = files?.[0];
    if (!file) return true;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      !/\.(jpe?g|png|webp)$/i.test(file.name)
    )
      return "Choose a PNG, JPG or WebP image.";
    return file.size <= 2 * 1024 * 1024 || "Image must be no larger than 2 MB.";
  }

  function deleteItinerary(index) {
    if (busy) return;
    const id = getValues(`itineraries.${index}.id`);
    if (id)
      setValue(
        "deleted_itinerary_ids",
        [...getValues("deleted_itinerary_ids"), id],
        { shouldDirty: true },
      );
    remove(index);
  }

  function buildPayload(values) {
    const data = new FormData();
    values.itineraries.forEach((item, index) => {
      if (item.id) data.append(`itineraries[${index}][id]`, item.id);
      data.append(`itineraries[${index}][title]`, item.title);
      data.append(`itineraries[${index}][description]`, item.description);
      data.append(`itineraries[${index}][sort_order]`, index + 1);
      if (item.image_file?.[0])
        data.append(`itineraries[${index}][image]`, item.image_file[0]);
    });
    values.deleted_itinerary_ids.forEach((id, index) =>
      data.append(`deleted_itinerary_ids[${index}]`, id),
    );
    return data;
  }

  return (
    <form
      hidden={!active}
      noValidate
      aria-busy={isSubmitting}
      onSubmit={(event) => submit(event, buildPayload)}
    >
      <FieldError name="itineraries-server" error={errors.root?.server} />
      <fieldset
        disabled={busy || !active}
        className="min-w-0 disabled:opacity-70"
      >
        <legend className="sr-only">Package itineraries</legend>
        <Card
          title="Itineraries"
          description="Build your day-by-day travel plan."
        >
          <p className="rounded-lg bg-blue-50 p-3 text-sm text-[#53699b] dark:bg-blue-500/10 dark:text-gray-400">
            Drag cards or use the arrow buttons to change their order.
          </p>
          <FieldError
            name="itineraries"
            error={errors.itineraries?.root ?? errors.itineraries}
          />
          {fields.map((field, index) => (
            <section
              key={field.fieldKey}
              onDragOver={(event) => {
                if (dragRef.current !== null) event.preventDefault();
              }}
              onDrop={(event) => {
                if (dragRef.current === null || busy) return;
                event.preventDefault();
                move(dragRef.current, index);
                dragRef.current = null;
              }}
              className="rounded-lg border border-[#dce3f1] p-4 md:p-5 dark:border-gray-700"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Itinerary {index + 1}</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    draggable={!busy}
                    onDragStart={(event) => {
                      dragRef.current = index;
                      event.dataTransfer.setData("text/plain", String(index));
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      dragRef.current = null;
                    }}
                    aria-label={`Drag itinerary ${index + 1}`}
                    className="cursor-grab rounded px-2 py-1 text-[#53699b] focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    ⠿
                  </button>
                  <button
                    type="button"
                    disabled={index === 0 || busy}
                    onClick={() => move(index, index - 1)}
                    aria-label={`Move itinerary ${index + 1} up`}
                    className="rounded p-2 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-30"
                  >
                    <ArrowUpIcon aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === fields.length - 1 || busy}
                    onClick={() => move(index, index + 1)}
                    aria-label={`Move itinerary ${index + 1} down`}
                    className="rounded p-2 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-30"
                  >
                    <ArrowDownIcon aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || fields.length === 1}
                    onClick={() => deleteItinerary(index)}
                    className="inline-flex items-center gap-1 rounded p-2 text-sm text-red-600 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-30 dark:text-red-400"
                  >
                    <TrashBinIcon aria-hidden="true" className="size-4" />
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)]">
                <div>
                  <ImageUpload
                    id={`package-itineraries.${index}.image_file`}
                    label={`Itinerary ${index + 1} image`}
                    existingImageUrl={items[index]?.image_url}
                    selectedFile={items[index]?.image_file?.[0] ?? null}
                    disabled={busy}
                    error={
                      errors.itineraries?.[index]?.image_file ??
                      errors.itineraries?.[index]?.image
                    }
                    inputProps={register(`itineraries.${index}.image_file`, {
                      validate: validateImage,
                    })}
                    onChange={(files) => {
                      if (busy) return false;
                      setValue(`itineraries.${index}.image_file`, files, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      return validateImage(files) === true;
                    }}
                  />
                </div>
                <div className="min-w-0 space-y-4">
                  <div>
                    <label
                      htmlFor={`package-itineraries.${index}.title`}
                      className="block text-sm font-medium"
                    >
                      Title{" "}
                      <span aria-hidden="true" className="text-red-500">
                        *
                      </span>
                    </label>
                    <input
                      id={`package-itineraries.${index}.title`}
                      className={inputClasses}
                      placeholder={`e.g. Day ${index + 1} – Arrival in Jaipur`}
                      maxLength={255}
                      aria-required="true"
                      aria-invalid={Boolean(errors.itineraries?.[index]?.title)}
                      aria-describedby={`package-itineraries.${index}.title-error`}
                      {...register(`itineraries.${index}.title`, {
                        required: "Enter the itinerary title.",
                        validate: (value) =>
                          /\S/.test(value) || "Enter the itinerary title.",
                        maxLength: {
                          value: 255,
                          message: "Use no more than 255 characters.",
                        },
                      })}
                    />
                    <FieldError
                      name={`itineraries.${index}.title`}
                      error={errors.itineraries?.[index]?.title}
                    />
                  </div>
                  <Controller
                    name={`itineraries.${index}.description`}
                    control={control}
                    rules={{
                      required: "Describe the itinerary.",
                      validate: (value) =>
                        /\S/.test(
                          value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " "),
                        ) || "Describe the itinerary.",
                    }}
                    render={({ field: editorField, fieldState }) => (
                      <RichTextEditor
                        id={`package-itineraries.${index}.description`}
                        label="Description"
                        required
                        placeholder="Describe the activities for this itinerary."
                        value={editorField.value}
                        onChange={editorField.onChange}
                        onBlur={editorField.onBlur}
                        inputRef={editorField.ref}
                        error={fieldState.error}
                        disabled={busy}
                      />
                    )}
                  />
                </div>
              </div>
              <FieldError
                name={`itineraries.${index}.id`}
                error={errors.itineraries?.[index]?.id}
              />
              <FieldError
                name={`itineraries.${index}.sort_order`}
                error={errors.itineraries?.[index]?.sort_order}
              />
            </section>
          ))}
          <FieldError
            name="deleted_itinerary_ids"
            error={errors.deleted_itinerary_ids}
          />
          <button
            type="button"
            disabled={busy || fields.length >= 100}
            onClick={() =>
              append({ title: "", description: "", image_file: [] })
            }
            className={secondaryClasses}
          >
            <PlusIcon aria-hidden="true" className="size-5" />
            Add More Itineraries
          </button>
        </Card>
      </fieldset>
      <StepActions step={3} busy={busy} onNavigate={onNavigate} />
    </form>
  );
}
