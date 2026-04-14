import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/presentation/providers/theme-provider";
import { AuthProvider } from "@/presentation/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { SITE_NAME } from "@/components/shared/site-name";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scct-damages.vercel.app/"),
  title: `${SITE_NAME} — Client Data Collection`,
  description:
    "Dynamic client data collection and admin review system with bilingual support",
  verification: {
    google: "K2hBH3SrfPai7vh5FKzjqFugBv_kw7QmvPr-HxqVOGQ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
    <html lang={locale} dir={dir} suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider messages={messages} locale={locale}>
              <AuthProvider>
                {children}
                <Toaster richColors position={dir === "rtl" ? "top-left" : "top-right"} />
              </AuthProvider>
            </NextIntlClientProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
