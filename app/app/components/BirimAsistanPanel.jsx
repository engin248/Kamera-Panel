'use client';

import React, { useState } from 'react';
import { Bot, User, Send, Loader2 } from 'lucide-react';

export default function BirimAsistanPanel({ birimAdi, aciklama, renkHex, apiEndpoint }) {
    const [messages, setMessages] = useState([
        {
            role: "asistan",
            content: `Merhaba. Ben ${birimAdi} Asistanınızım. ${aciklama} Bana doğrudan komut veya soru verebilirsiniz.`
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setIsLoading(true);

        try {
            // İlgili ajan API'sine istek at, eğer apiEndpoint yoksa genel fallback at
            const targetApi = apiEndpoint || "/api/agent/bolum-asistan";
            const response = await fetch(targetApi, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg, history: messages, birim: birimAdi }),
            });

            // Demo/Mock Fallback (API henüz yoksa sistemi kilitletmemek için)
            if (!response.ok) {
                setTimeout(() => {
                    setMessages(prev => [...prev, { role: "asistan", content: `(Simülasyon Yanıtı) Emriniz anlaşıldı. ${birimAdi} operasyonunuz için gerekli düzenlemeler hafızaya alınıyor.` }]);
                    setIsLoading(false);
                }, 1000);
                return;
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: "asistan", content: data.mesaj || "Emir yerine getirildi." }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: "asistan", content: `❌ Bağlantı hatası: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', background: `${renkHex}15`, borderBottom: `1px solid ${renkHex}30`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${renkHex}25`, color: renkHex, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '800', color: renkHex, margin: 0, letterSpacing: '0.5px' }}>{birimAdi.toUpperCase()} ASİSTANI</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>Doğrudan İletişim (Aracı Ajan Yok)</p>
                </div>
            </div>

            {/* Mesaj Alanı */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-body)' }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? '#3498db' : `${renkHex}20`, color: msg.role === 'user' ? '#fff' : renkHex }}>
                            {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                        </div>
                        <div style={{ padding: '12px 16px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.6', background: msg.role === 'user' ? '#3498db' : 'var(--bg-card)', color: msg.role === 'user' ? '#fff' : 'var(--text-primary)', border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)', borderTopRightRadius: msg.role === 'user' ? 0 : '12px', borderTopLeftRadius: msg.role === 'user' ? '12px' : 0 }}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', maxWidth: '85%' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${renkHex}20`, color: renkHex }}>
                            <Loader2 size={18} className="animate-spin" />
                        </div>
                        <div style={{ padding: '12px 16px', borderRadius: '12px', fontSize: '13px', borderTopLeftRadius: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Ajan işlem yapıyor...
                        </div>
                    </div>
                )}
            </div>

            {/* Girdi Alanı */}
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading}
                    placeholder="Departman asistanına emir verin..."
                    style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    style={{ padding: '0 20px', background: renkHex, color: '#fff', border: 'none', borderRadius: '8px', cursor: (isLoading || !input.trim()) ? 'default' : 'pointer', opacity: (isLoading || !input.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.2s' }}
                >
                    <Send size={18} /> Gönder
                </button>
            </div>

        </div>
    );
}
