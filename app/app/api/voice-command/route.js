import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * 🎙️ Voice Command API
 * 
 * Ses komutlarını alır, metin olarak işler ve ilgili API'ye yönlendirir.
 * Web Speech API (frontend) → text → bu API → işlem
 * 
 * Desteklenen komutlar:
 * - "üretim ekle" → /api/production POST
 * - "gider ekle" → /api/expenses POST
 * - "personel listele" → /api/personnel GET
 * - Genel komutlar → audit_trail'e loglanır
 */

// Komut eşleştirme desenleri
const COMMAND_PATTERNS = [
    { pattern: /üretim\s+ekle/i, action: 'production_add', description: 'Üretim kaydı ekle' },
    { pattern: /gider\s+ekle/i, action: 'expense_add', description: 'Gider kaydı ekle' },
    { pattern: /personel\s+listele/i, action: 'personnel_list', description: 'Personel listesi' },
    { pattern: /model\s+listele/i, action: 'model_list', description: 'Model listesi' },
    { pattern: /sipariş\s+listele/i, action: 'order_list', description: 'Sipariş listesi' },
    { pattern: /rapor\s+göster/i, action: 'report_show', description: 'Rapor göster' },
    { pattern: /maliyet\s+hesapla/i, action: 'cost_calculate', description: 'Maliyet hesapla' },
    { pattern: /prim\s+hesapla/i, action: 'bonus_calculate', description: 'Prim hesapla' },
];

export async function POST(request) {
    try {
        const user = await checkAuth(request, 'POST');
        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }
        if (user._forbidden) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const body = await request.json();
        const { text, language = 'tr' } = body;

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: 'Ses komutu metni boş' }, { status: 400 });
        }

        const normalizedText = text.trim().toLowerCase();

        // Komut eşleştirme
        let matchedCommand = null;
        for (const cmd of COMMAND_PATTERNS) {
            if (cmd.pattern.test(normalizedText)) {
                matchedCommand = cmd;
                break;
            }
        }

        // Komut logla
        try {
            await supabaseAdmin.from('audit_trail').insert({
                table_name: 'voice_command',
                record_id: null,
                action: 'VOICE_COMMAND',
                record_summary: `Ses komutu: "${text}" → ${matchedCommand ? matchedCommand.action : 'tanınmadı'}`,
                user_id: user.id,
                user_name: user.display_name || 'Bilinmeyen',
            });
        } catch (logErr) {
            console.warn('Voice command log hatası:', logErr.message);
        }

        if (!matchedCommand) {
            return NextResponse.json({
                success: true,
                recognized: false,
                original_text: text,
                message: `"${text}" komutu tanınmadı. Desteklenen komutlar: üretim ekle, gider ekle, personel listele, model listele, sipariş listele, rapor göster, maliyet hesapla, prim hesapla`,
                available_commands: COMMAND_PATTERNS.map(c => c.description),
            });
        }

        return NextResponse.json({
            success: true,
            recognized: true,
            original_text: text,
            command: matchedCommand.action,
            description: matchedCommand.description,
            message: `"${matchedCommand.description}" komutu algılandı. Onay bekleniyor.`,
            requires_confirmation: true,
        });

    } catch (error) {
        console.error('Voice command hatası:', error);
        return NextResponse.json({ error: 'Ses komutu işlenemedi: ' + error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const user = await checkAuth(request, 'GET');
        if (!user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            commands: COMMAND_PATTERNS.map(c => ({
                action: c.action,
                description: c.description,
                pattern: c.pattern.source,
            })),
            supported_languages: ['tr', 'ar', 'en'],
            message: 'Voice command API aktif',
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
