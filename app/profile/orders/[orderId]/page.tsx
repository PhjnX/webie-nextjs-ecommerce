import OrderDetailClient from "./OrderDetailClient";

interface ProfileOrderDetailPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ payment?: string | string[] }>;
}

export default async function ProfileOrderDetailPage({
  params,
  searchParams,
}: ProfileOrderDetailPageProps) {
  const { orderId } = await params;
  const { payment } = await searchParams;
  const paymentResult = Array.isArray(payment) ? payment[0] : payment;

  return (
    <OrderDetailClient orderId={orderId} paymentResult={paymentResult ?? ""} />
  );
}
