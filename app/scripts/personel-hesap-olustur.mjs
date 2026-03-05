/**
 * personel-hesap-olustur.mjs
 * Tüm personeli users tablosuna ekler (personnel_id yok)
 */
import { createClient } from '@supabase/supabase-js';

const URL = 'https://cauptlsnqieegdrgotob.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXB0bHNucWllZWdkcmdvdG9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQxNzE3MywiZXhwIjoyMDg3OTkzMTczfQ.MgVNEwQzHJncpL5JSm1HX7Z0VxRH1mqg3PjGyIlW1Sw';
const sb = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

function sistemRolu(personelRolu) {
    const r = (personelRolu || '').toLowerCase();
    if (r.includes('koordinator') || r.includes('yonetici') || r.includes('mudur')) return 'koordinator';
    if (r.includes('ustabasi') || r.includes('usta')) return 'ustabasi';
    if (r.includes('kalite')) return 'kaliteci';
    return 'operator';
}

function kullaniciAdi(ad) {
    return ad.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
}

async function main() {
    const { data: personeller, error } = await sb
        .from('personnel').select('id, name, role, status').order('name');
    if (error) { console.error('Hata:', error.message); return; }

    console.log(`\n=== ${personeller.length} PERSONEL BULUNDU ===\n`);
    const tablo = [];

    for (const p of personeller) {
        const uAdi = kullaniciAdi(p.name);
        const sifre = '47fab' + p.id;
        const rol = sistemRolu(p.role);

        const { data: mevcut } = await sb.from('users').select('id').eq('username', uAdi).maybeSingle();
        if (mevcut) {
            console.log(`  MEVCUT: ${p.name} → ${uAdi}`);
            tablo.push({ ad: p.name, kullaniciAdi: uAdi, sifre: '(zaten var)', rol, durum: p.status });
            continue;
        }

        const { error: e } = await sb.from('users').insert({
            username: uAdi, password_hash: sifre,
            display_name: p.name, role: rol,
            status: p.status === 'active' ? 'active' : 'inactive',
        });

        if (e) { console.log(`  HATA: ${p.name} → ${e.message}`); }
        else { console.log(`  EKLENDI: ${p.name} → ${uAdi} / ${sifre} / ${rol}`); }
        tablo.push({ ad: p.name, kullaniciAdi: uAdi, sifre: e ? 'HATA' : sifre, rol, durum: p.status });
    }

    console.log('\n' + '='.repeat(65));
    console.log('AD                  | KULLANICI ADI      | SIFRE     | ROL');
    console.log('='.repeat(65));
    tablo.forEach(s => {
        const ad = (s.ad + '                    ').substring(0, 20);
        const u = (s.kullaniciAdi + '                  ').substring(0, 18);
        const sif = (s.sifre + '          ').substring(0, 10);
        console.log(`${ad} | ${u} | ${sif} | ${s.rol}${s.durum !== 'active' ? ' (PASIF)' : ''}`);
    });
    console.log('='.repeat(65));
}

main();
