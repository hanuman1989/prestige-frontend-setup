"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import { useRouter } from "@/i18n/navigation";
import { ChevronLeftIcon } from "@/icons";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import ImageUpload from "@/components/admin/common/ImageUpload";

const inputClasses =
  "mt-2 min-h-11 w-full rounded-md border border-[#dce3f1] bg-white px-3 py-2.5 text-sm text-[#0b164d] outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 aria-invalid:border-red-500 placeholder:text-[#8a9ac0] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";
const labelClasses = "block text-sm font-medium";
const destinationAPI = APIs.admin.destinations;

export function generateDestinationSlug(title) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function FieldError({ name, error }) {
  return error ? (
    <p
      id={`destination-${name}-error`}
      role="alert"
      className="mt-1 text-sm text-red-600 dark:text-red-400"
    >
      {error.message}
    </p>
  ) : null;
}

function Card({ title, description, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-[#dce3f1] bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-[#53699b] dark:text-gray-400">
          {description}
        </p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function DestinationForm({ destination = null }) {
  const router = useRouter();
  const isEditing = Boolean(destination);
  const title = isEditing ? "Edit Destination" : "Add Destination";
  const submitRef = useRef(false);
  const [slugCustomized, setSlugCustomized] = useState(isEditing);
  const serverFocusRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: destination?.title ?? "",
      slug: destination?.slug ?? "",
      description: destination?.description ?? "",
      meta_title: destination?.meta_title ?? "",
      meta_keyword: destination?.meta_keyword ?? "",
      meta_description: destination?.meta_description ?? "",
      image: [],
      destination_type: String(destination?.destination_type ?? 1),
      is_most_popular: destination?.is_most_popular ?? false,
      status: destination ? (destination.status ? "1" : "0") : "1",
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!isSubmitting && serverFocusRef.current) {
      setFocus(serverFocusRef.current);
      serverFocusRef.current = null;
    }
  }, [isSubmitting, setFocus]);

  function validateImage(files) {
    if (files?.length > 1) return "Choose one image.";
    const file = files?.[0];
    if (!file) return true;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      !/\.(jpe?g|png|webp)$/i.test(file.name)
    )
      return "Choose a PNG, JPG or WebP image.";
    if (file.size > 2 * 1024 * 1024)
      return "Image must be no larger than 2 MB.";
    return true;
  }

  function chooseImage(files) {
    if (submitRef.current) return false;
    setValue("image", files, { shouldValidate: true, shouldDirty: true });
    if (validateImage(files) !== true) return false;
    setSelectedFile(files[0] ?? null);
    return true;
  }

  function backToDestinations() {
    if (!submitRef.current) router.push("/admin/destinations");
  }

  async function saveDestination(values) {
    const data = new FormData();
    data.append("title", values.title);
    data.append("slug", values.slug);
    data.append("description", values.description);
    data.append("meta_title", values.meta_title);
    data.append("meta_keyword", values.meta_keyword);
    data.append("meta_description", values.meta_description);
    data.append("status", values.status);
    data.append("destination_type", values.destination_type);
    data.append("is_most_popular", values.is_most_popular ? "1" : "0");
    const file = values.image?.[0];
    if (file) data.append("image", file);
    try {
      const response = isEditing
        ? await destinationAPI.updateDestination(destination.id, data)
        : await destinationAPI.createDestination(data);
      toast.success(
        response.message ||
          (isEditing
            ? "Destination updated successfully."
            : "Destination created successfully."),
        { position: "bottom-center" },
      );
      router.push("/admin/destinations");
    } catch (failure) {
      const unmapped = [];
      const editableFields = [
        "title",
        "slug",
        "meta_title",
        "meta_keyword",
        "meta_description",
        "image",
        "description",
        "status",
        "destination_type",
        "is_most_popular",
      ];
      Object.entries(failure.errors ?? {}).forEach(([name, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(" ")
          : String(messages);
        if (editableFields.includes(name)) {
          setError(name, { type: "server", message });
          serverFocusRef.current ??= name;
        } else unmapped.push(message);
      });
      const message = [
        failure.message || "Unable to save the destination. Please try again.",
        ...unmapped,
      ].join(" ");
      setError("root.server", { type: "server", message });
      toast.error(message, { position: "bottom-center" });
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (submitRef.current) return;
    submitRef.current = true;
    try {
      await handleSubmit(saveDestination)(event);
    } finally {
      submitRef.current = false;
    }
  }

  const breadcrumbs = [
    { label: "Home", href: "/admin/dashboard" },
    { label: "Destinations", href: "/admin/destinations" },
    { label: title },
  ];

  return (
    <div className="w-full min-w-0 text-[#0b164d] dark:text-gray-100">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 xl:flex-row">
        <div className="w-full min-w-0 flex-1 xl:w-auto">
          <PageBreadcrumb
            pageTitle={title}
            description={
              isEditing
                ? "Update this destination and manage its content."
                : "Create a destination and manage its content."
            }
            breadcrumbs={breadcrumbs}
          />
        </div>
        <button
          type="button"
          onClick={backToDestinations}
          disabled={isSubmitting}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-blue-200 bg-white px-4 text-sm text-[#004bff] hover:bg-blue-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          Back to Destinations
        </button>
      </div>
      <form onSubmit={submit} noValidate aria-busy={isSubmitting}>
        {errors.root?.server && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {errors.root.server.message}
          </p>
        )}
        <fieldset
          disabled={isSubmitting}
          className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] disabled:opacity-70"
        >
          <legend className="sr-only">Destination information</legend>
          <div className="min-w-0 space-y-5">
            <Card title="Destination Details">
              <div>
                <label htmlFor="destination-title" className={labelClasses}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("title", {
                    required: "Enter the destination title.",
                    validate: (value) => /\S/.test(value) || "Enter the destination title.",
                    maxLength: {
                      value: 255,
                      message: "Use no more than 255 characters.",
                    },
                    onChange: (event) => {
                      if (!slugCustomized)
                        setValue(
                          "slug",
                          generateDestinationSlug(event.target.value),
                          {
                            shouldDirty: true,
                            shouldValidate: Boolean(errors.slug),
                          },
                        );
                    },
                  })}
                  id="destination-title"
                  placeholder="e.g. Jaipur"
                  autoFocus
                  maxLength={255}
                  aria-required="true"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? "destination-title-error" : undefined
                  }
                  className={inputClasses}
                />
                <FieldError name="title" error={errors.title} />
              </div>
              <div>
                <label htmlFor="destination-slug" className={labelClasses}>
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("slug", {
                    required: "Enter the destination slug.",
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
                  id="destination-slug"
                  placeholder="e.g. jaipur"
                  maxLength={255}
                  aria-required="true"
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={`destination-slug-hint${errors.slug ? " destination-slug-error" : ""}`}
                  className={inputClasses}
                />
                <p
                  id="destination-slug-hint"
                  className="mt-1 text-xs text-[#53699b] dark:text-gray-400"
                >
                  {isEditing
                    ? "Changing the slug may change this destination’s URL."
                    : "Generated from the title. You can edit it."}
                </p>
                <FieldError name="slug" error={errors.slug} />
              </div>
              <div>
                <label htmlFor="destination-description" className={labelClasses}>
                  Description{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  {...register("description")}
                  id="destination-description"
                  placeholder="Describe this destination..."
                  rows={5}
                  aria-required="false"
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description
                      ? "destination-description-error"
                      : undefined
                  }
                  className={`${inputClasses} resize-y`}
                />
                <FieldError name="description" error={errors.description} />
              </div>
            </Card>
            <Card
              title="SEO Settings"
              description="Manage search engine information."
            >
              <div>
                <label htmlFor="destination-meta_title" className={labelClasses}>
                  Meta title{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  {...register("meta_title", {
                    maxLength: {
                      value: 255,
                      message: "Use no more than 255 characters.",
                    },
                  })}
                  id="destination-meta_title"
                  placeholder="Enter SEO title"
                  maxLength={255}
                  aria-required="false"
                  aria-invalid={Boolean(errors.meta_title)}
                  aria-describedby={
                    errors.meta_title ? "destination-meta_title-error" : undefined
                  }
                  className={inputClasses}
                />
                <FieldError name="meta_title" error={errors.meta_title} />
              </div>
              <div>
                <label htmlFor="destination-meta_keyword" className={labelClasses}>
                  Meta keywords{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  {...register("meta_keyword", {
                    maxLength: {
                      value: 65535,
                      message: "Use no more than 65535 characters.",
                    },
                  })}
                  id="destination-meta_keyword"
                  placeholder="Jaipur, Rajasthan, heritage travel"
                  maxLength={65535}
                  aria-required="false"
                  aria-invalid={Boolean(errors.meta_keyword)}
                  aria-describedby={`destination-keywords-hint${errors.meta_keyword ? " destination-meta_keyword-error" : ""}`}
                  className={inputClasses}
                />
                <p
                  id="destination-keywords-hint"
                  className="mt-1 text-xs text-[#53699b] dark:text-gray-400"
                >
                  Separate keywords with commas.
                </p>
                <FieldError name="meta_keyword" error={errors.meta_keyword} />
              </div>
              <div>
                <label
                  htmlFor="destination-meta_description"
                  className={labelClasses}
                >
                  Meta description{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  {...register("meta_description", {
                    maxLength: {
                      value: 65535,
                      message: "Use no more than 65535 characters.",
                    },
                  })}
                  id="destination-meta_description"
                  placeholder="Write a short summary for search engines."
                  rows={3}
                  maxLength={65535}
                  aria-required="false"
                  aria-invalid={Boolean(errors.meta_description)}
                  aria-describedby={
                    errors.meta_description
                      ? "destination-meta_description-error"
                      : undefined
                  }
                  className={`${inputClasses} resize-y`}
                />
                <FieldError
                  name="meta_description"
                  error={errors.meta_description}
                />
              </div>
            </Card>
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <Card title="Destination Image">
              <ImageUpload
                id="destination-image"
                label="Destination image"
                existingImageUrl={destination?.image_url}
                selectedFile={selectedFile}
                onChange={chooseImage}
                inputProps={register("image", { validate: validateImage })}
                error={errors.image}
                disabled={isSubmitting}
              />
            </Card>
            <Card title="Destination Settings" className="flex-1">
              <div>
                <label htmlFor="destination-type" className={labelClasses}>
                  Destination type <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <select
                  {...register("destination_type", {
                    required: "Select a destination type.",
                    validate: (value) => ["1", "2"].includes(value) || "Select Domestic or International.",
                  })}
                  id="destination-type"
                  aria-required="true"
                  aria-invalid={Boolean(errors.destination_type)}
                  aria-describedby={`destination-type-hint${errors.destination_type ? " destination-destination_type-error" : ""}`}
                  className={inputClasses}
                >
                  <option value="1">Domestic</option>
                  <option value="2">International</option>
                </select>
                <p id="destination-type-hint" className="mt-2 text-xs text-[#53699b] dark:text-gray-400">Choose Domestic or International.</p>
                <FieldError name="destination_type" error={errors.destination_type} />
              </div>
              <div className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="destination-popular" className={labelClasses}>Most popular <span className="sr-only">(optional)</span></label>
                  <div className="relative h-7 w-19 shrink-0">
                    <input
                      {...register("is_most_popular")}
                      id="destination-popular"
                      type="checkbox"
                      role="switch"
                      aria-required="false"
                      aria-invalid={Boolean(errors.is_most_popular)}
                      aria-describedby={`destination-popular-hint${errors.is_most_popular ? " destination-is_most_popular-error" : ""}`}
                      className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    />
                    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-gray-200 transition peer-checked:bg-[#004bff] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 dark:bg-gray-700" />
                    <span aria-hidden="true" className="absolute start-1 top-1 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-12 rtl:peer-checked:-translate-x-12" />
                    <span aria-hidden="true" className="absolute end-3 top-1 text-xs leading-5 text-[#53699b] peer-checked:hidden dark:text-gray-300">OFF</span>
                    <span aria-hidden="true" className="absolute start-3 top-1 hidden text-xs leading-5 text-white peer-checked:block">ON</span>
                  </div>
                </div>
                <p id="destination-popular-hint" className="mt-2 text-xs text-[#53699b] dark:text-gray-400">Feature this destination in the most popular section.</p>
                <FieldError name="is_most_popular" error={errors.is_most_popular} />
              </div>
              <div>
                <label htmlFor="destination-status" className={labelClasses}>
                  Status <span className="sr-only">(required)</span>
                </label>
                <select
                  {...register("status", {
                    required: "Select a status.",
                    validate: (value) =>
                      ["1", "0"].includes(value) ||
                      "Select Active or Inactive.",
                  })}
                  id="destination-status"
                  aria-required="true"
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={`destination-status-hint${errors.status ? " destination-status-error" : ""}`}
                  className={inputClasses}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
                <p
                  id="destination-status-hint"
                  className="mt-2 text-xs text-[#53699b] dark:text-gray-400"
                >
                  Active destinations are visible on the website.
                </p>
                <FieldError name="status" error={errors.status} />
              </div>
            </Card>
          </div>
        </fieldset>
        <div className="mt-5 flex justify-end gap-3 rounded-xl border border-[#dce3f1] bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={backToDestinations}
            disabled={isSubmitting}
            className="rounded-md border border-blue-200 px-5 py-2.5 text-sm font-medium text-[#004bff] hover:bg-blue-50 disabled:opacity-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[#004bff] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Destination"}
          </button>
        </div>
      </form>
    </div>
  );
}
