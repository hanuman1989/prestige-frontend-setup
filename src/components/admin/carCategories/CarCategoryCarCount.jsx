import { useEffect, useState } from "react";
import APIs from "@/lib/apis";
import { ArrowRightIcon } from "@/icons";

export default function CarCategoryCarCount({ category, busy, onView }) {
  const [total, setTotal] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    async function loadCount() {
      try {
        // Category responses do not include counts; request only one car.
        const response = await APIs.admin.carRental.getCars({
          car_category_id: category.id,
          per_page: 1,
          page: 1,
        });
        if (isActive) setTotal(response.pagination.total);
      } catch (failure) {
        if (isActive) setError(failure.message || "Unable to load the car count.");
      }
    }
    void loadCount();
    return () => { isActive = false; };
  }, [category.id]);

  return (
    <div className="min-w-28">
      <p className="font-semibold text-[#004bff] dark:text-blue-400" title={error || undefined}>
        {error ? "Count unavailable" : total === null ? "Loading..." : `${total} ${total === 1 ? "car" : "cars"}`}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onView}
        aria-label={`View cars in ${category.title}`}
        className="mt-1 inline-flex items-center gap-2 rounded-sm text-[#004bff] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:text-blue-400"
      >
        View Cars
        <ArrowRightIcon aria-hidden="true" className="size-4 rtl:rotate-180" viewBox="0 0 20 20" />
      </button>
    </div>
  );
}
