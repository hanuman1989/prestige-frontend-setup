import { useState } from "react";
import FilterSelect from "@/components/admin/common/FilterSelect";

const inputClasses =
  "h-12 w-full rounded-md border border-[#dce3f1] bg-white px-4 text-sm text-[#53699b] outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

export default function AdminUserFilters({ defaultFilters, onSearch }) {
  const [filters, setFilters] = useState(defaultFilters);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.({ ...filters, keyword: filters.keyword.trim() });
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    onSearch?.(defaultFilters);
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Filter admin users"
      className="grid items-end gap-4 rounded-xl border border-[#dce3f1] bg-white p-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:p-6 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <label
          htmlFor="admin-search"
          className="mb-2 block text-sm font-medium"
        >
          Search
        </label>
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="pointer-events-none absolute start-4 top-3.5 size-5 text-[#53699b]"
          >
            <circle cx="10.5" cy="10.5" r="7.5" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            id="admin-search"
            name="keyword"
            type="search"
            placeholder="Name, email or mobile"
            value={filters.keyword}
            onChange={handleChange}
            className={`${inputClasses} ps-12 placeholder:text-[#8a9ac0]`}
          />
        </div>
      </div>
      <FilterSelect
        id="admin-status"
        name="status"
        label="Status"
        value={filters.status}
        onChange={handleChange}
      >
        <option value="">All</option>
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </FilterSelect>

      <div className="flex gap-3 sm:col-span-2 lg:col-span-3 xl:col-span-1">
        <button
          type="submit"
          className="h-12 flex-1 whitespace-nowrap rounded-md bg-[#004bff] px-6 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="h-12 flex-1 rounded-md border border-blue-200 px-6 text-sm font-medium text-[#004bff] transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-gray-800"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
