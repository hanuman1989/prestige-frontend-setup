import { useState } from "react";
import FilterSelect from "@/components/admin/common/FilterSelect";
import useCarCategories from "./useCarCategories";

export default function CarFilters({ onSearch }) {
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const { categories, isLoading, error, retry } = useCarCategories();

  function applyFilters(event) {
    event.preventDefault();
    onSearch({ keyword: keyword.trim(), car_category_id: categoryId, status });
  }

  function resetFilters() {
    setKeyword("");
    setCategoryId("");
    setStatus("");
    onSearch({ keyword: "", car_category_id: "", status: "" });
  }

  return (
    <form
      onSubmit={applyFilters}
      aria-labelledby="car-filters-title"
      className="grid items-end gap-4 rounded-xl border border-[#dce3f1] bg-white p-5 md:grid-cols-3 md:p-6 dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <label htmlFor="car-search" className="mb-2 block text-sm font-medium">
          Keyword
        </label>
        <input
          id="car-search"
          type="search"
          name="keyword"
          maxLength={255}
          placeholder="Search car title or slug"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="h-12 w-full rounded-md border border-[#dce3f1] bg-white px-4 text-sm text-[#53699b] outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 placeholder:text-[#8a9ac0] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        />
      </div>
      <FilterSelect
        id="car-filter-category"
        name="car_category_id"
        label="Category"
        value={categoryId}
        disabled={isLoading || Boolean(error)}
        aria-describedby={error ? "car-filter-category-error" : undefined}
        onChange={(event) => setCategoryId(event.target.value)}
      >
        <option value="">
          {isLoading ? "Loading categories..." : "All categories"}
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.title}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        id="car-filter-status"
        name="status"
        label="Status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </FilterSelect>
      {error && (
        <div
          id="car-filter-category-error"
          role="alert"
          className="flex flex-wrap items-center gap-3 text-sm text-red-600 md:col-span-3 dark:text-red-400"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md border border-current px-3 py-1.5 focus-visible:outline-2"
          >
            Retry categories
          </button>
        </div>
      )}
      <div className="flex gap-3 md:col-span-3">
        <button
          type="submit"
          className="h-11 rounded-md bg-[#004bff] px-6 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="h-11 rounded-md border border-blue-200 px-6 text-sm font-medium text-[#004bff] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-gray-800"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
