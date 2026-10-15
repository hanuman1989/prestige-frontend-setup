"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import Pagination from "@/components/admin/tables/Pagination";
import PackageFilters from "./PackageFilters";
import PackageTable from "./PackageTable";
import { ConfirmationDialog, secondaryClasses } from "./PackageUI";

export default function PackageList() {
  const [packages, setPackages] = useState([]);
  const [filters, setFilters] = useState({ keyword: "", status: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    async function loadPackages() {
      let changingPage = false;
      try {
        const params = { page, per_page: pageSize };
        if (filters.keyword) params.keyword = filters.keyword;
        if (filters.status !== "") params.status = filters.status;
        const response = await APIs.admin.packages.getpackages(params);
        if (!isActive) return;
        if (page > response.pagination.last_page && page > 1) {
          changingPage = true;
          setPage(Math.max(1, response.pagination.last_page));
          return;
        }
        setPackages(response.data);
        setPagination(response.pagination);
        setError("");
      } catch (failure) {
        if (!isActive) return;
        const message =
          failure.message || "Unable to load packages. Please try again.";
        setPackages([]);
        setPagination(null);
        setError(message);
        toast.error(message, { position: "bottom-center" });
      } finally {
        if (isActive && !changingPage) setLoading(false);
      }
    }
    void loadPackages();
    return () => {
      isActive = false;
    };
  }, [filters, page, pageSize, refreshVersion]);

  async function deletePackage() {
    if (deleteRef.current || !deleting) return;
    deleteRef.current = true;
    setIsDeleting(true);
    try {
      const response = await APIs.admin.packages.deletePackage(deleting.id);
      toast.success(response.message || "Package deleted successfully.", {
        position: "bottom-center",
      });
      setDeleting(null);
      setLoading(true);
      if (packages.length === 1 && page > 1) setPage(page - 1);
      setRefreshVersion((value) => value + 1);
    } catch (failure) {
      toast.error(
        failure.message || "Unable to delete the package. Please try again.",
        { position: "bottom-center" },
      );
    } finally {
      deleteRef.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6 text-[#0b164d] dark:text-gray-100">
      <PageBreadcrumb
        pageTitle="Packages"
        description="Manage travel packages."
        breadcrumbs={[
          { label: "Home", href: "/admin/dashboard" },
          { label: "Packages" },
        ]}
      />
      <fieldset disabled={isDeleting}>
        <legend className="sr-only">Package filters</legend>
        <PackageFilters
          onSearch={(values) => {
            setLoading(true);
            setPage(1);
            setFilters(values);
          }}
        />
      </fieldset>
      <section
        aria-labelledby="packages-table-title"
        aria-busy={loading}
        className="overflow-hidden rounded-xl border border-[#dce3f1] bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <PackageTable
          packages={packages}
          total={pagination?.total}
          loading={loading}
          busy={isDeleting}
          error={error}
          onDelete={setDeleting}
        />
        {error && (
          <div role="alert" className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              className={`${secondaryClasses} mt-4`}
              onClick={() => {
                setLoading(true);
                setRefreshVersion((value) => value + 1);
              }}
            >
              Try again
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e6ebf5] px-5 py-4 text-sm text-[#53699b] md:px-6 dark:border-gray-800 dark:text-gray-400">
          <p>
            {pagination
              ? `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} packages`
              : loading
                ? "Loading package count..."
                : "Package count unavailable"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="package-page-size">Rows per page</label>
            <select
              id="package-page-size"
              value={pageSize}
              disabled={loading || isDeleting}
              onChange={(event) => {
                setLoading(true);
                setPage(1);
                setPageSize(Number(event.target.value));
              }}
              className="h-10 rounded-md border border-[#dce3f1] bg-white px-3 text-[#0b164d] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="6">6</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
            {pagination && (
              <Pagination
                currentPage={pagination.current_page}
                totalPages={Math.max(1, pagination.last_page)}
                onPageChange={(value) => {
                  if (loading || isDeleting || value === page) return;
                  setLoading(true);
                  setPage(value);
                }}
              />
            )}
          </div>
        </div>
      </section>
      {deleting && (
        <ConfirmationDialog
          title="Delete Package"
          description={`Are you sure you want to delete “${deleting.title}”? This action cannot be undone.`}
          confirmLabel="Delete Package"
          busy={isDeleting}
          destructive
          onClose={() => {
            if (!deleteRef.current) setDeleting(null);
          }}
          onConfirm={deletePackage}
        />
      )}
    </div>
  );
}
