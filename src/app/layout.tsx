import type { Metadata } from "next";
import { Albert_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Once-Pay",
  description: "Once-Pay — pay once, done.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${albertSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="system" richColors position="top-center" />
      </body>
    </html>
  );
}