import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-auth";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 仅对 /api 开头的请求做 API Key 校验
  if (pathname.startsWith("/api")) {
    const auth = validateApiKey(request.headers);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
