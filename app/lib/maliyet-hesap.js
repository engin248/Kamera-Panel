/**
 * maliyet-hesap.js
 * Maliyet Sekmesi — Merkezi Hesaplama Fonksiyonları
 * TR Birincil Dil | AR İkincil Dil
 */

// ─── SGK & VERGİ ───────────────────────────────────────────────
/** İşveren SGK payı: Brüt × %22.5 */
export function sgkIsverenPayi(brutMaas) {
    return (parseFloat(brutMaas) || 0) * 0.225;
}

/** Basitleştirilmiş gelir vergisi stopajı tahmini */
export function gelirVergisiStopaj(brutMaas) {
    const b = parseFloat(brutMaas) || 0;
    // Kademeli yaklaşık oran (2024 asgari ücret üzeri)
    if (b <= 17002) return b * 0.15;
    if (b <= 26000) return b * 0.20;
    if (b <= 96000) return b * 0.27;
    return b * 0.35;
}

/** Personelin gerçek toplam işveren maliyeti */
export function personelGercekMaliyet(brutMaas) {
    const b = parseFloat(brutMaas) || 0;
    return b + sgkIsverenPayi(b) + gelirVergisiStopaj(b);
}

/** Tüm personel listesinin toplam maliyet */
export function toplamIscilikGideri(personelListesi = []) {
    return personelListesi.reduce((t, p) => {
        const maas = p.base_salary || p.daily_wage * 26 || 0;
        return t + personelGercekMaliyet(maas);
    }, 0);
}

// ─── ÜRETİM & KALİTE ──────────────────────────────────────────
/** FPY — First Pass Yield (İlk Geçiş Verimi) */
export function hesaplaFPY(toplamAdet, hataAdet) {
    const t = parseInt(toplamAdet) || 0;
    const h = parseInt(hataAdet) || 0;
    if (t === 0) return 100;
    return Math.max(0, ((t - h) / t) * 100);
}

/** Verimlilik Skoru */
export function verimlilikSkoru(toplamAdet, fpy) {
    return (parseFloat(toplamAdet) || 0) * (parseFloat(fpy) || 100) / 100;
}

/** Saat başına üretim */
export function saatBasiUretim(adet, saatSayisi) {
    const s = parseFloat(saatSayisi) || 0;
    return s > 0 ? (parseFloat(adet) || 0) / s : 0;
}

/** Gerçek birim başı işçilik maliyeti */
export function birimBasiIscilikMaliyet(gercekMaliyet, toplamAdet) {
    const a = parseInt(toplamAdet) || 0;
    return a > 0 ? (parseFloat(gercekMaliyet) || 0) / a : 0;
}

// ─── ÜRÜN MALİYETİ ─────────────────────────────────────────────
/**
 * Model birim maliyeti hesapla
 * @param {object} params
 * @param {number} params.kumasMetre
 * @param {number} params.kumasBirimFiyat
 * @param {number} params.fireOrani         - % cinsinden (örn: 8 = %8)
 * @param {number} params.aksesuarToplam
 * @param {number} params.iplikSarf
 * @param {number} params.operasyonIscilik  - Birim fiyat × adet toplamı
 * @param {number} params.genelGiderPayi    - İşletme gideri / toplam üretim adedi
 */
export function modelBirimMaliyet({
    kumasMetre = 0, kumasBirimFiyat = 0, fireOrani = 8,
    aksesuarToplam = 0, iplikSarf = 0,
    operasyonIscilik = 0, genelGiderPayi = 0
}) {
    const kumasMaliyet = kumasMetre * kumasBirimFiyat * (1 + (fireOrani / 100));
    return kumasMaliyet + aksesuarToplam + iplikSarf + operasyonIscilik + genelGiderPayi;
}

/** Fason fiyat önerisi */
export function fasonFiyatOneri(birimMaliyet, karMarjiYuzde = 15) {
    return birimMaliyet * (1 + (karMarjiYuzde / 100));
}

/** Genel gider payı (kişi başı) */
export function genelGiderPayi(toplamIsletmeGider, toplamUretimAdedi) {
    const a = parseInt(toplamUretimAdedi) || 0;
    return a > 0 ? (parseFloat(toplamIsletmeGider) || 0) / a : 0;
}

// ─── KAR / ZARAR ───────────────────────────────────────────────
export function brütKar(gelir, hammaddeGider) {
    return (parseFloat(gelir) || 0) - (parseFloat(hammaddeGider) || 0);
}

export function netKar(gelir, hammadde, iscilik, sabitGider) {
    return (parseFloat(gelir) || 0)
        - (parseFloat(hammadde) || 0)
        - (parseFloat(iscilik) || 0)
        - (parseFloat(sabitGider) || 0);
}

export function karMarjiYuzde(gelir, netK) {
    const g = parseFloat(gelir) || 0;
    return g > 0 ? (netK / g) * 100 : 0;
}

/** Başa baş üretim adedi */
export function basaBasAdet(toplamGider, birimMaliyet) {
    const b = parseFloat(birimMaliyet) || 0;
    return b > 0 ? (parseFloat(toplamGider) || 0) / b : 0;
}

/** Kar sinyali */
export function karSinyali(netKarDegeri) {
    if (netKarDegeri > 0) return 'kar';       // 🟢
    if (netKarDegeri >= -500) return 'basabas'; // 🟡
    return 'zarar';                             // 🔴
}

// ─── PRİM SİSTEMİ ──────────────────────────────────────────────
/**
 * Personel prim hesabı
 * @param {number} kisiVerimlilikSkoru
 * @param {number} toplamTumPersonelSkoru
 * @param {number} primHavuzu              - ₺ cinsinden toplam havuz
 * @param {number} kidemPuani              - Ek puan
 * @param {number} devamsizlikKesinti      - Gün × belirlenen eksiltme
 * @param {number} kaliteKesinti           - Aşırı hata kesintisi
 */
export function kisiPrimHesapla({
    kisiVerimlilikSkoru, toplamTumPersonelSkoru,
    primHavuzu, kidemPuani = 0,
    devamsizlikKesinti = 0, kaliteKesinti = 0
}) {
    if (!toplamTumPersonelSkoru || !primHavuzu) return 0;
    const adjustedScore = Math.max(0, kisiVerimlilikSkoru + kidemPuani - devamsizlikKesinti - kaliteKesinti);
    return (adjustedScore / toplamTumPersonelSkoru) * primHavuzu;
}

/** Toplam prim havuzu = Net Kâr × Oran */
export function primHavuzuHesapla(netKarDegeri, oran = 10) {
    if (netKarDegeri <= 0) return 0;
    return netKarDegeri * (oran / 100);
}

// ─── PARA FORMATLAMA ────────────────────────────────────────────
export function formatTL(sayi, ondalik = 2) {
    const n = parseFloat(sayi) || 0;
    return '₺' + n.toLocaleString('tr-TR', {
        minimumFractionDigits: ondalik,
        maximumFractionDigits: ondalik
    });
}

export function formatYuzde(sayi, ondalik = 1) {
    const n = parseFloat(sayi) || 0;
    return '%' + n.toFixed(ondalik);
}
