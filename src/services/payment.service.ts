import { readCollection, writeCollection } from "@/lib/local-db";
import { createId } from "@/lib/utils";
import { canUseFirestore, listDocs, setDocById } from "@/services/service-helpers";
import { Payment, PaymentMethod, PaymentStatus } from "@/types";

const COLLECTION = "payments";

export async function getPayments() {
  let payments = canUseFirestore()
    ? await listDocs<Payment>(COLLECTION)
    : readCollection<Payment[]>("payments");

  if (payments.length === 0) {
    payments = readCollection<Payment[]>("payments");
  }

  return payments;
}

export async function getPaymentsByCustomer(customerId: string) {
  const payments = await getPayments();
  return payments.filter((payment) => payment.customerId === customerId);
}

export async function getPaymentByOrder(orderId: string) {
  const payments = await getPayments();
  return payments.find((payment) => payment.orderId === orderId) ?? null;
}

export async function createPayment(input: Omit<Payment, "id" | "createdAt"> & { id?: string }) {
  const payment: Payment = {
    ...input,
    id: input.id ?? createId("payment"),
    createdAt: new Date().toISOString(),
  };

  if (canUseFirestore()) {
    await setDocById(COLLECTION, payment);
  }

  const payments = readCollection<Payment[]>("payments");
  writeCollection("payments", [payment, ...payments.filter((item) => item.id !== payment.id)]);
  return payment;
}

export async function markPaymentStatus(
  orderId: string,
  status: PaymentStatus,
  method?: PaymentMethod,
) {
  const payment = await getPaymentByOrder(orderId);
  if (!payment) {
    throw new Error("Payment record not found.");
  }

  return createPayment({
    ...payment,
    paymentStatus: status,
    method: method ?? payment.method,
    id: payment.id,
  });
}

