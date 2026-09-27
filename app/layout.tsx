import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Pérola Leite | Unhas & Agendamento em Lavras",
  description: "Agende seu atendimento no Studio Pérola Leite em Lavras, MG. Alongamento, esmaltação em gel, blindagem e nail art.",
  openGraph: { title: "Studio Pérola Leite", description: "Unhas que traduzem quem você é. Reserve seu horário em Lavras, MG.", type: "website", locale: "pt_BR" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
