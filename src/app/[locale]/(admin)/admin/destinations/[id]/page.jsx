import DestinationRecord from "@/components/admin/destinations/DestinationRecord";

export default async function DestinationDetailsPage({ params }) {
  const { id } = await params;
  return <DestinationRecord key={id} id={id} />;
}
