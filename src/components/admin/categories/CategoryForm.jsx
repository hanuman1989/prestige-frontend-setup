"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import { useRouter } from "@/i18n/navigation";
import { ChevronLeftIcon } from "@/icons";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import CategoryImage from "./CategoryImage";

const inputClasses =
  "mt-2 min-h-11 w-full rounded-md border border-[#dce3f1] bg-white px-3 py-2.5 text-sm text-[#0b164d] outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 aria-invalid:border-red-500 placeholder:text-[#8a9ac0] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";
const labelClasses = "block text-sm font-medium";
const categoryAPI = APIs.admin.categories;

export function generateCategorySlug(title) {
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
      id={`category-${name}-error`}
      role="alert"
      className="mt-1 text-sm text-red-600 dark:text-red-400"
    >
      {error.message}
    </p>
  ) : null;
}

function Card({ title, description, children }) {
  return (
    <section className="rounded-xl border border-[#dce3f1] bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-gray-900">
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

export default function CategoryForm({ category = null }) {
  const router = useRouter();
  const isEditing = Boolean(category);
  const title = isEditing ? "Edit Category" : "Add Category";
  const submitRef = useRef(false);
  const [slugCustomized, setSlugCustomized] = useState(isEditing);
  const serverFocusRef = useRef(null);
  const [preview, setPreview] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: category?.title ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      meta_title: category?.meta_title ?? "",
      meta_keyword: category?.meta_keyword ?? "",
      meta_description: category?.meta_description ?? "",
      image: [],
      status: category ? (category.status ? "1" : "0") : "1",
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => {
    if (!isSubmitting && serverFocusRef.current) {
      setFocus(serverFocusRef.current);
      serverFocusRef.current = null;
    }
  }, [isSubmitting, setFocus]);

  function validateImage(files) {
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

  function chooseImage(file) {
    if (file && validateImage([file]) !== true) return;
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  function dropImage(event) {
    event.preventDefault();
    if (isSubmitting) return;
    if (event.dataTransfer.files.length !== 1) {
      setError("image", {
        type: "validate",
        message: "Choose one category image.",
      });
      return;
    }
    const file = event.dataTransfer.files[0];
    setValue("image", [file], { shouldValidate: true, shouldDirty: true });
    chooseImage(file);
  }

  function clearImage() {
    setValue("image", [], { shouldValidate: false, shouldDirty: true });
    setPreview("");
    clearErrors("image");
  }

  function backToCategories() {
    if (!submitRef.current) router.push("/admin/categories");
  }

  async function saveCategory(values) {
    const data = new FormData();
    data.append("title", values.title.trim());
    data.append("slug", values.slug.trim());
    data.append("description", values.description);
    data.append("meta_title", values.meta_title.trim());
    data.append("meta_keyword", values.meta_keyword.trim());
    data.append("meta_description", values.meta_description.trim());
    data.append("status", values.status);
    const file = values.image?.[0];
    if (file) data.append("image", file);
    try {
      const response = isEditing
        ? await categoryAPI.updateCategory(category.id, data)
        : await categoryAPI.createCategory(data);
      toast.success(
        response.message ||
          (isEditing
            ? "Category updated successfully."
            : "Category created successfully."),
        { position: "bottom-center" },
      );
      router.push("/admin/categories");
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
        failure.message || "Unable to save the category. Please try again.",
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
      await handleSubmit(saveCategory)(event);
    } finally {
      submitRef.current = false;
    }
  }

  const currentImage = preview || category?.image_url || "";
  const breadcrumbs = [
    { label: "Home", href: "/admin/dashboard" },
    { label: "Categories", href: "/admin/categories" },
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
                ? "Update this travel category and manage its content."
                : "Create a travel category and manage its content."
            }
            breadcrumbs={breadcrumbs}
          />
        </div>
        <button
          type="button"
          onClick={backToCategories}
          disabled={isSubmitting}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-blue-200 bg-white px-4 text-sm text-[#004bff] hover:bg-blue-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          Back to Categories
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
          <legend className="sr-only">Category information</legend>
          <div className="min-w-0 space-y-5">
            <Card title="Category Details">
              <div>
                <label htmlFor="category-title" className={labelClasses}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("title", {
                    required: "Enter the category title.",
                    maxLength: {
                      value: 255,
                      message: "Use no more than 255 characters.",
                    },
                    setValueAs: (value) => value.trim(),
                    onChange: (event) => {
                      if (!slugCustomized)
                        setValue(
                          "slug",
                          generateCategorySlug(event.target.value),
                          {
                            shouldDirty: true,
                            shouldValidate: Boolean(errors.slug),
                          },
                        );
                    },
                  })}
                  id="category-title"
                  placeholder="e.g. Heritage Tours"
                  autoFocus
                  maxLength={255}
                  aria-required="true"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? "category-title-error" : undefined
                  }
                  className={inputClasses}
                />
                <FieldError name="title" error={errors.title} />
              </div>
              <div>
                <label htmlFor="category-slug" className={labelClasses}>
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("slug", {
                    required: "Enter the category slug.",
                    maxLength: {
                      value: 255,
                      message: "Use no more than 255 characters.",
                    },
                    setValueAs: (value) => value.trim(),
                    pattern: {
                      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message:
                        "Use lowercase letters, numbers, and single hyphens between words.",
                    },
                    onChange: () => setSlugCustomized(true),
                  })}
                  id="category-slug"
                  placeholder="e.g. heritage-tours"
                  maxLength={255}
                  aria-required="true"
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={`category-slug-hint${errors.slug ? " category-slug-error" : ""}`}
                  className={inputClasses}
                />
                <p
                  id="category-slug-hint"
                  className="mt-1 text-xs text-[#53699b] dark:text-gray-400"
                >
                  {isEditing
                    ? "Changing the slug may change this category’s URL."
                    : "Generated from the title. You can edit it."}
                </p>
                <FieldError name="slug" error={errors.slug} />
              </div>
              <div>
                <label htmlFor="category-description" className={labelClasses}>
                  Description{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  {...register("description")}
                  id="category-description"
                  placeholder="Describe this category..."
                  rows={5}
                  aria-required="false"
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description
                      ? "category-description-error"
                      : undefined
                  }
                  className={`${inputClasses} resize-y`}
                />
                <FieldError name="description" error={errors.description} />
              </div>
            </Card>
            <Card
              title="SEO Settings"
              description="Control how this category appears in search results."
            >
              <div>
                <label htmlFor="category-meta_title" className={labelClasses}>
                  Meta title{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  {...register("meta_title", {
                    maxLength: {
                      value: 255,
                      message: "Use no more than 255 characters.",
                    },
                    setValueAs: (value) => value.trim(),
                  })}
                  id="category-meta_title"
                  placeholder="Enter SEO title"
                  maxLength={255}
                  aria-required="false"
                  aria-invalid={Boolean(errors.meta_title)}
                  aria-describedby={
                    errors.meta_title ? "category-meta_title-error" : undefined
                  }
                  className={inputClasses}
                />
                <FieldError name="meta_title" error={errors.meta_title} />
              </div>
              <div>
                <label htmlFor="category-meta_keyword" className={labelClasses}>
                  Meta keywords{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  {...register("meta_keyword", {
                    maxLength: {
                      value: 65535,
                      message: "Use no more than 65535 characters.",
                    },
                    setValueAs: (value) => value.trim(),
                  })}
                  id="category-meta_keyword"
                  placeholder="heritage tours, Rajasthan, cultural travel"
                  maxLength={65535}
                  aria-required="false"
                  aria-invalid={Boolean(errors.meta_keyword)}
                  aria-describedby={`category-keywords-hint${errors.meta_keyword ? " category-meta_keyword-error" : ""}`}
                  className={inputClasses}
                />
                <p
                  id="category-keywords-hint"
                  className="mt-1 text-xs text-[#53699b] dark:text-gray-400"
                >
                  Separate keywords with commas.
                </p>
                <FieldError name="meta_keyword" error={errors.meta_keyword} />
              </div>
              <div>
                <label
                  htmlFor="category-meta_description"
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
                    setValueAs: (value) => value.trim(),
                  })}
                  id="category-meta_description"
                  placeholder="Write a short summary for search engines."
                  rows={3}
                  maxLength={65535}
                  aria-required="false"
                  aria-invalid={Boolean(errors.meta_description)}
                  aria-describedby={
                    errors.meta_description
                      ? "category-meta_description-error"
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
          <div className="min-w-0 space-y-5">
            <Card title="Category Image">
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={dropImage}
                className="relative flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-blue-200 bg-[#f8faff] p-4 text-center focus-within:ring-3 focus-within:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/40"
              >
                {currentImage ? (
                  <CategoryImage
                    src={currentImage}
                    alt={category?.title || "Category image preview"}
                    className="mb-4 max-h-48 w-full rounded-lg object-contain"
                  />
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 48 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mb-4 size-12 text-[#53699b]"
                  >
                    <path d="M13 33a10 10 0 0 1-1-20 13 13 0 0 1 25-1 10 10 0 0 1-1 21M24 42V22m-8 8 8-8 8 8" />
                  </svg>
                )}
                <label
                  htmlFor="category-image"
                  className="cursor-pointer text-sm font-medium"
                >
                  {currentImage ? "Replace image" : "Click to upload"}
                  <span className="font-normal text-[#53699b] dark:text-gray-400">
                    {" "}
                    or drag and drop
                  </span>
                </label>
                <p
                  id="category-image-hint"
                  className="mt-2 text-xs text-[#53699b] dark:text-gray-400"
                >
                  PNG, JPG or WebP. Up to 2 MB (optional)
                </p>
                <input
                  {...register("image", {
                    validate: validateImage,
                    onChange: (event) => chooseImage(event.target.files?.[0]),
                  })}
                  id="category-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-required="false"
                  aria-invalid={Boolean(errors.image)}
                  aria-describedby={`category-image-hint${errors.image ? " category-image-error" : ""}`}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <FieldError name="image" error={errors.image} />
              {preview && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Discard selected image
                </button>
              )}
            </Card>
            <Card title="Visibility">
              <div>
                <label htmlFor="category-status" className={labelClasses}>
                  Status
                </label>
                <select
                  {...register("status", {
                    required: "Select a status.",
                    validate: (value) =>
                      ["1", "0"].includes(value) ||
                      "Select Active or Inactive.",
                  })}
                  id="category-status"
                  aria-required="true"
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={`category-status-hint${errors.status ? " category-status-error" : ""}`}
                  className={inputClasses}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
                <p
                  id="category-status-hint"
                  className="mt-2 text-xs text-[#53699b] dark:text-gray-400"
                >
                  Active categories are visible on the website.
                </p>
                <FieldError name="status" error={errors.status} />
              </div>
            </Card>
          </div>
        </fieldset>
        <div className="mt-5 flex justify-end gap-3 rounded-xl border border-[#dce3f1] bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={backToCategories}
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
                : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
