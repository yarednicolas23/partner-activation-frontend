import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Programa de Ativação de Parceiros | Kaspersky",
  description: "Portal de parceiros — Kaspersky Partner Activation Program",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
