"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import { Link, useRouter } from "@/i18n/navigation";
import { ChevronLeftIcon } from "@/icons";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import ImageUpload from "@/components/admin/common/ImageUpload";
import useCarCategories from "./useCarCategories";

const inputClasses = "mt-2 min-h-11 w-full rounded-md border border-[#dce3f1] bg-white px-3 py-2.5 text-sm text-[#0b164d] outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 aria-invalid:border-red-500 placeholder:text-[#8a9ac0] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";
const labelClasses = "block text-sm font-medium";
const optionalClasses = "font-normal text-gray-400";

function generateSlug(title) {
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function FieldError({ name, error }) {
  return error ? <p id={`car-${name}-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p> : null;
}

function Card({ title, description, children }) {
  return (
    <section className="rounded-xl border border-[#dce3f1] bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-[#53699b] dark:text-gray-400">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function CarForm({ car = null }) {
  const router = useRouter();
  const isEditing = Boolean(car);
  const title = isEditing ? "Edit Car" : "Add Car";
  const submitRef = useRef(false);
  const serverFocusRef = useRef(null);
  const [slugCustomized, setSlugCustomized] = useState(isEditing);
  const [selectedFile, setSelectedFile] = useState(null);
  const { categories, isLoading: categoriesLoading, error: categoryError, retry: retryCategories } = useCarCategories();
  const {
    register, handleSubmit, setValue, setError, setFocus, control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: car?.title ?? "",
      slug: car?.slug ?? "",
      car_category_id: car?.car_category_id == null ? "" : String(car.car_category_id),
      brand: car?.brand ?? "",
      model: car?.model ?? "",
      passenger_seats: car?.passenger_seats ?? "",
      luggage_bags: car?.luggage_bags ?? 0,
      transmission: car?.transmission ?? "manual",
      has_ac: car?.has_ac ?? true,
      description: car?.description ?? "",
      rate_basis: car?.rate_basis ?? "per_km",
      starting_rate: car?.starting_rate ?? "",
      minimum_km_per_day: car?.minimum_km_per_day ?? "",
      driver_allowance_per_day: car?.driver_allowance_per_day ?? "",
      extra_km_rate: car?.extra_km_rate ?? "",
      inclusion: car?.inclusion ?? "",
      exclusion: car?.exclusion ?? "",
      cancellation_policy: car?.cancellation_policy ?? "",
      status: car ? (car.status ? "1" : "0") : "1",
      is_featured: car?.is_featured ?? false,
      meta_title: car?.meta_title ?? "",
      meta_keyword: car?.meta_keyword ?? "",
      meta_description: car?.meta_description ?? "",
      image: [],
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const hasAc = useWatch({ control, name: "has_ac" });
  const isFeatured = useWatch({ control, name: "is_featured" });
  const categoryId = useWatch({ control, name: "car_category_id" });
  const categoriesUnavailable = categoriesLoading || Boolean(categoryError) || categories.length === 0;

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
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) return "Choose a PNG, JPG or WebP image.";
    if (file.size > 2 * 1024 * 1024) return "Image must be no larger than 2 MB.";
    return true;
  }

  function chooseImage(files) {
    if (submitRef.current) return false;
    setValue("image", files, { shouldValidate: true, shouldDirty: true });
    if (validateImage(files) !== true) return false;
    setSelectedFile(files[0] ?? null);
    return true;
  }

  function backToCars() {
    if (!submitRef.current) router.push("/admin/cars");
  }

  async function saveCar(values) {
    const data = new FormData();
    data.append("title", values.title.trim());
    data.append("slug", values.slug.trim());
    data.append("car_category_id", values.car_category_id);
    data.append("brand", values.brand.trim());
    data.append("model", values.model.trim());
    data.append("passenger_seats", values.passenger_seats);
    data.append("luggage_bags", values.luggage_bags === "" ? "0" : values.luggage_bags);
    data.append("transmission", values.transmission);
    data.append("has_ac", values.has_ac ? "1" : "0");
    data.append("description", values.description);
    data.append("rate_basis", values.rate_basis);
    data.append("starting_rate", values.starting_rate);
    // Empty nullable fields clear existing values when editing.
    data.append("minimum_km_per_day", values.minimum_km_per_day);
    data.append("driver_allowance_per_day", values.driver_allowance_per_day);
    data.append("extra_km_rate", values.extra_km_rate);
    data.append("inclusion", values.inclusion);
    data.append("exclusion", values.exclusion);
    data.append("cancellation_policy", values.cancellation_policy);
    data.append("status", values.status);
    data.append("is_featured", values.is_featured ? "1" : "0");
    data.append("meta_title", values.meta_title.trim());
    data.append("meta_keyword", values.meta_keyword.trim());
    data.append("meta_description", values.meta_description.trim());
    if (values.image?.[0]) data.append("image", values.image[0]);
    try {
      const response = isEditing
        ? await APIs.admin.carRental.updateCar(car.id, data)
        : await APIs.admin.carRental.createCar(data);
      toast.success(response.message || (isEditing ? "Car updated successfully." : "Car created successfully."), { position: "bottom-center" });
      router.push("/admin/cars");
    } catch (failure) {
      const editableFields = [
        "title", "slug", "car_category_id", "brand", "model", "passenger_seats",
        "luggage_bags", "transmission", "has_ac", "description", "rate_basis",
        "starting_rate", "minimum_km_per_day", "driver_allowance_per_day",
        "extra_km_rate", "inclusion", "exclusion", "cancellation_policy", "status",
        "is_featured", "meta_title", "meta_keyword", "meta_description", "image",
      ];
      const unmapped = [];
      Object.entries(failure.errors ?? {}).forEach(([name, messages]) => {
        const message = Array.isArray(messages) ? messages.join(" ") : String(messages);
        if (editableFields.includes(name)) {
          setError(name, { type: "server", message });
          serverFocusRef.current ??= name;
        } else unmapped.push(message);
      });
      const message = [failure.message || "Unable to save the car. Please try again.", ...unmapped].join(" ");
      setError("root.server", { type: "server", message });
      toast.error(message, { position: "bottom-center" });
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (submitRef.current || categoriesUnavailable) return;
    submitRef.current = true;
    try {
      await handleSubmit(saveCar)(event);
    } finally {
      submitRef.current = false;
    }
  }

  return (
    <div className="w-full min-w-0 text-[#0b164d] dark:text-gray-100">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 xl:flex-row">
        <div className="w-full min-w-0 flex-1 xl:w-auto">
          <PageBreadcrumb
            pageTitle={title}
            description={isEditing ? "Update vehicle details and rental information." : "Add vehicle details and rental information."}
            breadcrumbs={[
            { label: "Home", href: "/admin/dashboard" },
            { label: "Car Rentals" },
            { label: "Cars", href: "/admin/cars" },
            { label: title },
          ]}
          />
        </div>
        <button
          type="button"
          onClick={backToCars}
          disabled={isSubmitting}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-blue-200 bg-white px-4 text-sm text-[#004bff] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" viewBox="0 0 20 20" />Back to Cars
        </button>
      </div>
      <form onSubmit={submit} noValidate aria-busy={isSubmitting}>
        {errors.root?.server && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{errors.root.server.message}</p>}
        <fieldset disabled={isSubmitting} className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] disabled:opacity-70">
          <legend className="sr-only">Vehicle details and rental information</legend>
          <div className="min-w-0 space-y-5">
            <Card title="Basic Details">
              <div>
                <label htmlFor="car-title" className={labelClasses}>Title <span aria-hidden="true" className="text-red-500">*</span></label>
                <input
                  {...register("title", {
                    required: "Enter the car title.",
                    maxLength: { value: 255, message: "Use no more than 255 characters." },
                    setValueAs: (value) => value.trim(),
                    onChange: (event) => {
                      if (!slugCustomized) setValue("slug", generateSlug(event.target.value), { shouldDirty: true, shouldValidate: Boolean(errors.slug) });
                    },
                  })}
                  id="car-title"
                  placeholder="e.g. Toyota Innova Crysta"
                  maxLength={255}
                  autoFocus
                  aria-required="true"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "car-title-error" : undefined}
                  className={inputClasses}
                />
                <FieldError name="title" error={errors.title} />
              </div>
              <div>
                <label htmlFor="car-slug" className={labelClasses}>Slug <span aria-hidden="true" className="text-red-500">*</span></label>
                <input
                  {...register("slug", {
                    required: "Enter the car slug.",
                    maxLength: { value: 255, message: "Use no more than 255 characters." },
                    pattern: { value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "Use lowercase letters, numbers, and single hyphens between words." },
                    setValueAs: (value) => value.trim(),
                    onChange: () => setSlugCustomized(true),
                  })}
                  id="car-slug"
                  placeholder="toyota-innova-crysta"
                  maxLength={255}
                  aria-required="true"
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={`car-slug-hint${errors.slug ? " car-slug-error" : ""}`}
                  className={inputClasses}
                />
                <p id="car-slug-hint" className="mt-1 text-xs text-[#53699b] dark:text-gray-400">{isEditing ? "Changing the slug may change this car's URL." : "Generated from the title. You can edit it."}</p>
                <FieldError name="slug" error={errors.slug} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="car-car_category_id" className={labelClasses}>Category <span aria-hidden="true" className="text-red-500">*</span></label>
                <select
                  {...register("car_category_id", {
                    required: "Select a category.",
                    validate: (value) => categories.some((category) => String(category.id) === value) || "Select an available category.",
                  })}
                  id="car-car_category_id"
                  value={categoryId ?? ""}
                  disabled={categoriesLoading || Boolean(categoryError)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.car_category_id)}
                  aria-describedby={`car-categories-hint${errors.car_category_id ? " car-car_category_id-error" : ""}`}
                  className={inputClasses}
                >
                  <option value="">{categoriesLoading ? "Loading categories..." : "Select category"}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.title}{category.status ? "" : " (inactive)"}</option>)}
                </select>
                <div id="car-categories-hint" className="mt-1 text-xs text-[#53699b] dark:text-gray-400">
                  {categoryError ? (
                    <div role="alert" className="flex flex-wrap items-center gap-2 text-red-600 dark:text-red-400">
                      <p>{categoryError}</p>
                      <button type="button" onClick={retryCategories} className="rounded-sm underline focus-visible:outline-2">Retry categories</button>
                    </div>
                  ) : !categoriesLoading && categories.length === 0 ? (
                    <p>No car categories available. <Link href="/admin/car-categories/create" className="text-[#004bff] underline dark:text-blue-400">Add a category</Link> first.</p>
                  ) : null}
                </div>
                <FieldError name="car_category_id" error={errors.car_category_id} />
              </div>
              <div>
                <label htmlFor="car-brand" className={labelClasses}>Brand <span className={optionalClasses}>(optional)</span></label>
                <input
                  {...register("brand", { maxLength: { value: 100, message: "Use no more than 100 characters." }, setValueAs: (value) => value.trim() })}
                  id="car-brand"
                  placeholder="Toyota"
                  maxLength={100}
                  aria-required="false"
                  aria-invalid={Boolean(errors.brand)}
                  aria-describedby={errors.brand ? "car-brand-error" : undefined}
                  className={inputClasses}
                />
                <FieldError name="brand" error={errors.brand} />
              </div>
              <div>
                <label htmlFor="car-model" className={labelClasses}>Model <span className={optionalClasses}>(optional)</span></label>
                <input
                  {...register("model", { maxLength: { value: 150, message: "Use no more than 150 characters." }, setValueAs: (value) => value.trim() })}
                  id="car-model"
                  placeholder="Innova Crysta"
                  maxLength={150}
                  aria-required="false"
                  aria-invalid={Boolean(errors.model)}
                  aria-describedby={errors.model ? "car-model-error" : undefined}
                  className={inputClasses}
                />
                <FieldError name="model" error={errors.model} />
              </div>
              <div>
                <label htmlFor="car-passenger_seats" className={labelClasses}>Passenger seats <span aria-hidden="true" className="text-red-500">*</span></label>
                <input
                  {...register("passenger_seats", {
                    required: "Enter the number of passenger seats.",
                    min: { value: 1, message: "Use at least 1 passenger seat." },
                    max: { value: 65535, message: "Use no more than 65535 seats." },
                    validate: (value) => /^\d+$/.test(String(value)) || "Enter a whole number.",
                  })}
                  id="car-passenger_seats"
                  type="number"
                  min="1"
                  max="65535"
                  step="1"
                  placeholder="6"
                  aria-required="true"
                  aria-invalid={Boolean(errors.passenger_seats)}
                  aria-describedby={`car-seats-hint${errors.passenger_seats ? " car-passenger_seats-error" : ""}`}
                  className={inputClasses}
                />
                <p id="car-seats-hint" className="mt-1 text-xs text-[#53699b] dark:text-gray-400">Excluding driver.</p>
                <FieldError name="passenger_seats" error={errors.passenger_seats} />
              </div>
              <div>
                <label htmlFor="car-luggage_bags" className={labelClasses}>Luggage bags <span className={optionalClasses}>(optional)</span></label>
                <input
                  {...register("luggage_bags", {
                    min: { value: 0, message: "Use zero or more bags." },
                    max: { value: 65535, message: "Use no more than 65535 bags." },
                    validate: (value) => value === "" || /^\d+$/.test(String(value)) || "Enter a whole number.",
                  })}
                  id="car-luggage_bags"
                  type="number"
                  min="0"
                  max="65535"
                  step="1"
                  placeholder="3"
                  aria-required="false"
                  aria-invalid={Boolean(errors.luggage_bags)}
                  aria-describedby={errors.luggage_bags ? "car-luggage_bags-error" : undefined}
                  className={inputClasses}
                />
                <FieldError name="luggage_bags" error={errors.luggage_bags} />
              </div>
              <div>
                <label htmlFor="car-transmission" className={labelClasses}>Transmission</label>
                <select
                  {...register("transmission", { required: "Select a transmission.", validate: (value) => ["manual", "automatic"].includes(value) || "Select Manual or Automatic." })}
                  id="car-transmission"
                  aria-required="true"
                  aria-invalid={Boolean(errors.transmission)}
                  aria-describedby={errors.transmission ? "car-transmission-error" : undefined}
                  className={inputClasses}
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
                <FieldError name="transmission" error={errors.transmission} />
              </div>
              <div>
                <label htmlFor="car-has_ac" className={labelClasses}>Air conditioning</label>
                <div className="mt-3 flex items-center gap-3">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      {...register("has_ac", { validate: (value) => typeof value === "boolean" || "Choose whether air conditioning is available." })}
                      id="car-has_ac"
                      type="checkbox"
                      role="switch"
                      aria-label="Air conditioning"
                      aria-checked={Boolean(hasAc)}
                      aria-invalid={Boolean(errors.has_ac)}
                      aria-describedby={errors.has_ac ? "car-has_ac-error" : undefined}
                      className="peer sr-only"
                    />
                    <span aria-hidden="true" className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-[#004bff] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 peer-disabled:opacity-60 dark:bg-gray-700" />
                    <span aria-hidden="true" className="absolute start-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
                  </label>
                  <span className="text-sm">{hasAc ? "On" : "Off"}</span>
                </div>
                <FieldError name="has_ac" error={errors.has_ac} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="car-description" className={labelClasses}>Description <span className={optionalClasses}>(optional)</span></label>
                <textarea
                  {...register("description")}
                  id="car-description"
                  rows={3}
                  placeholder="Describe this car..."
                  aria-required="false"
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? "car-description-error" : undefined}
                  className={`${inputClasses} resize-y`}
                />
                <FieldError name="description" error={errors.description} />
              </div>
            </Card>
            <Card title="Pricing">
              <div>
                <label htmlFor="car-rate_basis" className={labelClasses}>Rate basis</label>
                <select
                  {...register("rate_basis", { required: "Select a rate basis.", validate: (value) => ["per_km", "per_day", "per_trip"].includes(value) || "Select a supported rate basis." })}
                  id="car-rate_basis"
                  aria-required="true"
                  aria-invalid={Boolean(errors.rate_basis)}
                  aria-describedby={errors.rate_basis ? "car-rate_basis-error" : undefined}
                  className={inputClasses}
                >
                  <option value="per_km">Per kilometre</option>
                  <option value="per_day">Per day</option>
                  <option value="per_trip">Per trip</option>
                </select>
                <FieldError name="rate_basis" error={errors.rate_basis} />
              </div>
              <div>
                <label htmlFor="car-starting_rate" className={labelClasses}>Starting rate (INR) <span aria-hidden="true" className="text-red-500">*</span></label>
                <input
                  {...register("starting_rate", {
                    required: "Enter the starting rate.",
                    min: { value: 0, message: "Use a rate of zero or more." },
                    max: { value: 99999999.99, message: "Use no more than 99999999.99." },
                    validate: (value) => /^\d+(?:\.\d{1,2})?$/.test(String(value)) || "Enter an amount with up to 2 decimal places.",
                  })}
                  id="car-starting_rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  placeholder="22"
                  aria-required="true"
                  aria-invalid={Boolean(errors.starting_rate)}
                  aria-describedby={errors.starting_rate ? "car-starting_rate-error" : undefined}
                  className={inputClasses}
                />
                <FieldError name="starting_rate" error={errors.starting_rate} />
              </div>
              <div>
                <label htmlFor="car-minimum_km_per_day" className={labelClasses}>Minimum km per day <span className={optionalClasses}>(optional)</span></label>
                <input
                  {...register("minimum_km_per_day", {
                    min: { value: 0, message: "Use zero kilometres or more." },
                    max: { value: 65535, message: "Use no more than 65535 kilometres." },
                    validate: (value) => value === "" || /^\d+$/.test(String(value)) || "Enter a whole number.",
                  })}
                  id="car-minimum_km_per_day"
                  type="number"
                  min="0"
                  max="65535"
                  step="1"
                  placeholder="250"
                  aria-required="false"
                  aria-invalid={Boolean(errors.minimum_km_per_day)}
                  aria-describedby={errors.minimum_km_per_day ? "car-minimum_km_per_day-error" : undefined}
                  className={inputClasses}
                />
                <FieldError name="minimum_km_per_day" error={errors.minimum_km_per_day} />
              </div>
              <div>
                <label htmlFor="car-driver_allowance_per_day" className={labelClasses}>Driver allowance per day (INR) <span className={optionalClasses}>(optional)</span></label>
                <input
                  {...register("driver_allowance_per_day", {
                    min: { value: 0, message: "Use an allowance of zero or more." },
                    max: { value: 99999999.99, message: "Use no more than 99999999.99." },
                    validate: (value) => value === "" || /^\d+(?:\.\d{1,2})?$/.test(String(value)) || "Enter an amount with up to 2 decimal places.",
                  })}
                  id="car-driver_allowance_per_day"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  placeholder="300"
                  aria-required="false"
                  aria-invalid={Boolean(errors.driver_allowance_per_day)}
                  aria-describedby={errors.driver_allowance_per_day ? "car-driver_allowance_per_day-error" : undefined}
                  className={inputClasses}
                />
                <FieldError name="driver_allowance_per_day" error={errors.driver_allowance_per_day} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="car-extra_km_rate" className={labelClasses}>Extra km rate (INR) <span className={optionalClasses}>(optional)</span></label>
                <input
                  {...register("extra_km_rate", {
                    min: { value: 0, message: "Use a rate of zero or more." },
                    max: { value: 99999999.99, message: "Use no more than 99999999.99." },
                    validate: (value) => value === "" || /^\d+(?:\.\d{1,2})?$/.test(String(value)) || "Enter an amount with up to 2 decimal places.",
                  })}
                  id="car-extra_km_rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  placeholder="22"
                  aria-required="false"
                  aria-invalid={Boolean(errors.extra_km_rate)}
                  aria-describedby={errors.extra_km_rate ? "car-extra_km_rate-error" : undefined}
                  className={inputClasses}
                />
                <FieldError name="extra_km_rate" error={errors.extra_km_rate} />
              </div>
            </Card>
            <Card title="Rental Terms">
              <div className="sm:col-span-2">
                <label htmlFor="car-inclusion" className={labelClasses}>Inclusion <span className={optionalClasses}>(optional)</span></label>
                <textarea
                  {...register("inclusion")}
                  id="car-inclusion"
                  rows={3}
                  placeholder="List what is included in the rental (e.g. driver, fuel, toll, etc.)."
                  aria-required="false"
                  aria-invalid={Boolean(errors.inclusion)}
                  aria-describedby={errors.inclusion ? "car-inclusion-error" : undefined}
                  className={`${inputClasses} resize-y`}
                />
                <FieldError name="inclusion" error={errors.inclusion} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="car-exclusion" className={labelClasses}>Exclusion <span className={optionalClasses}>(optional)</span></label>
                <textarea
                  {...register("exclusion")}
                  id="car-exclusion"
                  rows={3}
                  placeholder="List what is not included (e.g. parking, state tax, etc.)."
                  aria-required="false"
                  aria-invalid={Boolean(errors.exclusion)}
                  aria-describedby={errors.exclusion ? "car-exclusion-error" : undefined}
                  className={`${inputClasses} resize-y`}
                />
                <FieldError name="exclusion" error={errors.exclusion} />
              </div>
            </Card>
          </div>
          <div className="min-w-0 space-y-5">
            <Card title="Car Image">
              <div className="sm:col-span-2">
                <ImageUpload
                  id="car-image"
                  label="Car image"
                  existingImageUrl={car?.image_url}
                  selectedFile={selectedFile}
                  onChange={chooseImage}
                  inputProps={register("image", { validate: validateImage })}
                  error={errors.image}
                  disabled={isSubmitting}
                />
              </div>
            </Card>
            <Card title="Visibility">
              <div className="sm:col-span-2">
                <label htmlFor="car-status" className={labelClasses}>Status</label>
                <select
                  {...register("status", { required: "Select a status.", validate: (value) => ["1", "0"].includes(value) || "Select Active or Inactive." })}
                  id="car-status"
                  aria-required="true"
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={errors.status ? "car-status-error" : undefined}
                  className={inputClasses}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
                <FieldError name="status" error={errors.status} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="car-is_featured" className={labelClasses}>Featured</label>
                <div className="mt-3 flex items-center gap-3">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      {...register("is_featured", { validate: (value) => typeof value === "boolean" || "Choose whether this car is featured." })}
                      id="car-is_featured"
                      type="checkbox"
                      role="switch"
                      aria-label="Featured"
                      aria-checked={Boolean(isFeatured)}
                      aria-invalid={Boolean(errors.is_featured)}
                      aria-describedby={errors.is_featured ? "car-is_featured-error" : undefined}
                      className="peer sr-only"
                    />
                    <span aria-hidden="true" className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-[#004bff] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 peer-disabled:opacity-60 dark:bg-gray-700" />
                    <span aria-hidden="true" className="absolute start-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
                  </label>
                  <span className="text-sm">{isFeatured ? "On" : "Off"}</span>
                </div>
                <FieldError name="is_featured" error={errors.is_featured} />
              </div>
            </Card>
            <Card title="SEO Settings" description="Control how this car appears in search results.">
              <div className="sm:col-span-2">
                <label htmlFor="car-meta_title" className={labelClasses}>Meta title <span className={optionalClasses}>(optional)</span></label>
                <input
                  {...register("meta_title", { maxLength: { value: 255, message: "Use no more than 255 characters." }, setValueAs: (value) => value.trim() })}
                  id="car-meta_title"
                  placeholder="Enter SEO title"
                  maxLength={255}
                  aria-required="false"
                  aria-invalid={Boolean(errors.meta_title)}
                  aria-describedby={errors.meta_title ? "car-meta_title-error" : undefined}
                  className={inputClasses}
                />
                <FieldError name="meta_title" error={errors.meta_title} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="car-meta_keyword" className={labelClasses}>Meta keywords <span className={optionalClasses}>(optional)</span></label>
                <input
                  {...register("meta_keyword", { maxLength: { value: 65535, message: "Use no more than 65535 characters." }, setValueAs: (value) => value.trim() })}
                  id="car-meta_keyword"
                  placeholder="Enter keywords"
                  maxLength={65535}
                  aria-required="false"
                  aria-invalid={Boolean(errors.meta_keyword)}
                  aria-describedby={`car-keywords-hint${errors.meta_keyword ? " car-meta_keyword-error" : ""}`}
                  className={inputClasses}
                />
                <p id="car-keywords-hint" className="mt-1 text-xs text-[#53699b] dark:text-gray-400">Separate keywords with commas.</p>
                <FieldError name="meta_keyword" error={errors.meta_keyword} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="car-meta_description" className={labelClasses}>Meta description <span className={optionalClasses}>(optional)</span></label>
                <textarea
                  {...register("meta_description", { maxLength: { value: 65535, message: "Use no more than 65535 characters." }, setValueAs: (value) => value.trim() })}
                  id="car-meta_description"
                  rows={3}
                  placeholder="Write a short summary for search engines."
                  maxLength={65535}
                  aria-required="false"
                  aria-invalid={Boolean(errors.meta_description)}
                  aria-describedby={errors.meta_description ? "car-meta_description-error" : undefined}
                  className={`${inputClasses} resize-y`}
                />
                <FieldError name="meta_description" error={errors.meta_description} />
              </div>
            </Card>
            <Card title="Cancellation Policy">
              <div className="sm:col-span-2">
                <label htmlFor="car-cancellation_policy" className={labelClasses}>Cancellation policy <span className={optionalClasses}>(optional)</span></label>
                <textarea
                  {...register("cancellation_policy")}
                  id="car-cancellation_policy"
                  rows={3}
                  placeholder="Describe the cancellation policy..."
                  aria-required="false"
                  aria-invalid={Boolean(errors.cancellation_policy)}
                  aria-describedby={errors.cancellation_policy ? "car-cancellation_policy-error" : undefined}
                  className={`${inputClasses} resize-y`}
                />
                <FieldError name="cancellation_policy" error={errors.cancellation_policy} />
              </div>
            </Card>
          </div>
        </fieldset>
        <div className="mt-5 flex justify-end gap-3 rounded-xl border border-[#dce3f1] bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={backToCars}
            disabled={isSubmitting}
            className="rounded-md border border-blue-200 px-5 py-2.5 text-sm font-medium text-[#004bff] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-gray-800"
          >Cancel</button>
          <button
            type="submit"
            disabled={isSubmitting || categoriesUnavailable}
            className="rounded-md bg-[#004bff] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : categoriesLoading ? "Loading categories..." : isEditing ? "Save Changes" : "Create Car"}
          </button>
        </div>
      </form>
    </div>
  );
}
