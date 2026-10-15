"use client";

import { useState } from "react";
import { generateCategorySlug } from "@/components/admin/categories/CategoryForm";
import usePackageStep from "./usePackageStep";
import { Card, FieldError, StepActions, inputClasses } from "./PackageUI";

export default function BasicDetailsStep({
  record,
  active,
  busy,
  onSave,
  onNavigate,
  onDirty,
  onBusy,
}) {
  const [slugCustomized, setSlugCustomized] = useState(Boolean(record));
  const {
    register,
    setValue,
    watch,
    submit,
    formState: { errors, isSubmitting },
  } = usePackageStep({
    step: 1,
    onSave,
    onDirty,
    onBusy,
    defaultValues: {
      title: record?.title ?? "",
      slug: record?.slug ?? "",
      duration: record?.duration ?? "",
      tour_best_time: record?.tour_best_time ?? "",
      is_special_package: record?.is_special_package ?? false,
      status: record ? (record.status ? "1" : "0") : "1",
      meta_title: record?.meta_title ?? "",
      meta_keyword: record?.meta_keyword ?? "",
      meta_description: record?.meta_description ?? "",
    },
  });

  return (
    <form
      hidden={!active}
      noValidate
      aria-busy={isSubmitting}
      onSubmit={(event) =>
        submit(event, (values) => ({
          ...values,
          status: values.status === "1",
        }))
      }
    >
      <FieldError name="basic-server" error={errors.root?.server} />
      <fieldset
        disabled={busy || !active}
        className="grid min-w-0 gap-5 lg:grid-cols-2 disabled:opacity-70"
      >
        <legend className="sr-only">Basic details and SEO settings</legend>
        <Card
          title="Basic Details"
          description="Provide the basic information for this package."
        >
          <div>
            <label
              htmlFor="package-title"
              className="block text-sm font-medium"
            >
              Title{" "}
              <span aria-hidden="true" className="text-red-500">
                *
              </span>
            </label>
            <input
              id="package-title"
              className={inputClasses}
              placeholder="Enter package title"
              maxLength={255}
              aria-required="true"
              aria-invalid={Boolean(errors.title)}
              aria-describedby="package-title-error"
              {...register("title", {
                required: "Enter the package title.",
                validate: (value) =>
                  /\S/.test(value) || "Enter the package title.",
                maxLength: {
                  value: 255,
                  message: "Use no more than 255 characters.",
                },
                onChange: (event) => {
                  if (!slugCustomized)
                    setValue("slug", generateCategorySlug(event.target.value), {
                      shouldDirty: true,
                      shouldValidate: Boolean(errors.slug),
                    });
                },
              })}
            />
            <FieldError name="title" error={errors.title} />
          </div>
          <div>
            <label htmlFor="package-slug" className="block text-sm font-medium">
              Slug{" "}
              <span aria-hidden="true" className="text-red-500">
                *
              </span>
            </label>
            <input
              id="package-slug"
              className={inputClasses}
              placeholder="enter-package-slug"
              maxLength={255}
              aria-required="true"
              aria-invalid={Boolean(errors.slug)}
              aria-describedby="package-slug-hint package-slug-error"
              {...register("slug", {
                required: "Enter the package slug.",
                maxLength: {
                  value: 255,
                  message: "Use no more than 255 characters.",
                },
                pattern: {
                  value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                  message:
                    "Use lowercase letters, numbers, and single hyphens between words.",
                },
                onChange: () => setSlugCustomized(true),
              })}
            />
            <p
              id="package-slug-hint"
              className="mt-1 text-xs text-[#53699b] dark:text-gray-400"
            >
              Generated from the title. You can edit it if needed.
            </p>
            <FieldError name="slug" error={errors.slug} />
          </div>
          <div>
            <label
              htmlFor="package-duration"
              className="block text-sm font-medium"
            >
              Duration{" "}
              <span aria-hidden="true" className="text-red-500">
                *
              </span>
            </label>
            <input
              id="package-duration"
              className={inputClasses}
              placeholder="e.g. 6 Nights 7 Days"
              maxLength={65535}
              aria-required="true"
              aria-invalid={Boolean(errors.duration)}
              aria-describedby="package-duration-error"
              {...register("duration", {
                required: "Enter the duration.",
                validate: (value) => /\S/.test(value) || "Enter the duration.",
                maxLength: {
                  value: 65535,
                  message: "Use no more than 65535 characters.",
                },
              })}
            />
            <FieldError name="duration" error={errors.duration} />
          </div>
          <div>
            <label
              htmlFor="package-tour_best_time"
              className="block text-sm font-medium"
            >
              Best time to visit{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="package-tour_best_time"
              className={inputClasses}
              placeholder="e.g. May to September"
              maxLength={65535}
              aria-invalid={Boolean(errors.tour_best_time)}
              aria-describedby="package-tour_best_time-error"
              {...register("tour_best_time", {
                maxLength: {
                  value: 65535,
                  message: "Use no more than 65535 characters.",
                },
              })}
            />
            <FieldError name="tour_best_time" error={errors.tour_best_time} />
          </div>
          <div className="border-t border-[#e6ebf5] pt-4 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <label
                htmlFor="package-is_special_package"
                className="text-sm font-medium"
              >
                Special package <span className="sr-only">(optional)</span>
              </label>
              <div className="relative h-7 w-13 shrink-0">
                <input
                  id="package-is_special_package"
                  type="checkbox"
                  role="switch"
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  aria-invalid={Boolean(errors.is_special_package)}
                  aria-describedby="package-is_special_package-error"
                  {...register("is_special_package")}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-gray-300 transition peer-checked:bg-[#004bff] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 dark:bg-gray-700"
                />
                <span
                  aria-hidden="true"
                  className="absolute start-1 top-1 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-6 rtl:peer-checked:-translate-x-6"
                />
              </div>
              <span className="text-sm text-[#53699b] dark:text-gray-400">
                {watch("is_special_package") ? "Yes" : "No"}
              </span>
            </div>
            <FieldError
              name="is_special_package"
              error={errors.is_special_package}
            />
          </div>
          <div>
            <label
              htmlFor="package-status"
              className="block text-sm font-medium"
            >
              Status
            </label>
            <select
              id="package-status"
              className={inputClasses}
              aria-invalid={Boolean(errors.status)}
              aria-describedby="package-status-error"
              {...register("status", {
                validate: (value) =>
                  ["1", "0"].includes(value) || "Select Active or Inactive.",
              })}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <FieldError name="status" error={errors.status} />
          </div>
        </Card>
        <Card
          title="SEO Settings"
          description="Optimize your package for search engines."
        >
          <div>
            <label
              htmlFor="package-meta_title"
              className="block text-sm font-medium"
            >
              Meta title{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="package-meta_title"
              className={inputClasses}
              placeholder="Enter SEO meta title"
              maxLength={255}
              aria-invalid={Boolean(errors.meta_title)}
              aria-describedby="package-meta_title-error"
              {...register("meta_title", {
                maxLength: {
                  value: 255,
                  message: "Use no more than 255 characters.",
                },
              })}
            />
            <FieldError name="meta_title" error={errors.meta_title} />
          </div>
          <div>
            <label
              htmlFor="package-meta_keyword"
              className="block text-sm font-medium"
            >
              Meta keywords{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="package-meta_keyword"
              className={inputClasses}
              placeholder="Enter meta keywords"
              maxLength={65535}
              aria-invalid={Boolean(errors.meta_keyword)}
              aria-describedby="package-keywords-hint package-meta_keyword-error"
              {...register("meta_keyword", {
                maxLength: {
                  value: 65535,
                  message: "Use no more than 65535 characters.",
                },
              })}
            />
            <p
              id="package-keywords-hint"
              className="mt-1 text-xs text-[#53699b] dark:text-gray-400"
            >
              Separate keywords with commas, e.g. heritage, Rajasthan, luxury
              tours.
            </p>
            <FieldError name="meta_keyword" error={errors.meta_keyword} />
          </div>
          <div>
            <label
              htmlFor="package-meta_description"
              className="block text-sm font-medium"
            >
              Meta description{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="package-meta_description"
              className={`${inputClasses} resize-y`}
              rows={8}
              placeholder="Enter meta description"
              maxLength={65535}
              aria-invalid={Boolean(errors.meta_description)}
              aria-describedby="package-meta_description-error"
              {...register("meta_description", {
                maxLength: {
                  value: 65535,
                  message: "Use no more than 65535 characters.",
                },
              })}
            />
            <FieldError
              name="meta_description"
              error={errors.meta_description}
            />
          </div>
        </Card>
      </fieldset>
      <StepActions step={1} busy={busy} onNavigate={onNavigate} />
    </form>
  );
}
