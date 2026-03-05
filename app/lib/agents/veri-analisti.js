import { ChatOpenAI } from "@langchain/openai";
import { supabase } from '../supabase';

const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2, // Analitik ajan için düşük ısı, net yanıt
});

/**
 * Mağaza Veri Analisti Ajanı (Sell-Through Rate ve Yaşlanan Stok)
 * Görevi: Seçilen modelin mağazadaki/depodaki satış hızını ölçmek,
 * rafta yatan parayı (Deadstock) tespit edip indirim/bundle tavsiyesi vermek.
 */
export async function analyzeStoreInventory(modelId, modelAdi, raftaKalanGunSuresi) {
    try {
        // 1. Veritabanından Stok ve Satış Hızını (STR) Çekme Simülasyonu
        // Gerçekte 'magaza_stok' ve 'magaza_satislar' tablolarına modelId ile sorgu atılır
        const { data: satisPerformansi, error } = await supabase
            .from('magaza_satislar')
            .select('*')
            .eq('stok_id', modelId);

        // Bu aşamada SQL ile "Gelen 1000 üründen kaçı satıldı?" sorusunun yanıtını simüle edelim.
        // SQL kalkanı (Rutin işlem)
        let strOrani = 0; // Sell-Through Rate (Satış Hızı)
        let durum = "Bilinmiyor";

        if (raftaKalanGunSuresi > 60) {
            durum = "Kırmızı Alarm - Yaşlanan Stok (Deadstock Adayı)";
        } else if (raftaKalanGunSuresi > 30) {
            durum = "Uyarı - Satış Hızı Yavaşlıyor";
        } else {
            durum = "Normal - Yeni/Aktif Sezon";
        }

        // 2. Ajanın Tavsiye Motoru
        const prompt = `
        Sen Kamera-Panel sisteminin 'Perakende ve Toptan Veri Analisti' yapay zeka ajanısın.
        
        Durum İncelemesi:
        Model: ${modelAdi}
        Rafta (Depoda) Bekleme Süresi: ${raftaKalanGunSuresi} Gün
        Tehlike Sınıfı: ${durum}
        
        GÖREV:
        Mağaza/Kasa personeline ve Engin Bey'e yönelik çok stratejik bir yönlendirme yap.
        - Eğer mal 60 günü geçtiyse (Kırmızı Alarm), bunu içerideki "En Çok Satan (Bestseller)" başka bir modelle BUNDLE (ikili paket) yapmalarını veya %X oranında eritmeye yönelik seri bir indirim kampanyası çıkmalarını tavsiye et.
        - Eğer mal taze ise (0-30 gün) panik yaptırma, "Sell-Through hızını (STR) izlemeye devam edelim" de.
        
        Yanıtın analitik, sayılara atıf yapan ve "Eylem Odaklı" olmalıdır. Max 3 cümle.
        `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            tehlike_sinifi: durum,
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("Veri Analisti Hatası:", err);
        return { success: false, error: err.message };
    }
}
