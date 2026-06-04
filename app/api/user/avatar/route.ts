import { type NextRequest } from "next/server";
import { proxyAvatarUploadToUserApi } from "../_utils";

export async function POST(request: NextRequest) {
  return proxyAvatarUploadToUserApi(request);
}
