import "./globals.css";

export const metadata = {
  title: "ArroyoAlerta — Barranquilla",
  description: "Alertas de arroyos en tiempo real para Barranquilla",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#080d18",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ minHeight: "100dvh" }}>{children}</body>
    </html>
  );
}
