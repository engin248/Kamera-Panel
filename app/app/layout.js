import "./globals.css";

export const metadata = {
  title: "47 Sil Baştan 01 — Adil · Şeffaf · Veri Odaklı Üretim Kontrol",
  description: "Veri ve bilgiye dayalı adil ücretlendirme, şeffaf maliyet, performans odaklı işlem bazlı ücretlendirme — emek kadar kazanç sistemi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
