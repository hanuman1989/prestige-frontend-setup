import CarCategoryEdit from "@/components/admin/carCategories/CarCategoryEdit";

export default async function EditCarCategoryPage({ params }) {
  const { id } = await params;
  return <CarCategoryEdit key={id} id={id} />;
}
