"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import { Link } from "@/i18n/navigation";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import DestinationForm from "./DestinationForm";
import DestinationDetails from "./DestinationDetails";

export default function DestinationRecord({ id, editing = false }) {
  const [destination, setDestination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let isActive = true;
    async function loadDestination() {
      try {
        const response = await APIs.admin.destinations.getDestination(id);
        if (isActive) { setDestination(response.data); setError(""); }
      } catch (failure) {
        if (isActive) {
          const message = failure.message || "Unable to load this destination. Please try again.";
          setError(message);
          toast.error(message, { position: "bottom-center" });
        }
      } finally { if (isActive) setIsLoading(false); }
    }
    void loadDestination();
    return () => { isActive = false; };
  }, [id, retryVersion]);

  if (!isLoading && !error && destination) {
    return editing
      ? <DestinationForm key={destination.id} destination={destination} />
      : <DestinationDetails destination={destination} />;
  }
  return (
    <div className="text-[#0b164d] dark:text-gray-100">
      <PageBreadcrumb pageTitle={editing ? "Edit Destination" : "Destination Details"} breadcrumbs={[{ label: "Home", href: "/admin/dashboard" }, { label: "Destinations", href: "/admin/destinations" }, { label: editing ? "Edit Destination" : "Destination Details" }]} />
      <section className="rounded-xl border border-[#dce3f1] bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? <p role="status">Loading destination...</p> : <><p role="alert" className="text-red-600 dark:text-red-400">{error}</p><button type="button" onClick={() => { setIsLoading(true); setRetryVersion((value) => value + 1); }} className="mt-4 rounded-md border border-blue-200 px-4 py-2 text-sm text-[#004bff] dark:border-gray-700 dark:text-blue-400">Try again</button></>}
        <Link href="/admin/destinations" className="mt-5 block text-sm text-[#004bff] hover:underline dark:text-blue-400">Back to Destinations</Link>
      </section>
    </div>
  );
}
