import "./globals.css";

export const metadata = {
  title: "ArroyoAlert — Barranquilla",
  description: "Alertas de arroyos en tiempo real para Barranquilla",
  manifest: "/manifest.json",
  themeColor: "#0c1220",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ArroyoAlert",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
