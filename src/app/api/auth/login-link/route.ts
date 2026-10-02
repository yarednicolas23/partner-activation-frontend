import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy público (sem sessão) para o backend enviar o magic link de login
 * com a plantilla da plataforma. 204 em sucesso — também para e-mails não
 * cadastrados, para não revelar quais existem.
 */
export async function POST(request: NextRequest) {
  const res = await fetch(`${process.env.BACKEND_URL}/auth/login-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
