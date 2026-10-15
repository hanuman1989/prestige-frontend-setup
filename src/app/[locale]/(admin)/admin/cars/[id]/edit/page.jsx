import CarEdit from "@/components/admin/cars/CarEdit";

export default async function EditCarPage({ params }) {
  const { id } = await params;
  return <CarEdit key={id} id={id} />;
}
