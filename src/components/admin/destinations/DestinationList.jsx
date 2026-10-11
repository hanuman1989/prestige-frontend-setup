"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import Pagination from "@/components/admin/tables/Pagination";
import DestinationFilters from "./DestinationFilters";
import DestinationTable from "./DestinationTable";
import DeleteDestinationDialog from "./DeleteDestinationDialog";

const DEFAULT_FILTERS = {
  search: "",
  destination_type: "",
  status: "",
};

const breadcrumbs = [
  { label: "Home", href: "/admin/dashboard" },
  { label: "Destinations" },
];
const destinationAPI = APIs.admin.destinations;

export default function DestinationList() {
  const [destinations, setDestinations] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    let changingPage = false;
    async function loadDestinations() {
      try {
        const params = new URLSearchParams({ page: String(page), per_page: String(pageSize) });
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });
        const response = await destinationAPI.getDestinations(params);
        if (!isActive) return;
        if (page > response.pagination.last_page) {
          changingPage = true;
          setPage(Math.max(1, response.pagination.last_page));
          return;
        }
        setDestinations(response.data);
        setPagination(response.pagination);
        setError("");
      } catch (failure) {
        if (!isActive) return;
        const message =
          failure.message || "Unable to load destinations. Please try again.";
        setDestinations([]);
        setPagination(null);
        setError(message);
        toast.error(message, { position: "bottom-center" });
      } finally {
        if (isActive && !changingPage) setIsLoading(false);
      }
    }
    void loadDestinations();
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

  async function deleteDestination() {
    if (deleteRef.current || !deleting) return;
    deleteRef.current = true;
    setIsDeleting(true);
    try {
      const response = await destinationAPI.deleteDestination(deleting.id);
      toast.success(response.message || "Destination deleted successfully.", {
        position: "bottom-center",
      });
      setDeleting(null);
      setIsLoading(true);
      if (destinations.length === 1 && page > 1) setPage(page - 1);
      setRefreshVersion((value) => value + 1);
    } catch (failure) {
      const message =
        failure.message || "Unable to delete the destination. Please try again.";
      toast.error(message, { position: "bottom-center" });
    } finally {
      deleteRef.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6 text-[#0b164d] dark:text-gray-100">
      <PageBreadcrumb
        pageTitle="Destinations"
        description="Manage domestic and international destinations."
        breadcrumbs={breadcrumbs}
      />
      <fieldset disabled={isDeleting} className="disabled:opacity-70">
        <legend className="sr-only">Destination filters</legend>
        <DestinationFilters onSearch={applyFilters} />
      </fieldset>
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          <p>{error}</p>
          <button type="button" disabled={isLoading || isDeleting} onClick={() => { setIsLoading(true); setRefreshVersion((value) => value + 1); }} className="rounded-md border border-current px-3 py-1.5 focus-visible:outline-2 disabled:opacity-50">Try again</button>
        </div>
      )}
      <section
        aria-labelledby="destinations-table-title"
        aria-busy={isLoading}
        className="overflow-hidden rounded-xl border border-[#dce3f1] bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <DestinationTable
          destinations={destinations}
          total={pagination?.total}
          isLoading={isLoading}
          onDelete={setDeleting}
          busy={isDeleting}
          error={error}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e6ebf5] px-5 py-4 text-sm text-[#53699b] md:px-6 dark:border-gray-800 dark:text-gray-400">
          <p>
            {pagination
              ? `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} destinations`
              : isLoading
                ? "Loading destination count..."
                : "Destination count unavailable"}
          </p>
          <div className="flex items-center gap-3">
            <label htmlFor="destination-page-size">Rows per page</label>
            <select
              id="destination-page-size"
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
              currentPage={pagination.current_page}
              totalPages={Math.max(1, pagination.last_page)}
              onPageChange={changePage}
            />
          )}
        </div>
      </section>
      {deleting && (
        <DeleteDestinationDialog
          destination={deleting}
          isDeleting={isDeleting}
          onClose={() => {
            if (!deleteRef.current) setDeleting(null);
          }}
          onConfirm={deleteDestination}
        />
      )}
    </div>
  );
}
