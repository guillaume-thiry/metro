import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import LangToggle from "@/app/components/LangToggle";

export const metadata: Metadata = {
  title: "Paris Métro Quiz",
  description: "How well do you know the Paris Métro?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark');})();` }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <LangProvider>
            <LangToggle />
            {children}
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
