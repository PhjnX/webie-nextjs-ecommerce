import { type NextRequest } from "next/server";
import { redirectAfterVnpayReturn } from "@/app/api/payment/vnpay/_return";

export async function GET(request: NextRequest) {
  return redirectAfterVnpayReturn(request);
}
