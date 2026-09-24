import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const res = await fetch(
    `${process.env.BACKEND_URL}/partners/${id}/resend-invite`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  // 204 no trae body — no se puede reenviar con NextResponse.json.
  if (res.ok) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
