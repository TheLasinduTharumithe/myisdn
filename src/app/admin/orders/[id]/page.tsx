import ManagedOrderDetailPage from "@/components/ManagedOrderDetailPage";

export default function AdminOrderDetailPage() {
  return (
    <ManagedOrderDetailPage
      allowedRoles={["admin"]}
      listHref="/admin/orders"
      titlePrefix="Admin Order"
    />
  );
}
