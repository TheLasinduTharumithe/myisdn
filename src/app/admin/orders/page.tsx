import ManagedOrdersPage from "@/components/ManagedOrdersPage";

export default function AdminOrdersPage() {
  return (
    <ManagedOrdersPage
      allowedRoles={["admin"]}
      title="Customer Order Management"
      description="Review, track, and manage customer order progress across approval, delivery, and completion."
      detailsBasePath="/admin/orders"
    />
  );
}
