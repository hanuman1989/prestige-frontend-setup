"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import { Link } from "@/i18n/navigation";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import CarCategoryForm from "./CarCategoryForm";

export default function CarCategoryEdit({ id }) {
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let isActive = true;
    async function loadCategory() {
      try {
        const response = await APIs.admin.carRental.getCategory(id);
        if (isActive) {
          setCategory(response.data);
          setError("");
        }
      } catch (failure) {
        if (isActive) {
          const message = failure.message || "Unable to load this car category. Please try again.";
          setError(message);
          toast.error(message, { position: "bottom-center" });
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadCategory();
    return () => {
      isActive = false;
    };
  }, [id, retryVersion]);

  function retry() {
    setIsLoading(true);
    setRetryVersion((value) => value + 1);
  }

  if (!isLoading && !error && category) {
    return <CarCategoryForm key={category.id} category={category} />;
  }

  return (
    <div className="text-[#0b164d] dark:text-gray-100">
      <PageBreadcrumb
        pageTitle="Edit Car Category"
        breadcrumbs={[
          { label: "Home", href: "/admin/dashboard" },
          { label: "Car Categories", href: "/admin/car-categories" },
          { label: "Edit Car Category" },
        ]}
      />
      <section className="rounded-xl border border-[#dce3f1] bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <p role="status">Loading car category...</p>
        ) : (
          <>
            <p role="alert" className="text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-md border border-blue-200 px-4 py-2 text-sm text-[#004bff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-blue-400"
            >
              Try again
            </button>
          </>
        )}
        <Link href="/admin/car-categories" className="mt-5 block text-sm text-[#004bff] hover:underline dark:text-blue-400">
          Back to Car Categories
        </Link>
      </section>
    </div>
  );
}
