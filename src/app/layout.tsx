import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Unbounded } from "next/font/google";
import { ConsentDialog } from "./consent-dialog";
import { Header } from "./header";
import { getUser } from "@/lib/session";
import "./globals.css";

const body = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });
const display = Unbounded({ variable: "--font-display-face", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Анкета особового складу",
  description: "Опитування щодо умов служби, проживання, навчання, забезпечення та безпеки",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6e9e1" },
    { media: "(prefers-color-scheme: dark)", color: "#121812" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  return (
    <html lang="uk" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Header user={user ? { name: user.name, role: user.role } : null} />
        {children}
        {!user && <ConsentDialog />}
      </body>
    </html>
  );
}
