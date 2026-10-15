"use client";

import { useEffect, useRef } from "react";
import { useFieldArray } from "react-hook-form";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrashBinIcon,
  UploadIcon,
  InfoIcon,
} from "@/icons";
import { ImagePreview } from "@/components/admin/common/ImageUpload";
import usePackageStep from "./usePackageStep";
import { Card, FieldError, StepActions, secondaryClasses } from "./PackageUI";

export default function PhotosStep({
  record,
  active,
  busy,
  onSave,
  onNavigate,
  onDirty,
  onBusy,
  finalLabel,
}) {
  const inputRef = useRef(null);
  const dragRef = useRef(null);
  const previewUrls = useRef(new Set());
  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);
  const {
    control,
    register,
    setError,
    clearErrors,
    getValues,
    setValue,
    submit,
    formState: { errors, isSubmitting },
  } = usePackageStep({
    step: 5,
    onSave,
    onDirty,
    onBusy,
    defaultValues: {
      photos: record?.images ?? [],
      deleted_image_ids: [],
      uploads: "",
    },
  });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "photos",
    keyName: "fieldKey",
    rules: {
      required: "Add at least one package photo.",
      minLength: { value: 1, message: "Add at least one package photo." },
      maxLength: { value: 100, message: "Use no more than 100 photos." },
    },
  });

  function addPhotos(files) {
    if (busy) return;
    const selected = Array.from(files);
    if (selected.length + fields.length > 100) {
      setError("uploads", {
        type: "validate",
        message: "Use no more than 100 photos.",
      });
      return;
    }
    const invalid = selected.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        !/\.(jpe?g|png|webp)$/i.test(file.name) ||
        file.size > 2 * 1024 * 1024,
    );
    if (invalid) {
      setError("uploads", {
        type: "validate",
        message: `${invalid.name}: choose a PNG, JPG or WebP image no larger than 2 MB.`,
      });
      return;
    }
    clearErrors("uploads");
    if (selected.length)
      append(
        selected.map((file) => {
          const preview_url = URL.createObjectURL(file);
          previewUrls.current.add(preview_url);
          return { image_file: file, preview_url };
        }),
        { shouldFocus: false },
      );
  }

  function deletePhoto(index) {
    if (busy) return;
    const id = getValues(`photos.${index}.id`);
    if (id)
      setValue("deleted_image_ids", [...getValues("deleted_image_ids"), id], {
        shouldDirty: true,
      });
    const preview = getValues(`photos.${index}.preview_url`);
    if (preview) {
      URL.revokeObjectURL(preview);
      previewUrls.current.delete(preview);
    }
    remove(index);
  }

  function buildPayload(values) {
    // JSON is sufficient when only reordering/deleting existing photos.
    if (!values.photos.some((photo) => photo.image_file))
      return {
        photos: values.photos.map((photo, index) => ({
          id: photo.id,
          sort_order: index + 1,
        })),
        deleted_image_ids: values.deleted_image_ids,
      };
    const data = new FormData();
    values.photos.forEach((photo, index) => {
      if (photo.id) data.append(`photos[${index}][id]`, photo.id);
      if (photo.image_file)
        data.append(`photos[${index}][image]`, photo.image_file);
      data.append(`photos[${index}][sort_order]`, index + 1);
    });
    values.deleted_image_ids.forEach((id, index) =>
      data.append(`deleted_image_ids[${index}]`, id),
    );
    return data;
  }

  return (
    <form
      hidden={!active}
      noValidate
      aria-busy={isSubmitting}
      onSubmit={(event) => {
        if (errors.uploads) {
          event.preventDefault();
          inputRef.current?.focus();
          return;
        }
        return submit(event, buildPayload);
      }}
    >
      <FieldError name="photos-server" error={errors.root?.server} />
      <fieldset
        disabled={busy || !active}
        className="min-w-0 disabled:opacity-70"
      >
        <legend className="sr-only">Package photos</legend>
        <Card
          title="Package Photos"
          description="Upload multiple photos and arrange their display order."
        >
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addPhotos(event.dataTransfer.files);
            }}
            className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-[#f8faff] p-5 text-center focus-within:ring-3 focus-within:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/40"
          >
            <UploadIcon
              aria-hidden="true"
              className="mb-3 size-12 text-[#004bff]"
            />
            <p className="font-medium text-[#004bff] dark:text-blue-400">
              Drag & drop photos here
            </p>
            <p className="my-2 text-sm text-[#53699b] dark:text-gray-400">or</p>
            <label
              htmlFor="package-uploads"
              className={`${secondaryClasses} cursor-pointer`}
            >
              Browse Photos
            </label>
            <input
              {...register("uploads")}
              ref={(element) => {
                inputRef.current = element;
                register("uploads").ref(element);
              }}
              id="package-uploads"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              aria-invalid={Boolean(errors.uploads)}
              aria-describedby="package-uploads-hint package-uploads-error"
              className="sr-only"
              onChange={(event) => {
                addPhotos(event.target.files);
                event.target.value = "";
              }}
            />
            <p
              id="package-uploads-hint"
              className="mt-3 text-xs text-[#53699b] dark:text-gray-400"
            >
              PNG, JPG or WebP · Up to 2 MB each · Maximum 100 photos.
            </p>
          </div>
          <FieldError name="uploads" error={errors.uploads} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold">
              Photo previews{" "}
              <span className="ms-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-normal text-[#004bff] dark:bg-blue-500/15 dark:text-blue-400">
                {fields.length} photos
              </span>
            </h3>
            <p className="text-xs text-[#53699b] dark:text-gray-400">
              Drag photos or use the arrow buttons to reorder.
            </p>
          </div>
          <FieldError
            name="photos"
            error={errors.photos?.root ?? errors.photos}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {fields.map((photo, index) => (
              <article
                key={photo.fieldKey}
                draggable={!busy}
                onDragStart={(event) => {
                  dragRef.current = index;
                  event.dataTransfer.setData("text/plain", String(index));
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  dragRef.current = null;
                }}
                onDragOver={(event) => {
                  if (dragRef.current !== null) event.preventDefault();
                }}
                onDrop={(event) => {
                  if (dragRef.current === null || busy) return;
                  event.preventDefault();
                  event.stopPropagation();
                  move(dragRef.current, index);
                  dragRef.current = null;
                }}
                className="relative overflow-hidden rounded-lg border border-[#dce3f1] dark:border-gray-700"
              >
                <ImagePreview
                  src={photo.preview_url ?? photo.image_url}
                  alt={`Package photo ${index + 1}`}
                  className="h-40 w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute start-2 top-2 rounded-full bg-[#004bff] px-3 py-1 text-xs text-white">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => deletePhoto(index)}
                  aria-label={`Remove photo ${index + 1}`}
                  className="absolute end-2 top-2 rounded-full bg-white p-2 text-red-600 shadow-sm focus-visible:outline-2 focus-visible:outline-red-600"
                >
                  <TrashBinIcon aria-hidden="true" className="size-4" />
                </button>
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">
                      {photo.image_file?.name ?? photo.image}
                    </span>
                    <span className="shrink-0 text-[#53699b] dark:text-gray-400">
                      Order {index + 1}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() => move(index, index - 1)}
                      aria-label={`Move photo ${index + 1} earlier`}
                      className="rounded border border-[#dce3f1] p-1.5 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-30 dark:border-gray-700"
                    >
                      <ArrowUpIcon aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                      aria-label={`Move photo ${index + 1} later`}
                      className="rounded border border-[#dce3f1] p-1.5 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-30 dark:border-gray-700"
                    >
                      <ArrowDownIcon aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  <FieldError
                    name={`photos.${index}.image`}
                    error={
                      errors.photos?.[index]?.image ??
                      errors.photos?.[index]?.id
                    }
                  />
                  <FieldError
                    name={`photos.${index}.sort_order`}
                    error={errors.photos?.[index]?.sort_order}
                  />
                </div>
              </article>
            ))}
          </div>
          <FieldError
            name="deleted_image_ids"
            error={errors.deleted_image_ids}
          />
          <p className="flex items-center gap-2 text-xs text-[#53699b] dark:text-gray-400">
            <InfoIcon aria-hidden="true" className="size-5" />
            First photo is used as the package listing image.
          </p>
        </Card>
      </fieldset>
      <StepActions
        step={5}
        busy={busy}
        onNavigate={onNavigate}
        finalLabel={finalLabel}
      />
    </form>
  );
}
