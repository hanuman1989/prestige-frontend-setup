import PackageRecord from "@/components/admin/packages/PackageRecord";

export default async function EditPackagePage({ params }) {
  const { id } = await params;
  return <PackageRecord key={id} id={id} editing />;
}
