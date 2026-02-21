import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-auth";

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/api")) {
      const auth = validateApiKey(request.headers);
      if (!auth.valid) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
      }
    }
    return NextResponse.next();
  } catch (_e) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
