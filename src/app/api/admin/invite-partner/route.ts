import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Reenvía la invitación al backend con el access_token de la sesión.
 * No reinterpreta la respuesta: el backend ya distingue 403 (rol
 * insuficiente), 409 (email duplicado) y 400 (validación).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();

  const res = await fetch(`${process.env.BACKEND_URL}/partners`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
