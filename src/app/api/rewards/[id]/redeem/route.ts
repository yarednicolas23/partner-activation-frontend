import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
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

  const res = await fetch(`${process.env.BACKEND_URL}/rewards/${id}/redeem`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
