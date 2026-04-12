import type { Metadata } from "next";
import { Vollkorn, Chivo, IBM_Plex_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const vollkorn = Vollkorn({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

const chivo = Chivo({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BrickData — UK Property Data for Every Address",
    template: "%s | BrickData",
  },
  description:
    "Free UK property data: price history from Land Registry, EPC energy ratings, crime stats, and more for every residential address in England & Wales.",
  metadataBase: new URL("https://brickdata.co.uk"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "BrickData",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${vollkorn.variable} ${chivo.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bd-bg text-bd-text">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
