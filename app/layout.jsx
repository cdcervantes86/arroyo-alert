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
  themeColor: "#080d18",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
