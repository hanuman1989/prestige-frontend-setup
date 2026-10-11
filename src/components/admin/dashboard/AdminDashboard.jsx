import { EcommerceMetrics } from "@/components/admin/ecommerce/EcommerceMetrics";
import PageBreadcrumb from "@/components/admin/common/PageBreadCrumb";

const breadcrumbs = [
  { label: "Home", href: "/admin/dashboard" },
  { label: "Dashboard" },
];

export default function AdminDashboard() {
  return (
    <>
      <PageBreadcrumb pageTitle="Dashboard" breadcrumbs={breadcrumbs} />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 ">
          <EcommerceMetrics />
        </div>
      </div>
    </>
  );
}
