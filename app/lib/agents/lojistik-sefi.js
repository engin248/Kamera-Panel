import { ChatOpenAI } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

// Supabase İstemcisi
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Lojistik Şefi LLM (GPT-4o)
const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.1, // Stok ve matematiksel verilerde net, sıfıra yakın halüsinasyon
});

/**
 * Lojistik Şefi Ajanı:
 * Reçete (BOM) çıkınca depo stoklarını, kumaş ve aksesuar durumlarını analiz eder.
 * Eksik parça varsa üretimi başlatmaz, maliyeti çıkarır ve Baş Asistana / Engin Bey'e raporlar.
 * 
 * @param {Array} recete Öğeleri - [{ad: 'Kumaş Modal', miktar_gereken: 500, birim: 'kg'}, ...]
 * @param {Array} depoStogu Güncel Depo Stokları - [{ad: 'Kumaş Modal', stok_miktari: 300}, ...]
 * @param {string} modelMiktari Üretilecek toplam adet
 */
export async function approveLogistics(recete, depoStogu, modelMiktari) {
    try {
        // [API MALİYET KALKANI]: Önce Matematik ve SQL Taraması (Sıfır Maliyet)
        let eksikVarMi = false;
        const eksikListesi = [];

        recete.forEach(item => {
            const toplamIhtiyac = item.miktar_gereken * parseFloat(modelMiktari || 1);
            const depodaki = depoStogu.find(d => d.ad === item.ad);
            const depodakiMiktar = depodaki ? depodaki.stok_miktari : 0;

            if (depodakiMiktar < toplamIhtiyac) {
                eksikVarMi = true;
                eksikListesi.push(`${item.ad} (Planlanan İhtiyaç: ${toplamIhtiyac}, Stokta Kalan: ${depodakiMiktar})`);
            }
        });

        // Eğer eksik yoksa, API'ye HİÇ GİTME. LLM çağrılmadan Matematiksel Onay ver.
        if (!eksikVarMi) {
            return {
                success: true,
                is_approved: true,
                ajan_cevabi: "LOJİSTİK ONAYI: VERİLDİ. \n\n(Sistem Notu: Kumaş ve aksesuar stokları tam eşleştirildi. YZ API çağrısı yapılmadan SQL Matematiği ile milisaniyede sıfır maliyetle onaylanmıştır.)"
            };
        }

        // SADECE EKSİK VARSA KRİZ ÇÖZÜMÜ İÇİN AJAN (GPT) DEVREYE GİRER
        const prompt = `
      Sen Kamera-Panel İmalat Sisteminin 'Lojistik ve Satınalma Şefi' kod adlı otonom ajanısın.
      Sistemin başındaki Koordinatör Engin Bey, aşağıdaki ${modelMiktari} adetlik modeli kesime (üretime) almayı planlıyor.
      
      Görevlerin:
      1. Gereken Reçete (BOM) miktarları ile Depo Stoklarını matematiksel olarak tam eşleştir.
      2. Üretime başlamak için yeterli kumaş veya aksesuar var mı? Eksik olan tam miktarları liste halinde belirt.
      3. Stokta yeterli ürün varsa "LOJİSTİK ONAYI: VERİLDİ" şeklinde, STOK YETERSİZ ise "LOJİSTİK ONAYI: REDDEDİLDİ" şeklinde yanıtın en başına (ilk satıra) büyük harflerle yaz.
      4. Ek olarak (eğer verilmişse) satınalma birimine eksikleri tamamlaması için gereken tedarik listesini talimat şeklinde ver.

      GEREKEN REÇETE (BOM):
      ${JSON.stringify(recete, null, 2)}

      GÜNCEL DEPO STOKLARI:
      ${JSON.stringify(depoStogu, null, 2)}
      
      Kısa, askeri ve operasyonel bir dil kullan. Konuyu uzatma. Madde madde özetle.
    `;

        const response = await llm.invoke(prompt);
        const cevapText = response.content;

        // Onay durumunu string'den tespit etme
        const onaylandıMi = cevapText.includes("ONAYI: VERİLDİ");

        return {
            success: true,
            is_approved: onaylandıMi,
            ajan_cevabi: cevapText
        };

    } catch (err) {
        console.error("Lojistik Ajanı Hatası:", err);
        return { success: false, error: err.message };
    }
}
