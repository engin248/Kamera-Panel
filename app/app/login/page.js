'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User as UserIcon, LogIn, Activity, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/';
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [agentMessage, setAgentMessage] = useState('Birlikte yeni rekorlara koşacağımız bir gün başlıyor. Kameran açık olsun!');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const token = document.cookie.includes('kp_token=');
        if (token) router.replace(returnTo);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (attempts >= 5) { setError('Çok fazla deneme. Lütfen bekleyin.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setAttempts(a => a + 1);
                setError(data.error || 'Giriş başarısız');
                return;
            }
            // Token'i hem localStorage hem cookie'ye yaz
            localStorage.setItem('kp_token', data.token);
            localStorage.setItem('kp_user', JSON.stringify(data.user));
            // Cookie — middleware bunu okur
            document.cookie = `kp_token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
            router.push(returnTo);
        } catch {
            setError('Bağlantı hatası. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-bg relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[rgba(212,168,71,0.15)] rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[rgba(46,204,113,0.10)] rounded-full blur-[120px] animate-pulse-slower"></div>
            </div>

            <div className="login-card z-10">
                <div className="login-logo">
                    <div className="login-logo-icon flex justify-center mb-4 text-[#D4A847]">
                        <Activity size={56} strokeWidth={1.5} />
                    </div>
                    <div className="login-logo-title">47 Sil Baştan 01</div>
                    <div className="login-logo-sub">Üretim Kontrol Sistemi</div>
                </div>

                {/* Agent Motivational Message */}
                <div className="bg-[#1a2e1a]/60 border border-[#2ecc71]/20 rounded-xl p-4 flex gap-3 mb-6 items-start backdrop-blur-sm shadow-inner">
                    <div className="font-bold text-lg text-[#2ecc71] mt-0.5">🤖</div>
                    <div>
                        <div className="text-[#7be88e] text-xs font-bold uppercase tracking-wider mb-1">Üretim Sorumlusu Asistanı Agent</div>
                        <div className="text-gray-300 text-sm leading-relaxed italic border-l-2 border-[#2ecc71]/30 pl-3">
                            "{agentMessage}"
                        </div>
                    </div>
                </div>
                <form onSubmit={handleLogin} autoComplete="off">
                    {error && (
                        <div className="error-box">
                            ⚠️ {error}
                            {attempts >= 3 && (
                                <div style={{ marginTop: '6px', fontSize: '11px', opacity: 0.7 }}>
                                    ⚠️ {5 - attempts} deneme hakkınız kaldı
                                </div>
                            )}
                        </div>
                    )}
                    <div className="form-group relative">
                        <label className="form-label">Kullanıcı Adı</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                <UserIcon size={18} />
                            </div>
                            <input className="form-input pl-11" type="text" value={form.username}
                                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                placeholder="kullanici_adi" required autoComplete="username" disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="form-group relative">
                        <label className="form-label">Şifre</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                <Lock size={18} />
                            </div>
                            <input className="form-input pl-11 pr-11" type={showPassword ? 'text' : 'password'} value={form.password}
                                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                placeholder="••••••••" required autoComplete="current-password" disabled={loading}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer p-1">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button className="btn-login flex items-center justify-center gap-2" type="submit" disabled={loading || attempts >= 5}>
                        {loading ? '⏳ Kontrol ediliyor...' : <><LogIn size={18} /> Güvenli Giriş Yap</>}
                    </button>
                </form>
                <div className="divider" />
                <div className="hint">Hesabınız yoksa sistem yöneticisiyle iletişime geçin</div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#0d1117;font-family:'Inter',sans-serif;}
        .login-bg{min-height:100vh;background:#0d1117;display:flex;align-items:center;justify-content:center;position:relative;}
        .login-card{background:rgba(22, 27, 34, 0.4);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;width:100%;max-width:440px;box-shadow:0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);}
        .login-logo{text-align:center;margin-bottom:28px;}
        .login-logo-title{font-size:26px;font-weight:800;color:#D4A847;letter-spacing:-0.5px;}
        .login-logo-sub{font-size:13px;color:rgba(255,255,255,0.4);margin-top:6px;font-weight:500;}
        .form-group{margin-bottom:20px;}
        .form-label{display:block;font-size:12px;font-weight:700;color:rgba(255,255,255,0.6);margin-bottom:8px;letter-spacing:0.8px;text-transform:uppercase;}
        .form-input{width:100%;padding:14px 48px 14px 44px;background:#11151c;border:1.5px solid rgba(255,255,255,0.08);border-radius:12px;color:#fff;font-size:15px;font-family:inherit;outline:none;transition: border-color 0.3s, box-shadow 0.3s;}
        .form-input:focus{border-color:#D4A847;box-shadow:0 0 0 4px rgba(212,168,71,0.15);background:#161b22;}
        .form-input::placeholder{color:rgba(255,255,255,0.25);}
        .form-input:disabled{opacity:0.5;}
        .btn-login{width:100%;padding:16px;background:linear-gradient(135deg,#D4A847,#b3852b);border:none;border-radius:12px;color:#0d1117;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;margin-top:12px;box-shadow:0 8px 24px rgba(212,168,71,0.3);}
        .btn-login:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 32px rgba(212,168,71,0.4);}
        .btn-login:active:not(:disabled){transform:scale(0.98);}
        .btn-login:disabled{opacity:0.45;cursor:not-allowed;}
        .error-box{background:rgba(231,76,60,0.12);border:1px solid rgba(231,76,60,0.25);border-radius:10px;padding:12px 16px;color:#e74c3c;font-size:13px;margin-bottom:16px;}
        .divider{height:1px;background:rgba(255,255,255,0.06);margin:28px 0;}
        .hint{text-align:center;font-size:12px;color:rgba(255,255,255,0.2);}
        .form-input:-webkit-autofill,
        .form-input:-webkit-autofill:hover, 
        .form-input:-webkit-autofill:focus, 
        .form-input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 100px #11151c inset !important;
            -webkit-text-fill-color: white !important;
            color: white !important;
            transition: background-color 5000s ease-in-out 0s !important;
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes pulse-slower {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-pulse-slower { animation: pulse-slower 12s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
            <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', marginTop: '40vh' }}>Yükleniyor...</div>}>
                <LoginForm />
            </Suspense>
        </>
    );
}
