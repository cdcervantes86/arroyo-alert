import "./globals.css";

export const metadata = {
  title: "AlertaArroyo — Barranquilla",
  description: "Real-time street flood alerts for Barranquilla. Crowdsourced arroyo reports to protect your community.",
  manifest: "/manifest.json",
  openGraph: {
    title: "AlertaArroyo — Barranquilla",
    description: "Alertas de arroyos en tiempo real. Protege a tu comunidad.",
    url: "https://arroyo-alert.vercel.app",
    siteName: "AlertaArroyo",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AlertaArroyo — Barranquilla",
    description: "Alertas de arroyos en tiempo real para Barranquilla",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AlertaArroyo",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0f1a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
