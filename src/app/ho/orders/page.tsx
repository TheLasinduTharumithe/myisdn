import ManagedOrdersPage from "@/components/ManagedOrdersPage";

export default function HoOrdersPage() {
  return (
    <ManagedOrdersPage
      allowedRoles={["ho"]}
      title="Island-wide Order Control"
      description="Track customer orders from head office and manage approvals, delivery progression, and final completion."
      detailsBasePath="/ho/orders"
    />
  );
}
