import ManagedOrderDetailPage from "@/components/ManagedOrderDetailPage";

export default function HoOrderDetailPage() {
  return (
    <ManagedOrderDetailPage
      allowedRoles={["ho"]}
      listHref="/ho/orders"
      titlePrefix="Head Office Order"
    />
  );
}
