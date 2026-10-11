"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import Pagination from "@/components/admin/tables/Pagination";
import CategoryFilters from "./CategoryFilters";
import CategoryTable from "./CategoryTable";
import DeleteCategoryDialog from "./DeleteCategoryDialog";

const DEFAULT_FILTERS = {
  keyword: "",
  status: "",
};

const breadcrumbs = [
  { label: "Home", href: "/admin/dashboard" },
  { label: "Categories" },
];
const categoryAPI = APIs.admin.categories;

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    async function loadCategories() {
      try {
        const params = new URLSearchParams({ page: String(page) });
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });
        const response = await categoryAPI.getCategories(params);
        if (!isActive) return;
        setCategories(response.data);
        setPagination(response.pagination);
      } catch (failure) {
        if (!isActive) return;
        const message =
          failure.message || "Unable to load categories. Please try again.";
        setCategories([]);
        setPagination(null);
        toast.error(message, { position: "bottom-center" });
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadCategories();
    return () => {
      isActive = false;
    };
  }, [filters, page, pageSize, refreshVersion]);

  function applyFilters(values) {
    setIsLoading(true);
    setPage(1);
    setFilters(values);
  }

  function changePage(value) {
    if (value === page || isLoading || isDeleting) return;
    setIsLoading(true);
    setPage(value);
  }

  function changePageSize(event) {
    setIsLoading(true);
    setPage(1);
    setPageSize(Number(event.target.value));
  }

  async function deleteCategory() {
    if (deleteRef.current || !deleting) return;
    deleteRef.current = true;
    setIsDeleting(true);
    try {
      const response = await categoryAPI.deleteCategory(deleting.id);
      toast.success(response.message || "Category deleted successfully.", {
        position: "bottom-center",
      });
      setDeleting(null);
      setIsLoading(true);
      if (categories.length === 1 && page > 1) setPage(page - 1);
      setRefreshVersion((value) => value + 1);
    } catch (failure) {
      const message =
        failure.message || "Unable to delete the category. Please try again.";
      toast.error(message, { position: "bottom-center" });
    } finally {
      deleteRef.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6 text-[#0b164d] dark:text-gray-100">
      <PageBreadcrumb
        pageTitle="Categories"
        description="Manage travel categories and their visibility."
        breadcrumbs={breadcrumbs}
      />
      <fieldset disabled={isDeleting} className="disabled:opacity-70">
        <legend className="sr-only">Category filters</legend>
        <CategoryFilters onSearch={applyFilters} />
      </fieldset>
      <section
        aria-labelledby="categories-table-title"
        aria-busy={isLoading}
        className="overflow-hidden rounded-xl border border-[#dce3f1] bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <CategoryTable
          categories={categories}
          total={pagination?.total}
          isLoading={isLoading}
          onDelete={setDeleting}
          busy={isDeleting}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e6ebf5] px-5 py-4 text-sm text-[#53699b] md:px-6 dark:border-gray-800 dark:text-gray-400">
          <p>
            {pagination
              ? `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} categories`
              : isLoading
                ? "Loading category count..."
                : "Category count unavailable"}
          </p>
          <div className="flex items-center gap-3">
            <label htmlFor="category-page-size">Rows per page</label>
            <select
              id="category-page-size"
              value={pageSize}
              disabled={isLoading || isDeleting}
              onChange={changePageSize}
              className="h-10 rounded-md border border-[#dce3f1] bg-white px-3 text-[#0b164d] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="6">6</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
          </div>
          {pagination && (
            <Pagination
              currentPage={page}
              totalPages={Math.max(1, pagination.last_page)}
              onPageChange={changePage}
            />
          )}
        </div>
      </section>
      {deleting && (
        <DeleteCategoryDialog
          category={deleting}
          isDeleting={isDeleting}
          onClose={() => {
            if (!deleteRef.current) setDeleting(null);
          }}
          onConfirm={deleteCategory}
        />
      )}
    </div>
  );
}
