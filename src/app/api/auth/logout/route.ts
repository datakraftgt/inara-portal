import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  // Verify session exists before clearing — prevents unauthenticated CSRF logout
  await verifySession(request);

  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
