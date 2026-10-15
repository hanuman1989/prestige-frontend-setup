import { Link } from "@/i18n/navigation";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";
import { ImagePreview } from "@/components/admin/common/ImageUpload";
import RichTextEditor from "./RichTextEditor";
import { Card, primaryClasses, secondaryClasses } from "./PackageUI";

export default function PackageDetails({ record }) {
  return (
    <div className="space-y-5 text-[#0b164d] dark:text-gray-100">
      <PageBreadcrumb
        pageTitle={record.title}
        description="Package details and saved progress."
        breadcrumbs={[
          { label: "Home", href: "/admin/dashboard" },
          { label: "Packages", href: "/admin/packages" },
          { label: record.title },
        ]}
      />
      <div className="flex gap-3">
        <Link href="/admin/packages" className={secondaryClasses}>
          Back to Packages
        </Link>
        <Link
          href={`/admin/packages/${encodeURIComponent(record.id)}/edit`}
          className={primaryClasses}
        >
          {record.is_complete ? "Edit Package" : "Resume Package"}
        </Link>
      </div>
      <Card
        title="Basic Details"
        description={
          record.is_complete
            ? "All five steps saved."
            : `Next unfinished step: ${record.current_step}`
        }
      >
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">Title</dt>
            <dd>{record.title}</dd>
          </div>
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">Slug</dt>
            <dd>{record.slug}</dd>
          </div>
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">Duration</dt>
            <dd>{record.duration}</dd>
          </div>
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">
              Best time to visit
            </dt>
            <dd>{record.tour_best_time || "—"}</dd>
          </div>
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">Status</dt>
            <dd>{record.status ? "Active" : "Inactive"}</dd>
          </div>
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">
              Special package
            </dt>
            <dd>{record.is_special_package ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">Categories</dt>
            <dd>
              {record.categories.map((item, index) => (
                <span key={item.id}>
                  {index > 0 && " · "}
                  {item.title}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">Destinations</dt>
            <dd>
              {record.cities_covered.map((city, index) => (
                <span key={index}>
                  {index > 0 && " · "}
                  {city}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </Card>
      <Card title="Itineraries" description="Saved travel plan.">
        {record.itineraries.map((item) => (
          <div
            key={item.id}
            className="grid gap-4 border-b border-[#e6ebf5] pb-4 last:border-0 md:grid-cols-[12rem_1fr] dark:border-gray-700"
          >
            <ImagePreview
              src={item.image_url}
              alt={item.title}
              className="h-36 w-full rounded-lg object-cover"
            />
            <RichTextEditor
              id={`package-view-itinerary-${item.id}`}
              label={item.title}
              value={item.description}
              readOnly
            />
          </div>
        ))}
      </Card>
      <Card title="Package Details" description="Tour arrangements.">
        <div className="grid gap-5 lg:grid-cols-2">
          <RichTextEditor
            id="package-view-inclusion"
            label="Inclusion"
            value={record.inclusion}
            readOnly
          />
          <RichTextEditor
            id="package-view-exclusion"
            label="Exclusion"
            value={record.exclusion}
            readOnly
          />
          <RichTextEditor
            id="package-view-accommodation"
            label="Accommodation details"
            value={record.accommodation_details}
            readOnly
          />
          <RichTextEditor
            id="package-view-transportation"
            label="Transportation"
            value={record.transportation}
            readOnly
          />
        </div>
        <RichTextEditor
          id="package-view-description"
          label="Description"
          value={record.description}
          readOnly
        />
      </Card>
      <Card
        title="Package Photos"
        description="First photo is the cover image."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {record.images.map((photo) => (
            <ImagePreview
              key={photo.id}
              src={photo.image_url}
              alt={record.title}
              className="h-44 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      </Card>
      <Card title="SEO Settings">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">Meta title</dt>
            <dd>{record.meta_title || "—"}</dd>
          </div>
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">Meta keywords</dt>
            <dd>{record.meta_keyword || "—"}</dd>
          </div>
          <div>
            <dt className="text-[#53699b] dark:text-gray-400">
              Meta description
            </dt>
            <dd>{record.meta_description || "—"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
