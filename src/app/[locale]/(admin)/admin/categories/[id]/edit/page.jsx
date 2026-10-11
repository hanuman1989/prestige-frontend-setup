import CategoryEdit from "@/components/admin/categories/CategoryEdit";

export default async function EditCategoryPage({ params }) {
  const { id } = await params;
  return <CategoryEdit key={id} id={id} />;
}
