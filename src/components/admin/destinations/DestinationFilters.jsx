import { useState } from "react";
import FilterSelect from "@/components/admin/common/FilterSelect";

export default function DestinationFilters({ onSearch }) {
  const [search, setSearch] = useState("");
  const [destinationType, setDestinationType] = useState("");
  const [status, setStatus] = useState("");

  function applyFilters(event) {
    event.preventDefault();
    onSearch({ search, destination_type: destinationType, status });
  }

  function resetFilters() {
    setSearch("");
    setDestinationType("");
    setStatus("");
    onSearch({ search: "", destination_type: "", status: "" });
  }

  return (
    <form
      onSubmit={applyFilters}
      aria-label="Filter destinations"
      className="grid items-end gap-4 rounded-xl border border-[#dce3f1] bg-white p-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:p-6 dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <label
          htmlFor="destination-search"
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
            className="pointer-events-none absolute start-4 top-3.5 size-5 text-[#53699b]"
          >
            <circle cx="10.5" cy="10.5" r="7.5" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            id="destination-search"
            name="search"
            type="search"
            maxLength={255}
            placeholder="Search title or slug"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 w-full rounded-md border border-[#dce3f1] bg-white ps-12 pe-4 text-sm text-[#53699b] outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 placeholder:text-[#8a9ac0] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          />
        </div>
      </div>
      <FilterSelect
        id="destination-filter-type"
        name="destination_type"
        label="Type"
        value={destinationType}
        onChange={(event) => setDestinationType(event.target.value)}
      >
        <option value="">All types</option>
        <option value="1">Domestic</option>
        <option value="2">International</option>
      </FilterSelect>
      <FilterSelect
        id="destination-filter-status"
        name="status"
        label="Status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </FilterSelect>
      <div className="flex gap-3 md:col-span-2 xl:col-span-1">
        <button
          type="submit"
          className="h-12 flex-1 whitespace-nowrap rounded-md bg-[#004bff] px-6 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="h-12 flex-1 rounded-md border border-blue-200 px-6 text-sm font-medium text-[#004bff] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-gray-800"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
