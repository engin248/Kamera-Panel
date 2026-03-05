"use client";

import { useState } from "react";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
// import { ScrollArea } from "../components/ui/scroll-area";
import { Send, Bot, User, Loader2, ShieldCheck, Factory } from "lucide-react";

export default function AsistanPage() {
    const [messages, setMessages] = useState([
        {
            role: "asistan",
            content: "Emredin Engin Bey. Baş Asistanınız olarak tüm birimleri (Modeller, Bant Şefi, Finans, Ar-Ge) koordine etmeye hazırım. 'Üretim durum raporu ver' diyebilirsiniz."
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Sahte bir üretim/vakit verisi (Bunu ileride gerçek veritabanından alacağız)
    const mockUretimVerisi = {
        hedef: 500,
        gerceklesen: 410,
        calisanSaat: 7,
        beklenenSaatlik: 55,
        gerceklesenSaatlik: 58
    };

    const mockFinansVerisi = {
        ciro: 15000,
        maliyet: 8500,
        parcaBasiOrtalama: 30
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setIsLoading(true);

        try {
            // Baş Asistan API'sine istek at
            const response = await fetch("/api/agent/bas-asistan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emirTipi: "ÜRETİM_DURUM_RAPORU_İSTE", // Şimdilik statik bir emir tipi gönderiyoruz
                    uretimVerisi: mockUretimVerisi,
                    finansVerisi: mockFinansVerisi
                }),
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: "asistan", content: data.mesaj }]);
            } else {
                setMessages(prev => [...prev, { role: "asistan", content: `❌ HATA: ${data.error}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "asistan", content: "❌ Bağlantı hatası oluştu." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 p-6 font-sans">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">

                {/* Üst Karargah Bilgisi */}
                <div className="flex items-center gap-4 border-b border-gray-700 pb-4">
                    <div className="p-3 bg-red-600/20 text-red-500 rounded-lg">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-widest">KARARGÂH (BAŞ ASİSTAN)</h1>
                        <p className="text-sm text-gray-400">Üretim, İmalat ve Finans Ajanları Kontrol Merkezi</p>
                    </div>
                </div>

                {/* Mesajlaşma Alanı */}
                <div className="flex-1 border-gray-800 bg-gray-950 flex flex-col shadow-2xl rounded-xl border">
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-6 flex flex-col">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>

                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-red-900 border border-red-700'}`}>
                                        {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-red-300" />}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`p-4 rounded-xl shadow-md whitespace-pre-wrap text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 max-w-[85%] self-start">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-900 border border-red-700">
                                        <Loader2 size={20} className="text-red-300 animate-spin" />
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 text-sm font-medium flex items-center gap-2 rounded-tl-none">
                                        Müfettişlerden Rapor Bekleniyor...
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Girdi Alanı */}
                    <div className="p-4 bg-gray-900 border-t border-gray-800 flex gap-3 items-center">
                        <input
                            type="text"
                            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus-visible:ring-red-500 h-12 rounded-md px-3"
                            placeholder="Baş Asistana emir verin (Örn: Üretim raporunu getir)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !input.trim()}
                            className="bg-red-700 hover:bg-red-600 h-12 px-6 transition-all text-white font-medium rounded-md flex items-center justify-center"
                        >
                            <Send size={18} className="mr-2" /> EMRİ İLET
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
