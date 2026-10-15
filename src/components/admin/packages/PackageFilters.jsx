"use client";

import { useState } from "react";
import FilterSelect from "@/components/admin/common/FilterSelect";
import { inputClasses, primaryClasses, secondaryClasses } from "./PackageUI";

const defaults = { keyword: "", status: "" };

export default function PackageFilters({ onSearch }) {
  const [filters, setFilters] = useState(defaults);
  return (
    <form
      aria-label="Filter packages"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch({ ...filters, keyword: filters.keyword.trim() });
      }}
      className="grid items-end gap-4 rounded-xl border border-[#dce3f1] bg-white p-5 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_auto] md:p-6 dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <label htmlFor="package-keyword" className="block text-sm font-medium">
          Keyword
        </label>
        <input
          id="package-keyword"
          type="search"
          maxLength={255}
          placeholder="Search packages"
          className={inputClasses}
          value={filters.keyword}
          onChange={(event) =>
            setFilters((values) => ({ ...values, keyword: event.target.value }))
          }
        />
      </div>
      <FilterSelect
        id="package-filter-status"
        name="status"
        label="Status"
        value={filters.status}
        onChange={(event) =>
          setFilters((values) => ({ ...values, status: event.target.value }))
        }
      >
        <option value="">All statuses</option>
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </FilterSelect>
      <div className="flex gap-3 sm:col-span-2 xl:col-span-1">
        <button type="submit" className={`${primaryClasses} flex-1`}>
          Apply Filters
        </button>
        <button
          type="button"
          className={`${secondaryClasses} flex-1`}
          onClick={() => {
            setFilters(defaults);
            onSearch({ ...defaults });
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}
