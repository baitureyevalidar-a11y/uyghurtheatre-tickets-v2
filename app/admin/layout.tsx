import { EB_Garamond, Manrope } from "next/font/google";
import "../globals.css";

const garamond = EB_Garamond({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "Админка — Уйғур театры",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${garamond.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg-elevated font-sans text-text-primary">
        {children}
      </body>
    </html>
  );
}
