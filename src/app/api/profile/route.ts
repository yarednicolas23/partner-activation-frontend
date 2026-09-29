import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const res = await fetch(`${process.env.BACKEND_URL}/partners/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(await request.json()),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
