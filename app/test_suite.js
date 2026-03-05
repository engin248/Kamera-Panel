const crypto = require('crypto');

function encodeBase64Url(buffer) {
    return buffer.toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function createToken(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = encodeBase64Url(Buffer.from(JSON.stringify(header)));
    const payloadB64 = encodeBase64Url(Buffer.from(JSON.stringify(payload)));

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${headerB64}.${payloadB64}`);
    const signatureB64 = encodeBase64Url(hmac.digest());

    return `${headerB64}.${payloadB64}.${signatureB64}`;
}

const secret = process.env.JWT_SECRET || 'dev-only-key-change-in-production';
const token = createToken({ user_id: 1, role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 }, secret);

const baseUrl = 'http://localhost:8088/api';
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};

async function testKesimPlani() {
    console.log("--- 1. KESİM PLANI TESTİ ---");
    const payload = {
        model_id: 1,
        plan_tarihi: "2026-03-05",
        toplam_adet: 500,
        kumas_tipi: "Pamuk Test",
        used_fabric_qty: 100,
        actual_fabric_qty: 105,
        fabric_waste_qty: 5,
        pastal_fire_yuzde: 5,
        harcanan_kumas: 105
    };
    const res = await fetch(`${baseUrl}/imalat/kesim-plani`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok && data.actual_fabric_qty === 105) {
        console.log("✅ KESİM PLANI: Başarılı (ID: " + data.id + ")");
        return data.id;
    } else { console.error("❌ KESİM PLANI HATASI:", data); }
}

async function testHatPlanlama() {
    console.log("--- 2. HAT PLANLAMA TESTİ ---");
    const payload = {
        model_id: 1,
        hat_adi: "Test Fason Hattı",
        fason_mu: true,
        fason_birim_fiyat: 15.5,
        bant_zorluk_derecesi: 3
    };
    const res = await fetch(`${baseUrl}/imalat/hat-planlama`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok && data.fason_mu === true) {
        console.log("✅ HAT PLANLAMA: Başarılı (ID: " + data.id + ")");
        return data.id;
    } else { console.error("❌ HAT PLANLAMA HATASI:", data); }
}

async function testYariMamul() {
    console.log("--- 3. YARI MAMUL (Fason Fire) TESTİ ---");
    const payload = {
        model_id: 1, faz_kaynak: "kesim", faz_hedef: "fason_baski", adet: 450, bozulan_adet: 25
    };
    const res = await fetch(`${baseUrl}/imalat/yari-mamul`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok && data.bozulan_adet === 25) {
        console.log("✅ YARI MAMUL HAREKETİ: Başarılı (ID: " + data.id + ")");
    } else { console.error("❌ YARI MAMUL HATASI:", data); }
}

async function testFireKayit() {
    console.log("--- 4. FİRE KAYIT (Zimmet ve Zarar) TESTİ ---");
    const payload = {
        model_id: 1, kumas_tipi: "Test Kumaş", fire_metre: 10, kullanilan_metre: 100,
        fire_safhasi: "utu_paket", fire_nedeni: "Leke", estimated_loss_amount: 500, operator_id: 1
    };
    const res = await fetch(`${baseUrl}/imalat/fire-kayit`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok && data.estimated_loss_amount === 500) {
        console.log("✅ FİRE KAYDI: Başarılı (ID: " + data.id + ")");
        return { id: data.id, operator_id: 1 };
    } else { console.error("❌ FİRE KAYIT HATASI:", data); }
}

async function testOzetDashboard() {
    console.log("--- 5. ÖZET DASHBOARD TESTİ ---");
    const res = await fetch(`${baseUrl}/imalat/ozet-dashboard`, { headers });
    const data = await res.json();
    if (res.ok && data.tahmini_maliyet !== undefined) {
        console.log("✅ ÖZET DASHBOARD: Başarılı | Tahmini Zarar Yükü: " + data.tahmini_maliyet + " ₺");
    } else { console.error("❌ ÖZET DASHBOARD HATASI:", data); }
}

async function testPrimMotoru() {
    console.log("--- 6. PRİM MOTORU (Zayiat Cezasından Düşme) TESTİ ---");
    const now = new Date();
    const payload = { ay: now.getMonth() + 1, yil: now.getFullYear(), prim_orani: 30 };

    const res = await fetch(`${baseUrl}/prim`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok) {
        console.log("✅ PRİM MOTORU HESAPLAMASI: Başarılı");
        const testPersonel = data.dagitim?.find(p => p.personel_id === 1);
        if (testPersonel && testPersonel.zayiat_cezasi >= 500) {
            console.log("✅ ZAYİAT CEZASI PRİMDEN DÜŞÜLDÜ: -" + testPersonel.zayiat_cezasi + " ₺ | Güncel Durum: " + testPersonel.notlar);
        } else {
            console.log("⚠️ PRIM HESAPLANDI AMA TEST PERSONELİ CEZA BULUNMADI (Üretim Logu yoksa hesaplama es geçilir)");
        }
    } else { console.error("❌ PRİM MOTORU HATASI:", data); }
}

async function testFinances() {
    console.log("--- 7. DASHBOARD NAKİT AKIŞ (CASH FLOW) TESTİ ---");
    const res = await fetch(`${baseUrl}/dashboard/finances`, { headers });
    const data = await res.json();
    if (res.ok && data.success) {
        console.log(`✅ NAKİT AKIŞI: Başarılı | Günlük Gider (Burn): ${data.dailyBurnRate} ₺ | Net Nakit Radarı: ${data.forecast15Days?.netCashFlow} ₺ (${data.forecast15Days?.status})`);
    } else { console.error("❌ NAKİT AKIŞI HATASI:", data); }
}

async function testCustomers() {
    console.log("--- 8. MÜŞTERİ KRLILIK SKORU (ROI) TESTİ ---");
    const res = await fetch(`${baseUrl}/customers`, { headers });
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
        const testC = data[0];
        console.log(`✅ MÜŞTERİ ROI SİSTEMİ: Başarılı | Örnek Müşteri: ${testC?.name} -> Sınıf: ${testC?.roi_rating || 'Yok'} (${testC?.total_volume} ₺)`);
    } else { console.error("❌ MÜŞTERİ ROI HATASI:", data); }
}

async function runAll() {
    try {
        console.log("E2E Test Başlatılıyor... MOCKED_JWT Hazır.");
        await testKesimPlani();
        await testHatPlanlama();
        await testYariMamul();
        await testFireKayit();
        await testOzetDashboard();
        await testPrimMotoru();
        await testFinances();
        await testCustomers();
        console.log("\\n🎉 TÜM PENCERE TESTLERİ TAMAMLANDI.");
    } catch (e) {
        console.error("TEST SÜRECİNDE BEKLENMEYEN HATA:", e);
    }
}

runAll();
