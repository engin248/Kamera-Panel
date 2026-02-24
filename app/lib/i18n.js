// Çok Dilli Destek Sistemi — Türkçe + Arapça
// Kullanım: import { t, setLanguage, getLanguage } from '@/lib/i18n';

const translations = {
    tr: {
        // Genel
        'app.title': '47 Sil Baştan 01',
        'app.subtitle': 'Tekstil Üretim Sistemi',
        'nav.dashboard': 'Ana Panel',
        'nav.models': 'Modeller',
        'nav.personnel': 'Personel',
        'nav.machines': 'Makineler',
        'nav.production': 'Üretim Takip',
        'nav.quality': 'Kalite Kontrol',
        'nav.orders': 'Sipariş Takip',
        'nav.prim': 'Prim & Ücret',
        'nav.costs': 'Maliyet Analizi',
        'nav.reports': 'Raporlar',
        'nav.customers': 'Müşteriler',
        'nav.fason': 'Fason',
        'nav.shipments': 'Sevkiyat',
        'nav.settings': 'Ayarlar',

        // Operatör
        'operator.login': 'Operatör Girişi',
        'operator.select_name': 'Üretim yapmak için adınızı seçin',
        'operator.select_model': 'Model Seçin',
        'operator.select_operation': 'İşlem Seçin',
        'operator.prepare': 'İşleme Hazırlanın',
        'operator.watch_video': 'İşlem Videosunu İzleyin',
        'operator.listen_audio': 'Sesli Anlatımı Dinleyin',
        'operator.read_instructions': 'Yazılı Talimatı Okuyun',
        'operator.compare_photos': 'Doğru ve Yanlış Örnekleri İnceleyin',
        'operator.correct_example': 'DOĞRU Yapılmış',
        'operator.incorrect_example': 'YANLIŞ Yapılmış',
        'operator.machine_info': 'Makine & Malzeme Bilgileri',
        'operator.ready': 'İnceledim, İlk Ürünü Hazırladım → Onaya Gönder',
        'operator.waiting_approval': 'Yönetici Onayı Bekleniyor',
        'operator.approved_start': 'Onay Verildi — Başla',
        'operator.producing': 'ÜRETİMDE',
        'operator.paused': 'MOLA',
        'operator.produced': 'ÜRETİLEN',
        'operator.elapsed': 'GEÇEN SÜRE',
        'operator.unit_time': 'BİRİM SÜRE',
        'operator.defective': 'HATALI ÜRÜN',
        'operator.defect_reason': 'HATA NEDENİ',
        'operator.complete_item': 'ÜRÜN TAMAMLANDI',
        'operator.break': 'Mola',
        'operator.machine_fault': 'Makine Arıza',
        'operator.waiting_material': 'Malzeme Bekle',
        'operator.resume': 'DEVAM ET',
        'operator.finish': 'ÜRETİMİ BİTİR',
        'operator.done': 'Üretim Tamamlandı!',
        'operator.quality_check': 'Ara Kontrol Zamanı!',
        'operator.quality_check_desc': '20 ürün tamamlandı. Lütfen son ürünü kontrol edin.',
        'operator.suitable': 'Uygun',
        'operator.needs_fix': 'Düzeltilmeli',
        'operator.new_order': 'Yeni İşlem Başlat',
        'operator.logout': 'Çıkış Yap',
        'operator.lot_change': 'Kumaş/parti değişikliği notu (varsa)',
        'operator.daily_summary': 'Bugünkü Performansınız',
        'operator.take_photo': 'Fotoğraf Çek / Seç',
        'operator.retake_photo': 'Tekrar Çek',
        'operator.send_approval': 'Onaya Gönder',
        'operator.approval_sent': 'Onay talebi gönderildi. Yönetici onayı bekleniyor...',
        'operator.quality_value': 'Değer',
        'operator.quality_rate': 'Kalite',

        // Hata Nedenleri
        'defect.thread_break': 'İplik Kopması',
        'defect.needle_break': 'İğne Kırılması',
        'defect.stitch_slip': 'Dikiş Kayması',
        'defect.fabric_defect': 'Kumaş Hatası',
        'defect.operator_error': 'Operatör Hatası',
        'defect.other': 'Diğer',

        // Ortak
        'common.save': 'Kaydet',
        'common.cancel': 'İptal',
        'common.delete': 'Sil',
        'common.edit': 'Düzenle',
        'common.add': 'Ekle',
        'common.back': 'Geri',
        'common.pieces': 'adet',
        'common.seconds': 'sn',
        'common.minutes': 'dk',
        'common.net_work': 'net çalışma',
        'common.sec_per_piece': 'sn/adet',
    },

    ar: {
        // Genel
        'app.title': 'لوحة الكاميرا',
        'app.subtitle': 'نظام إنتاج النسيج',
        'nav.dashboard': 'اللوحة الرئيسية',
        'nav.models': 'الموديلات',
        'nav.personnel': 'الموظفين',
        'nav.machines': 'الآلات',
        'nav.production': 'تتبع الإنتاج',
        'nav.quality': 'مراقبة الجودة',
        'nav.orders': 'تتبع الطلبات',
        'nav.prim': 'المكافآت والرواتب',
        'nav.costs': 'تحليل التكاليف',
        'nav.reports': 'التقارير',
        'nav.customers': 'العملاء',
        'nav.fason': 'المصنع',
        'nav.shipments': 'الشحنات',
        'nav.settings': 'الإعدادات',

        // Operatör
        'operator.login': 'تسجيل دخول المشغل',
        'operator.select_name': 'اختر اسمك للبدء بالإنتاج',
        'operator.select_model': 'اختر الموديل',
        'operator.select_operation': 'اختر العملية',
        'operator.prepare': 'استعد للعملية',
        'operator.watch_video': 'شاهد فيديو العملية',
        'operator.listen_audio': 'استمع للشرح الصوتي',
        'operator.read_instructions': 'اقرأ التعليمات المكتوبة',
        'operator.compare_photos': 'قارن الأمثلة الصحيحة والخاطئة',
        'operator.correct_example': 'تم بشكل صحيح',
        'operator.incorrect_example': 'تم بشكل خاطئ',
        'operator.machine_info': 'معلومات الآلة والمواد',
        'operator.ready': 'تمت المراجعة، أرسل للموافقة',
        'operator.waiting_approval': 'في انتظار موافقة المدير',
        'operator.approved_start': 'تمت الموافقة — ابدأ',
        'operator.producing': 'قيد الإنتاج',
        'operator.paused': 'استراحة',
        'operator.produced': 'المنتج',
        'operator.elapsed': 'الوقت المنقضي',
        'operator.unit_time': 'وقت الوحدة',
        'operator.defective': 'المنتج المعيب',
        'operator.defect_reason': 'سبب العيب',
        'operator.complete_item': 'تم إنتاج المنتج',
        'operator.break': 'استراحة',
        'operator.machine_fault': 'عطل الآلة',
        'operator.waiting_material': 'انتظار المواد',
        'operator.resume': 'استمر',
        'operator.finish': 'إنهاء الإنتاج',
        'operator.done': 'اكتمل الإنتاج!',
        'operator.quality_check': 'وقت فحص الجودة!',
        'operator.quality_check_desc': 'تم إنتاج 20 قطعة. يرجى فحص القطعة الأخيرة.',
        'operator.suitable': 'مناسب',
        'operator.needs_fix': 'يحتاج إصلاح',
        'operator.new_order': 'بدء عملية جديدة',
        'operator.logout': 'تسجيل الخروج',
        'operator.lot_change': 'ملاحظة تغيير القماش/الدفعة (إن وجد)',
        'operator.daily_summary': 'أداؤك اليومي',
        'operator.take_photo': 'التقط صورة / اختر',
        'operator.retake_photo': 'التقط مرة أخرى',
        'operator.send_approval': 'أرسل للموافقة',
        'operator.approval_sent': 'تم إرسال طلب الموافقة. في انتظار موافقة المدير...',
        'operator.quality_value': 'القيمة',
        'operator.quality_rate': 'الجودة',

        // Hata Nedenleri
        'defect.thread_break': 'انقطاع الخيط',
        'defect.needle_break': 'كسر الإبرة',
        'defect.stitch_slip': 'انزلاق الغرزة',
        'defect.fabric_defect': 'عيب القماش',
        'defect.operator_error': 'خطأ المشغل',
        'defect.other': 'أخرى',

        // Ortak
        'common.save': 'حفظ',
        'common.cancel': 'إلغاء',
        'common.delete': 'حذف',
        'common.edit': 'تعديل',
        'common.add': 'إضافة',
        'common.back': 'رجوع',
        'common.pieces': 'قطعة',
        'common.seconds': 'ثانية',
        'common.minutes': 'دقيقة',
        'common.net_work': 'العمل الصافي',
        'common.sec_per_piece': 'ثانية/قطعة',
    }
};

let currentLang = 'tr';

export function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        if (typeof window !== 'undefined') {
            localStorage.setItem('kamera-panel-lang', lang);
            // RTL desteği
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = lang;
        }
    }
}

export function getLanguage() {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('kamera-panel-lang');
        if (saved && translations[saved]) {
            currentLang = saved;
        }
    }
    return currentLang;
}

export function t(key, fallback) {
    return translations[currentLang]?.[key] || fallback || translations['tr']?.[key] || key;
}

export function getAvailableLanguages() {
    return [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    ];
}

// Dil başlat
if (typeof window !== 'undefined') {
    getLanguage();
}

export default translations;
