import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

// Load env vars
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function initDB() {
    console.log("Supabase Vektörel Veritabanı (RAG) Kurulumu Başlıyor...");

    try {
        // 1. Oku SQL Dosyası
        const sqlPath = resolve(__dirname, "../../../09_pgvector_hafiza_tablolari.sql");
        const sql = readFileSync(sqlPath, "utf-8");

        // Supabase RPC ile execute sql komutu koşturamazsak diye uyaralım:
        console.log("Not: Supabase JS istemcisi doğrudan DDL komutlarını (CREATE TABLE vb.) güvenlikle sebebiyle kısıntılayabilir.");
        console.log("Lütfen `09_pgvector_hafiza_tablolari.sql` içeriğini kopyalayıp Supabase -> SQL Editor üzerinden çalıştırdığınızdan emin olun.");

        // Basit bir ping atalım ki Supabase URL'si doğru mu görelim
        const { error: pingError } = await supabase.from('models').select('id').limit(1);

        if (pingError) {
            console.error("Supabase Bağlantı Hatası:", pingError.message);
        } else {
            console.log("✅ Supabase Bağlantısı Başarılı. Vector tablosunu SQL Editör'den çalıştırdığınız anda Ajanlar aktifleşecektir.");
        }

    } catch (error) {
        console.error("Hata:", error.message);
    }
}

initDB();
