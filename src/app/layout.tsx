import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Gorditas, Inter, Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gorditas = Gorditas({
  variable: "--gorditas",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Bold.otf", weight: "700", style: "bold" },
    { path: "./fonts/GeneralSans-Light.otf", weight: "300", style: "light" },
    { path: "./fonts/GeneralSans-Medium.otf", weight: "500", style: "medium" },
    {
      path: "./fonts/GeneralSans-Regular.otf",
      weight: "400",
      style: "regular",
    },
    {
      path: "./fonts/GeneralSans-Semibold.otf",
      weight: "600",
      style: "semibold",
    },
  ],
  variable: "--general-sans-text",
});

const siteUrl = "https://www.leaplearners.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Leap Learner - Interactive Learning Platform for Kids",
    template: "%s | Leap Learner",
  },
  description:
    "Leap Learner is an interactive educational platform offering engaging video lessons, quizzes, and personalized tutoring for KS2 and 11+ Mathematics. Help your child excel with our comprehensive curriculum and expert tutors.",
  keywords: [
    "online learning",
    "kids education",
    "KS2 mathematics",
    "11+ mathematics",
    "interactive learning",
    "educational videos",
    "online tutoring",
    "children education",
    "math lessons",
    "learning platform",
    "educational quizzes",
    "personalized tutoring",
  ],
  authors: [{ name: "Leap Learner" }],
  creator: "Leap Learner",
  publisher: "Leap Learner",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Leap Learner",
    title: "Leap Learner - Interactive Learning Platform for Kids",
    description:
      "Engaging video lessons, quizzes, and personalized tutoring for KS2 and 11+ Mathematics. Help your child excel with our comprehensive curriculum.",
    images: [
      {
        url: "/seo.png",
        width: 1200,
        height: 630,
        alt: "Leap Learner - Interactive Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leap Learner - Interactive Learning Platform for Kids",
    description:
      "Engaging video lessons, quizzes, and personalized tutoring for KS2 and 11+ Mathematics.",
    images: ["/seo.png"],
    creator: "@leaplearner",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#286cff",
      },
    ],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: siteUrl,
  },
  category: "education",
  classification: "Educational Platform",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Leap Learner",
    "mobile-web-app-capable": "yes",
    "theme-color": "#286cff",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#286cff" },
    { media: "(prefers-color-scheme: dark)", color: "#286cff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${gorditas.variable} ${generalSans.className} ${poppins.variable} `}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
