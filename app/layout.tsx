import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Oswald,
  Roboto,
} from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastProvider";
import { FaviconSwitcher } from "@/components/FaviconSwitcher";
import { ThemeProvider } from "@/components/ThemeProvider";

// --- Font Configurations ---

// 1. Modern / Default (Geist)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Technical / Analyst (IBM Plex) - GREAT for data
const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-sans",
  subsets: ["latin"],
});
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  variable: "--font-ibm-mono",
  subsets: ["latin"],
});

// 3. Sports Broadcast (Oswald + Roboto)
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});
const roboto = Roboto({
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  subsets: ["latin"],
});

// --- Active Theme Selection ---
// Change this to switch themes!
// Options: "modern", "technical", "broadcast"
const ACTIVE_THEME = "technical" as "modern" | "technical" | "broadcast";

const getThemeConfig = () => {
  switch (ACTIVE_THEME) {
    case "technical":
      return {
        className: `${ibmPlexSans.variable} ${ibmPlexMono.variable} theme-technical`,
      };
    case "broadcast":
      return {
        className: `${oswald.variable} ${roboto.variable} theme-broadcast`,
      };
    case "modern":
    default:
      return {
        className: `${geistSans.variable} ${geistMono.variable} theme-modern`,
      };
  }
};

export const metadata: Metadata = {
  title: "NBA 2K25 Stat Tracker",
  description: "NBA 2K25 MyPlayer stat tracking app",
};

const themeInitializer = `
(() => {
  const storageKey = "theme-preference";
  try {
    const stored = localStorage.getItem(storageKey);
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "light" || stored === "dark" ? stored : (systemPrefersDark ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeConfig = getThemeConfig();

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <FaviconSwitcher />
      </head>
      <body className={`${themeConfig.className} antialiased`}>
        <ThemeProvider>
          <ErrorBoundary>
            <ToastProvider>{children}</ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
