import HomeContent from "./components/home";
import PaymentResultDialog from "./components/payment/PaymentResultDialog";

interface HomePageProps {
  searchParams: Promise<{
    orderId?: string | string[];
    payment?: string | string[];
  }>;
}

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return (
    <>
      <PaymentResultDialog
        orderId={readSearchParam(params.orderId)}
        result={readSearchParam(params.payment)}
      />
      <HomeContent />
    </>
  );
}
