"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import { Link } from "@/i18n/navigation";
import PackageForm from "./PackageForm";
import PackageDetails from "./PackageDetails";
import { secondaryClasses } from "./PackageUI";

export default function PackageRecord({ id, editing = false }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let isActive = true;
    async function loadPackage() {
      try {
        const response = await APIs.admin.packages.getPackage(id);
        if (isActive) {
          setRecord(response.data);
          setError("");
        }
      } catch (failure) {
        if (isActive) {
          const message =
            failure.message || "Unable to load this package. Please try again.";
          setError(message);
          toast.error(message, { position: "bottom-center" });
        }
      } finally {
        if (isActive) setLoading(false);
      }
    }
    void loadPackage();
    return () => {
      isActive = false;
    };
  }, [id, retry]);
  if (!loading && !error && record)
    return editing ? (
      <PackageForm key={record.id} packageRecord={record} />
    ) : (
      <PackageDetails record={record} />
    );
  return (
    <section className="rounded-xl border border-[#dce3f1] bg-white p-8 text-center text-[#0b164d] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {loading ? (
        <p role="status">Loading package...</p>
      ) : (
        <>
          <p role="alert" className="text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            type="button"
            className={`${secondaryClasses} mt-4`}
            onClick={() => {
              setLoading(true);
              setRetry((value) => value + 1);
            }}
          >
            Try again
          </button>
        </>
      )}
      <Link
        href="/admin/packages"
        className="mt-5 block text-sm text-[#004bff] hover:underline dark:text-blue-400"
      >
        Back to Packages
      </Link>
    </section>
  );
}
