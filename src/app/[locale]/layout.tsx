import type { Metadata } from "next";
import { NextIntlClientProvider, useMessages } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/presentation/providers/theme-provider";
import { AuthProvider } from "@/presentation/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "SCCT — Client Data Collection",
  description:
    "Dynamic client data collection and admin review system with bilingual support",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster richColors position={dir === "rtl" ? "top-left" : "top-right"} />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
