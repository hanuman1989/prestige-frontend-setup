import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";

export default function useCarCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let isActive = true;
    async function loadCategories() {
      try {
        const records = [];
        let page = 1;
        let lastPage = 1;
        // Load every page so categories beyond the first 100 remain selectable.
        do {
          const response = await APIs.admin.carRental.getCategories({
            page,
            per_page: 100,
          });
          if (!isActive) return;
          records.push(...response.data);
          lastPage = response.pagination.last_page;
          page += 1;
        } while (page <= lastPage);
        setCategories(records);
        setError("");
      } catch (failure) {
        if (!isActive) return;
        const message =
          failure.message || "Unable to load car categories. Please try again.";
        setError(message);
        toast.error(message, { position: "bottom-center" });
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadCategories();
    return () => {
      isActive = false;
    };
  }, [retryVersion]);

  function retry() {
    setIsLoading(true);
    setError("");
    setRetryVersion((value) => value + 1);
  }

  return { categories, isLoading, error, retry };
}
