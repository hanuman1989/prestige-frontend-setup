"use client";

import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import APIs from "@/lib/apis";
import usePackageStep from "./usePackageStep";
import {
  Card,
  FieldError,
  StepActions,
  inputClasses,
  secondaryClasses,
} from "./PackageUI";

export default function RelationsStep({
  record,
  active,
  busy,
  onSave,
  onNavigate,
  onDirty,
  onBusy,
}) {
  const [categories, setCategories] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [destinationSearch, setDestinationSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const {
    control,
    watch,
    submit,
    formState: { errors, isSubmitting },
  } = usePackageStep({
    step: 2,
    onSave,
    onDirty,
    onBusy,
    defaultValues: {
      category_ids: record?.category_ids ?? [],
      destination_ids: record?.destination_ids ?? [],
    },
  });

  useEffect(() => {
    let isActive = true;
    async function loadAll(method) {
      const options = [];
      let page = 1;
      let lastPage = 1;
      do {
        const response = await method({ page, per_page: 100 });
        if (!isActive) return [];
        options.push(...response.data);
        lastPage = response.pagination.last_page;
        page += 1;
      } while (page <= lastPage);
      return options;
    }
    async function loadOptions() {
      const results = await Promise.allSettled([
        loadAll(APIs.admin.categories.getCategories),
        loadAll(APIs.admin.destinations.getDestinations),
      ]);
      if (!isActive) return;
      const failed = results.find((result) => result.status === "rejected");
      if (failed)
        setLoadError(
          failed.reason.message ||
            "Unable to load categories and destinations.",
        );
      else {
        setCategories(results[0].value);
        setDestinations(results[1].value);
        setLoadError("");
      }
      setLoading(false);
    }
    void loadOptions();
    return () => {
      isActive = false;
    };
  }, [retry]);

  return (
    <form
      hidden={!active}
      noValidate
      aria-busy={isSubmitting}
      onSubmit={(event) => {
        if (loading || loadError) {
          event.preventDefault();
          return;
        }
        return submit(event, (values) => values);
      }}
    >
      <FieldError name="relations-server" error={errors.root?.server} />
      {loadError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-gray-700 dark:bg-gray-900"
        >
          <p>{loadError}</p>
          <button
            type="button"
            className={`${secondaryClasses} mt-3`}
            disabled={busy}
            onClick={() => {
              setLoading(true);
              setLoadError("");
              setRetry((value) => value + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      <fieldset
        disabled={busy || loading || !active}
        className="grid gap-5 lg:grid-cols-2 disabled:opacity-70"
      >
        <legend className="sr-only">Categories and destinations</legend>
        <Card
          title="Package Categories"
          description="Select categories for this package."
          badge={
            <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-sm text-[#004bff] dark:bg-blue-500/15 dark:text-blue-400">
              {watch("category_ids").length} selected
            </span>
          }
        >
          <label htmlFor="package-category-search" className="sr-only">
            Search categories
          </label>
          <input
            id="package-category-search"
            type="search"
            className={inputClasses}
            placeholder="Search categories"
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
          />
          <Controller
            name="category_ids"
            control={control}
            rules={{
              validate: (value) =>
                (value.length >= 1 && value.length <= 100) ||
                "Select between 1 and 100 categories.",
            }}
            render={({ field }) => (
              <div
                role="group"
                aria-label="Package categories (required)"
                aria-describedby="package-category_ids-error"
                className="max-h-96 overflow-y-auto rounded-lg border border-[#e6ebf5] dark:border-gray-700"
              >
                {loading ? (
                  <p role="status" className="p-4">
                    Loading categories...
                  </p>
                ) : (
                  categories
                    .filter((item) =>
                      item.title
                        .toLowerCase()
                        .includes(categorySearch.toLowerCase()),
                    )
                    .map((item, index) => (
                      <label
                        key={item.id}
                        className={`flex min-h-13 cursor-pointer items-center gap-4 border-b border-[#e6ebf5] px-4 py-3 last:border-0 dark:border-gray-700 ${field.value.includes(item.id) ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}
                      >
                        <input
                          ref={index === 0 ? field.ref : undefined}
                          type="checkbox"
                          className="size-5 shrink-0 accent-[#004bff]"
                          checked={field.value.includes(item.id)}
                          onBlur={field.onBlur}
                          aria-invalid={Boolean(errors.category_ids)}
                          onChange={(event) =>
                            field.onChange(
                              event.target.checked
                                ? [...field.value, item.id]
                                : field.value.filter((id) => id !== item.id),
                            )
                          }
                        />
                        <span className="text-sm">{item.title}</span>
                      </label>
                    ))
                )}
                {!loading &&
                  !categories.some((item) =>
                    item.title
                      .toLowerCase()
                      .includes(categorySearch.toLowerCase()),
                  ) && (
                    <p className="p-4 text-sm text-[#53699b]">
                      No matching categories.
                    </p>
                  )}
              </div>
            )}
          />
          <FieldError name="category_ids" error={errors.category_ids} />
        </Card>
        <Card
          title="Package Destinations"
          description="Select destinations covered by this package."
          badge={
            <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-sm text-[#004bff] dark:bg-blue-500/15 dark:text-blue-400">
              {watch("destination_ids").length} selected
            </span>
          }
        >
          <label htmlFor="package-destination-search" className="sr-only">
            Search destinations
          </label>
          <input
            id="package-destination-search"
            type="search"
            className={inputClasses}
            placeholder="Search destinations"
            value={destinationSearch}
            onChange={(event) => setDestinationSearch(event.target.value)}
          />
          <Controller
            name="destination_ids"
            control={control}
            rules={{
              validate: (value) =>
                (value.length >= 1 && value.length <= 100) ||
                "Select between 1 and 100 destinations.",
            }}
            render={({ field }) => (
              <div
                role="group"
                aria-label="Package destinations (required)"
                aria-describedby="package-destination_ids-error"
                className="max-h-96 overflow-y-auto rounded-lg border border-[#e6ebf5] dark:border-gray-700"
              >
                {loading ? (
                  <p role="status" className="p-4">
                    Loading destinations...
                  </p>
                ) : (
                  destinations
                    .filter((item) =>
                      item.title
                        .toLowerCase()
                        .includes(destinationSearch.toLowerCase()),
                    )
                    .map((item, index) => (
                      <label
                        key={item.id}
                        className={`flex min-h-13 cursor-pointer items-center gap-4 border-b border-[#e6ebf5] px-4 py-3 last:border-0 dark:border-gray-700 ${field.value.includes(item.id) ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}
                      >
                        <input
                          ref={index === 0 ? field.ref : undefined}
                          type="checkbox"
                          className="size-5 shrink-0 accent-[#004bff]"
                          checked={field.value.includes(item.id)}
                          onBlur={field.onBlur}
                          aria-invalid={Boolean(errors.destination_ids)}
                          onChange={(event) =>
                            field.onChange(
                              event.target.checked
                                ? [...field.value, item.id]
                                : field.value.filter((id) => id !== item.id),
                            )
                          }
                        />
                        <span className="flex-1 text-sm">{item.title}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-[#53699b] dark:bg-gray-800 dark:text-gray-300">
                          {item.destination_type === 1
                            ? "Domestic"
                            : "International"}
                        </span>
                      </label>
                    ))
                )}
                {!loading &&
                  !destinations.some((item) =>
                    item.title
                      .toLowerCase()
                      .includes(destinationSearch.toLowerCase()),
                  ) && (
                    <p className="p-4 text-sm text-[#53699b]">
                      No matching destinations.
                    </p>
                  )}
              </div>
            )}
          />
          <FieldError name="destination_ids" error={errors.destination_ids} />
        </Card>
      </fieldset>
      <StepActions
        step={2}
        busy={busy}
        submitDisabled={loading || Boolean(loadError)}
        onNavigate={onNavigate}
      />
    </form>
  );
}
