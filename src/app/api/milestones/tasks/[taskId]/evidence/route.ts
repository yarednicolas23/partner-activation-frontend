import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
  };

  let body: BodyInit;
  if (contentType.includes("multipart/form-data")) {
    // No seteamos Content-Type a mano: fetch arma el boundary correcto solo
    // cuando el body es un FormData.
    body = await request.formData();
  } else {
    headers["Content-Type"] = "application/json";
    body = await request.text();
  }

  const res = await fetch(
    `${process.env.BACKEND_URL}/milestones/tasks/${taskId}/evidence`,
    { method: "POST", headers, body },
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
