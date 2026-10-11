import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Providers } from "@/app/providers/Providers";
import { isRtl } from "@/i18n/languages";
import { type Locale, routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Outfit } from "next/font/google";
import { notFound } from "next/navigation";
import "simplebar-react/dist/simplebar.min.css";
import "swiper/css/bundle";
import "@/app/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <div
      lang={locale}
      dir={isRtl(locale as Locale) ? "rtl" : "ltr"}
      className={`${outfit.className} flex min-h-screen flex-1 flex-col dark:bg-gray-900`}
    >
      <NextIntlClientProvider>
        <ThemeProvider>
          <Providers>
            <SidebarProvider>{children}</SidebarProvider>
          </Providers>
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}
