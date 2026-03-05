import { ChatOpenAI } from "@langchain/openai";
import { supabase } from '../supabase';
import { OpenAIEmbeddings } from "@langchain/openai";

const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.3,
});

const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
});

/**
 * Mağaza Satış Şefi (Müşteri İlişkileri ve İskonto Kalkanı)
 * Görevi: Toptan B2B satışlarında fiyat kırmak isteyen personeli denetlemek,
 * müşterinin geçmiş vukuatlarını okumak ve riskliyse empatik bir dille reddetmek.
 */
export async function evaluateSalesRequest(musteriAdi, musteriSkoru, urunAdi, adet, teklifEdilenFiyat, maliyetFiyati, odemeTipi, kargoFirmasi) {
    try {
        // 1. Kârlılık Kontrolü (Matematiksel - Sıfır API Maliyetli Kalkan)
        const toplamMaliyet = maliyetFiyati * adet;
        const toplamTeklif = teklifEdilenFiyat * adet;
        const karMarji = ((toplamTeklif - toplamMaliyet) / toplamMaliyet) * 100;

        // Asgari ticari kural: Zararına veya çok düşük kârla satış yasak
        if (karMarji < 10) {
            return {
                success: false,
                ajan_cevabi: `⚠️ Otomatik Red: Bu teklifte kâr marjı çok düşük (%${karMarji.toFixed(1)}). Sistem asgari %10 kâr kuralını uygulamaktadır.`
            };
        }

        // 2. Müşteri Hafızasını Çek (RAG ile pgVector taraması)
        const memoryPrompt = `Müşteri sicil kaydı: ${musteriAdi}. Ödeme alışkanlıkları ve iade geçmişi nedir?`;
        const queryEmbedding = await embeddings.embedQuery(memoryPrompt);

        // Not: Gerçekte 'magaza_musteriler' tablosunda 'vektor_kisisel_profil' aranacak.
        // Şimdilik konsept olarak model_memory_embeddings kullanıyoruz (veya generic bir tablo).
        const { data: hafiza, error } = await supabase.rpc('match_model_memories', {
            query_embedding: queryEmbedding,
            match_threshold: 0.75,
            match_count: 3
        });

        let musteriHafizasi = "Bu müşteri hakkında geçmiş çok net bir izlenim yok. Standart procedür uygulayınız.";
        if (hafiza && hafiza.length > 0) {
            musteriHafizasi = hafiza.map(h => h.baglam_metni).join(" | ");
        }

        // 3. LLM Karar Mekanizması
        const prompt = `
        Sen Kamera-Panel sisteminin 'Satış Şefi' yapay zeka ajanısın. 
        Karakterin: Tam bir tüccar, müzakereci ve empatik bir B2B yöneticisi. 
        Müşteriyi kırmadan esnaflık kurallarıyla yanıt verirsin.
        
        Durum Özeti: 
        Satıcı personel, "${musteriAdi}" isimli müşteriye ${adet} adet "${urunAdi}" satmak istiyor. 
        Müşteri Güven Skoru: ${musteriSkoru} / 10
        Ödeme Tipi: ${odemeTipi}
        Kargo Tercihi: ${kargoFirmasi}
        Teklif Edilen Kâr Marjı: %${karMarji.toFixed(1)}
        
        Geçmiş İstihbarat: "${musteriHafizasi}"
        
        AKILLI İSKONTO VE ONAY KURALLARI:
        1. Ödeme Tipi 'Peşin' ise ve skor yüksekse (>7), kâr marjından biraz feragat ederek (%15'e kadar inerek) tatlı dille onay ver. "Müşterimiz peşin çalışıyor, kârımızdan fedakarlık ederiz, hayırlı olsun. ${kargoFirmasi} ile yolluyoruz." minvalinde esnafça bir cümle kur.
        2. Ödeme Tipi 'Vadeli' (Örn: 60, 90 gün) ve Kâr Marjı %25'in altındaysa risklidir. Saygılı ve empatik bir dille: "Maliyetlerimiz yüksek, bu vade ile ancak %X peşinat veya daha yüksek bir birim fiyat ile yardımcı olabiliriz, lütfen müşterimizi kırmadan izah edelim." de.
        3. Müşteri skoru veya geçmişi kötüyse direkt reddetme ama "Sadece peşin / nakit ödemeyle kargolayabiliriz" diyerek topu taca at.
        4. Skor iyiyse ve kâr iyiyse coşkulu bir tebrikle onayla ve kargo firmasını belirterek hazırlat.
        
        Yanıtın kısa (max 3 cümle), ticari lisanla ve doğrudan satıcı personele yönelik olsun.
        `;

        const response = await llm.invoke(prompt);

        return {
            success: true,
            hafiza_kullanildi: hafiza ? hafiza.length : 0,
            ajan_cevabi: response.content
        };

    } catch (err) {
        console.error("Satış Şefi Hatası:", err);
        return { success: false, error: err.message };
    }
}
