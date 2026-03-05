import dotenv from "dotenv";
import { resolve } from "path";
import { analyzeModelRisk } from "../lib/agents/tekniker.js";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function runTest() {
    console.log("🧠 Kamera-Panel Tekniker Ajanı (pgVector + LangChain) Testi Başlıyor...");
    console.log("Kumaş Cinsi: Pamuklu Şardonlu Üç İplik\nModel Tipi: Kapşonlu Sweatshirt\nHedef Fason Kar: 15%\n");

    const result = await analyzeModelRisk("Pamuklu Şardonlu Üç İplik", 15, "Kapşonlu Sweatshirt");

    if (result.success) {
        console.log("✅ Ajan Başarıyla Yanıt Verdi:\n");
        console.log(result.ajan_cevabi);
        console.log("\n📊 Hafıza Kullanıldı mı:", result.hafiza_kullanildi ? "Evet (Geçmiş Tecrübe)" : "Hayır (Sıfırdan Zeka)");
    } else {
        console.error("❌ Ajan Hatası:", result.error);
    }
}

runTest();
