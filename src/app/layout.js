import "./globals.css";
import { GOOGLE_FONTS_HREF } from "../config/fonts";

export const metadata = {
  title: "CN System",
  description: "Credit Note Management System",
};

const googleFontsHref = GOOGLE_FONTS_HREF;

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontsHref} rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
