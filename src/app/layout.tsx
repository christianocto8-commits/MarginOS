import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { OutletProvider } from "@/context/OutletContext";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MarginOS - F&B Recipe Costing & COGS Engineering Platform",
  description:
    "Aplikasi profesional kalkulasi HPP resep, konversi yield bahan baku, simulasi komisi online delivery, analisis varians stok opname, dan Menu Engineering BCG Matrix untuk bisnis F&B Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('marginos_theme') || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.style.colorScheme = 'dark';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen selection:bg-[#00b5ad]/30 selection:text-teal-200`}
      >
        <ThemeProvider>
          <OutletProvider>
            <AppShell>{children}</AppShell>
          </OutletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
