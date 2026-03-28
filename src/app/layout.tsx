import type { Metadata } from "next";
// import SevakChatbot from "@/components/SevakChatbot";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneSUTRA | Conscious Living",
  description: "OneSUTRA — your conscious digital sanctuary. Personalized Vedic wellness, mindful connection, and AI-powered guidance for holistic well-being.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OneSUTRA",
  },
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "SUTRAConnect",
  },
};

import { LanguageProvider } from "@/context/LanguageContext";
import { OutplugsProvider } from "@/context/OutplugsContext";
import ConditionalVahanaBar from "@/components/ConditionalVahanaBar";
import ZoomManager from "@/components/ZoomManager";
import GlobalAutoPilot from "@/components/GlobalAutoPilot";
import GlobalFCM from '@/components/GlobalFCM';
import ToastProvider from '@/components/ToastProvider';
import NextauthSessionProvider from '@/components/NextauthSessionProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ZoomManager />
        <NextauthSessionProvider>
          <OutplugsProvider>
            <LanguageProvider>
              <ToastProvider />
              <GlobalAutoPilot />
              <ConditionalVahanaBar />
              <main>
                {children}
              </main>
            </LanguageProvider>
          </OutplugsProvider>
        </NextauthSessionProvider>
      </body>
    </html>
  );
}

