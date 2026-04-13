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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var CURRENT = "0.10.1";
            try {
              fetch("/api/version", { cache: "no-store" })
                .then(function(r) { return r.json(); })
                .then(function(d) {
                  if (d.version && d.version !== CURRENT) {
                    var el = document.createElement("div");
                    el.id = "pwa-update-bar";
                    el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;padding:14px 16px;background:#0f1628;border-bottom:1px solid rgba(34,197,94,0.2);display:flex;align-items:center;gap:10px;font-family:system-ui,sans-serif;";
                    el.innerHTML = '<span style="font-size:14px">🔄</span><span style="flex:1;font-size:13px;color:#86efac;font-weight:600">Update available (v' + d.version + ')</span><button onclick="caches.keys().then(function(k){k.forEach(function(n){caches.delete(n)})});location.reload(true)" style="padding:7px 16px;border-radius:20px;background:#22c55e;border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Update</button>';
                    document.body.prepend(el);
                  }
                }).catch(function(){});
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
