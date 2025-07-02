import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- UPDATED METADATA ---
export const metadata: Metadata = {
  title: "Image to Text Converter", // Updated title for your browser tab
  description: "Convert images to text using Optical Character Recognition (OCR) directly in your browser with Next.js and Tesseract.js.", // More descriptive
  icons: {
    // This points to your favicon file in the 'public' directory.
    // Ensure you have a 'favicon.ico' or 'icon.png' (and update path if needed)
    icon: "/favicon.ico",
  },
  // You can add more meta tags here if needed, e.g.,
  // keywords: ["image to text", "ocr", "converter", "nextjs", "tesseract.js"],
  // openGraph: {
  //   title: "Image to Text Converter",
  //   description: "Convert images to text using OCR.",
  //   url: "https://your-app-url.com", // Replace with your actual app URL
  //   siteName: "Image to Text Converter",
  //   images: [
  //     {
  //       url: "https://your-app-url.com/og-image.jpg", // An image for social sharing
  //       width: 1200,
  //       height: 630,
  //       alt: "Image to Text Converter",
  //     },
  //   ],
  // },
  // twitter: {
  //   card: "summary_large_image",
  //   title: "Image to Text Converter",
  //   description: "Convert images to text using OCR.",
  //   creator: "@yourtwitterhandle", // Replace with your Twitter handle
  //   images: ["https://your-app-url.com/twitter-image.jpg"], // An image for Twitter sharing
  // },
};
// --- END UPDATED METADATA ---

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}