import { Link } from "@/i18n/navigation";
import { ChevronLeftIcon, PencilIcon } from "@/icons";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import { ImagePreview } from "@/components/admin/common/ImageUpload";

const cardClasses = "min-w-0 rounded-xl border border-[#dce3f1] bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-gray-900";
const valueClasses = "mt-1 whitespace-pre-wrap break-words text-sm text-[#53699b] dark:text-gray-400";

export default function DestinationDetails({ destination }) {
  return (
    <div className="w-full min-w-0 space-y-5 text-[#0b164d] dark:text-gray-100">
      <PageBreadcrumb
        pageTitle="Destination Details"
        description={destination.title}
        breadcrumbs={[{ label: "Home", href: "/admin/dashboard" }, { label: "Destinations", href: "/admin/destinations" }, { label: "Destination Details" }]}
      />
      <div className="flex flex-wrap justify-between gap-3">
        <Link href="/admin/destinations" className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2.5 text-sm text-[#004bff] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400">
          <ChevronLeftIcon aria-hidden="true" className="size-5" />Back to Destinations
        </Link>
        <Link href={`/admin/destinations/${encodeURIComponent(destination.id)}/edit`} className="inline-flex items-center gap-2 rounded-md bg-[#004bff] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600">
          <PencilIcon aria-hidden="true" className="size-5" />Edit Destination
        </Link>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <section className={cardClasses}>
            <h2 className="text-xl font-semibold">Destination Details</h2>
            <dl className="mt-4 space-y-4">
              <div><dt className="text-sm font-medium">Title</dt><dd className={valueClasses}>{destination.title}</dd></div>
              <div><dt className="text-sm font-medium">Slug</dt><dd className={valueClasses}>{destination.slug}</dd></div>
              <div><dt className="text-sm font-medium">Description</dt><dd className={valueClasses}>{destination.description || "—"}</dd></div>
            </dl>
          </section>
          <section className={cardClasses}>
            <h2 className="text-xl font-semibold">SEO Settings</h2>
            <dl className="mt-4 space-y-4">
              <div><dt className="text-sm font-medium">Meta title</dt><dd className={valueClasses}>{destination.meta_title || "—"}</dd></div>
              <div><dt className="text-sm font-medium">Meta keywords</dt><dd className={valueClasses}>{destination.meta_keyword || "—"}</dd></div>
              <div><dt className="text-sm font-medium">Meta description</dt><dd className={valueClasses}>{destination.meta_description || "—"}</dd></div>
            </dl>
          </section>
        </div>
        <div className="min-w-0 space-y-5">
          <section className={cardClasses}>
            <h2 className="mb-4 text-xl font-semibold">Destination Image</h2>
            <ImagePreview src={destination.image_url} alt={destination.title} className="h-56 w-full rounded-lg object-contain" />
          </section>
          <section className={cardClasses}>
            <h2 className="text-xl font-semibold">Destination Settings</h2>
            <dl className="mt-4 space-y-4">
              <div><dt className="text-sm font-medium">Destination type</dt><dd className={valueClasses}>{destination.destination_type === 1 ? "Domestic" : "International"}</dd></div>
              <div><dt className="text-sm font-medium">Most popular</dt><dd className={valueClasses}>{destination.is_most_popular ? "Yes" : "No"}</dd></div>
              <div><dt className="text-sm font-medium">Status</dt><dd className={valueClasses}>{destination.status ? "Active" : "Inactive"}</dd></div>
              <div><dt className="text-sm font-medium">Created at</dt><dd className={valueClasses}>{destination.created_at ? <time dateTime={destination.created_at}>{destination.created_at}</time> : "—"}</dd></div>
              <div><dt className="text-sm font-medium">Updated at</dt><dd className={valueClasses}>{destination.updated_at ? <time dateTime={destination.updated_at}>{destination.updated_at}</time> : "—"}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
