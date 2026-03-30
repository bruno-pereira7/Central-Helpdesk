import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts";

export const metadata: Metadata = {
  title: "Help Desk - Portal de Chamados",
  description: "Sistema de gestão de chamados de suporte técnico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
