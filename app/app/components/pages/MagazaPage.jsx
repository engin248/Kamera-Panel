'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MagazaPage() {
    const [activeTab, setActiveTab] = useState('satis'); // satis, stok, musteri
    const [loading, setLoading] = useState(false);
    const [agentResponse, setAgentResponse] = useState(null);

    const bugun = new Date();
    // Mock Data (Gerçek senaryoda Supabase'den çekilecek)
    const [musteriler, setMusteriler] = useState([
        { id: 1, adi: 'Ahmet Toptancılık', tip: 'Toptan (B2B)', skor: 9, kargo: 'Aras Kargo' },
        { id: 2, adi: 'Mehmet Yılmaz', tip: 'Perakende (B2C)', skor: 5, kargo: 'MNG Kargo' }
    ]);
    const [stoklar, setStoklar] = useState([
        // Stok yaşlandırmasını göstermek için geçmiş tarihler
        { id: 101, model: 'M-101 Kışlık Kaban', stok: 450, maliyet: 500, depoGirisTarihi: '2025-11-15' },
        { id: 102, model: 'M-102 Yazlık Tişört', stok: 1200, maliyet: 80, depoGirisTarihi: '2026-02-20' },
        { id: 103, model: 'M-103 Deri Ceket', stok: 150, maliyet: 1500, depoGirisTarihi: '2025-09-10' }
    ]);

    // Form State
    const [seciliMusteri, setSeciliMusteri] = useState('');
    const [seciliUrun, setSeciliUrun] = useState('');
    const [satisAdet, setSatisAdet] = useState('');
    const [teklifFiyati, setTeklifFiyati] = useState('');
    const [odemeTipi, setOdemeTipi] = useState('Peşin Kredi Kartı');
    const [secilenKargo, setSecilenKargo] = useState('');

    // B2B Yeni Kriterler
    const [asortiSayisi, setAsortiSayisi] = useState('');
    const [bedenDagitimi, setBedenDagitimi] = useState('');
    const [koliFormati, setKoliFormati] = useState('Standart (Askılı)');
    const [teslimTarihi, setTeslimTarihi] = useState('');

    const handleSatisiDanis = async () => {
        setLoading(true);
        setAgentResponse(null);

        const urun = stoklar.find(s => s.id === Number(seciliUrun));
        const musteri = musteriler.find(m => m.id === Number(seciliMusteri));

        if (!urun || !musteri || !teklifFiyati) {
            alert('Lütfen tüm alanları doldurun!');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                musteriAdi: musteri.adi,
                musteriSkoru: musteri.skor,
                urunAdi: urun.model,
                adet: satisAdet,
                asortiBilgisi: `${asortiSayisi} Asorti | Bedenler: ${bedenDagitimi}`,
                paketlemeVeyaKoli: koliFormati,
                istenenTermin: teslimTarihi,
                teklifEdilenFiyat: teklifFiyati,
                maliyetFiyati: urun.maliyet,
                odemeTipi: odemeTipi,
                kargoFirmasi: secilenKargo || musteri.kargo
            };

            const res = await fetch('/api/magaza/satis-sefi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            setAgentResponse(data);
        } catch (error) {
            console.error(error);
            alert("Ajanla iletişim kurulamadı.");
        } finally {
            setLoading(false);
        }
    };

    const handleStokAnalizi = async (urun, hesaplananRafGunu) => {
        setLoading(true);
        setAgentResponse(null);

        try {
            const res = await fetch('/api/magaza/veri-analisti', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modelId: urun.id,
                    modelAdi: urun.model,
                    raftaKalanGunSuresi: hesaplananRafGunu
                })
            });

            const data = await res.json();
            setAgentResponse(data);
        } catch (error) {
            console.error(error);
            alert("Analist ajanla iletişim kurulamadı.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">🏪 Mağaza ve Satış Komuta Merkezi</h1>

            {/* AI Bildirim Çubuğu */}
            {agentResponse && (
                <div className={`p-4 mb-6 rounded-lg text-white shadow-lg flex items-start gap-4 ${agentResponse.success ? (agentResponse.tehlike_sinifi?.includes('Kırmızı') ? 'bg-red-600' : 'bg-green-600') : 'bg-red-500'}`}>
                    <span className="text-2xl mt-1">🤖</span>
                    <div>
                        <h4 className="font-bold text-lg">{agentResponse.tehlike_sinifi || 'Satış Şefi Yanıtı'}</h4>
                        <p className="mt-1">{agentResponse.ajan_cevabi || agentResponse.error}</p>
                    </div>
                    <button onClick={() => setAgentResponse(null)} className="ml-auto text-white hover:text-gray-200">✕</button>
                </div>
            )}

            {/* TAB MENU */}
            <div className="flex gap-4 mb-6 border-b border-gray-300 pb-2">
                <button onClick={() => setActiveTab('satis')} className={`px-4 py-2 font-semibold rounded-t-lg ${activeTab === 'satis' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>💳 Satış / Kasa</button>
                <button onClick={() => setActiveTab('stok')} className={`px-4 py-2 font-semibold rounded-t-lg ${activeTab === 'stok' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>📦 Dinamik Stok</button>
                <button onClick={() => setActiveTab('musteri')} className={`px-4 py-2 font-semibold rounded-t-lg ${activeTab === 'musteri' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>🗂️ Müşteri Sicili</button>
            </div>

            {/* SATIŞ EKRANI */}
            {activeTab === 'satis' && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 max-w-2xl">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Yeni Satış / İskonto Talebi</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Seç</label>
                            <select className="w-full border rounded-lg p-2" value={seciliMusteri} onChange={e => setSeciliMusteri(e.target.value)}>
                                <option value="">-- Müşteri Seç --</option>
                                {musteriler.map(m => <option key={m.id} value={m.id}>{m.adi} ({m.tip})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün / Model</label>
                            <select className="w-full border rounded-lg p-2" value={seciliUrun} onChange={e => setSeciliUrun(e.target.value)}>
                                <option value="">-- Model Seç --</option>
                                {stoklar.map(s => <option key={s.id} value={s.id}>{s.model} (Stok: {s.stok})</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Adet</label>
                            <input type="number" min="1" className="w-full border rounded-lg p-2" value={satisAdet} onChange={e => setSatisAdet(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Teklif Fiyatı (Birim ₺)</label>
                            <input type="number" className="w-full border rounded-lg p-2" placeholder="Örn: 550" value={teklifFiyati} onChange={e => setTeklifFiyati(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Asorti Sayısı</label>
                            <input type="text" className="w-full border rounded-lg p-2" placeholder="Örn: 20 Asorti" value={asortiSayisi} onChange={e => setAsortiSayisi(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Renk & Beden Dağılımı</label>
                            <input type="text" className="w-full border rounded-lg p-2" placeholder="Örn: S-1, M-2, L-2, XL-1 (Siyah)" value={bedenDagitimi} onChange={e => setBedenDagitimi(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Paketleme / Koli Şartları</label>
                            <select className="w-full border rounded-lg p-2" value={koliFormati} onChange={e => setKoliFormati(e.target.value)}>
                                <option value="Standart (Askılı)">Standart (Askılı)</option>
                                <option value="Standart (Poli Poşet)">Standart (Poli Poşet)</option>
                                <option value="Karma Koli (E-Ticaret)">Karma Koli (E-Ticaret Paketleme)</option>
                                <option value="İhracat Kolisi (Çemberli)">İhracat Kolisi (Çemberli/Özel)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">İstenen Teslim (Termin) Tarihi</label>
                            <input type="date" className="w-full border rounded-lg p-2" value={teslimTarihi} onChange={e => setTeslimTarihi(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tipi / Vade</label>
                            <select className="w-full border rounded-lg p-2 bg-yellow-50" value={odemeTipi} onChange={e => setOdemeTipi(e.target.value)}>
                                <option value="Peşin Nakit (Havale/EFT)">Peşin Nakit (Havale/EFT)</option>
                                <option value="Peşin Kredi Kartı">Peşin Kredi Kartı</option>
                                <option value="30 Gün Vadeli (Çek)">30 Gün Vadeli (Çek)</option>
                                <option value="60 Gün Vadeli (Çek)">60 Gün Vadeli (Çek)</option>
                                <option value="90+ Gün Açık Hesap">90+ Gün Açık Hesap (Riskli)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kargo Tercihi (Eğer değişecekse)</label>
                            <select className="w-full border rounded-lg p-2" value={secilenKargo} onChange={e => setSecilenKargo(e.target.value)}>
                                <option value="">Müşteri Varsayılanı Kalsın</option>
                                <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                                <option value="Aras Kargo">Aras Kargo</option>
                                <option value="Sürat Kargo">Sürat Kargo</option>
                                <option value="MNG Kargo">MNG Kargo</option>
                                <option value="Müşteri Kendi Aracıyla Alacak">Müşteri Kendi Aracıyla Alacak (Elden)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleSatisiDanis}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center min-w-[200px]"
                        >
                            {loading ? 'Danışılıyor...' : '🤖 Satış Şefi\'ne Danış'}
                        </button>
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors">
                            Kaydet (Onaysız)
                        </button>
                    </div>
                </div>
            )}

            {/* STOK EKRANI */}
            {activeTab === 'stok' && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Depo ve Dinamik Stok İzleme</h2>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-200">
                                <th className="p-3">Model</th>
                                <th className="p-3">Stok Değeri</th>
                                <th className="p-3">Rafta Bekleme</th>
                                <th className="p-3">Gizli Zarar (Fırsat Maliyeti)</th>
                                <th className="p-3">Analiz</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stoklar.map(urun => {
                                const girisTarihi = new Date(urun.depoGirisTarihi);
                                const farkZaman = Math.abs(bugun - girisTarihi);
                                const rafGunu = Math.ceil(farkZaman / (1000 * 60 * 60 * 24));

                                return (
                                    <tr key={urun.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-semibold text-gray-800">{urun.model}</div>
                                            <div className="text-xs text-gray-500">Giriş: {urun.depoGirisTarihi}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-semibold text-gray-800">{urun.stok} Adet</div>
                                            <div className="text-xs text-gray-500">Birim: ₺{urun.maliyet} | Toplam: ₺{(urun.stok * urun.maliyet).toLocaleString('tr-TR')}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${rafGunu > 60 ? 'bg-red-100 text-red-700' : (rafGunu > 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')}`}>
                                                {rafGunu} Gün
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-bold text-red-600">
                                                -₺{Math.round((urun.stok * urun.maliyet) * 0.04 * (rafGunu / 30)).toLocaleString('tr-TR')}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">Aylık %4 enflasyon/faiz erimesi</div>
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleStokAnalizi(urun, rafGunu)}
                                                disabled={loading}
                                                className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                            >
                                                🤖 Yaşlanma Analizi
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MÜŞTERİ EKRANI */}
            {activeTab === 'musteri' && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Müşteri Sicili ve Risk Skoru</h2>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-200">
                                <th className="p-3">Müşteri/Firma</th>
                                <th className="p-3">Tipi</th>
                                <th className="p-3">Güven Skoru</th>
                                <th className="p-3">Favori Kargo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {musteriler.map(m => (
                                <tr key={m.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-semibold text-gray-800">{m.adi}</td>
                                    <td className="p-3 text-gray-600">{m.tip}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${m.skor > 7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {m.skor} / 10
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-600">{m.kargo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
