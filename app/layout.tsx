import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Music Theory Tools",
  description: "Interactive music theory learning platform with scales, chords, rhythm patterns, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="initialize-theme" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var storageKey = "appearance-setting";
                var root = document.documentElement;
                var stored = window.localStorage.getItem(storageKey);
                var forced = stored === "light" || stored === "dark" ? stored : null;

                if (forced) {
                  root.setAttribute("data-theme", forced);
                } else {
                  root.removeAttribute("data-theme");
                }

                var isDark = forced ? forced === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;

                if (isDark) {
                  root.classList.add("dark");
                } else {
                  root.classList.remove("dark");
                }
              } catch (error) {
                // Ignore theme restoration errors (e.g. disabled storage)
              }
            })();
          `.trim()}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
