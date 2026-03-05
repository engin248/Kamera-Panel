import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const sqlPath = path.join(process.cwd(), '09_pgvector_hafiza_tablolari.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Note: Supabase JS library doesn't natively support executing raw SQL strings via a simple method 
        // unless an RPC function like 'exec_sql' is predefined. However, for pgVector we need raw execution.
        // We'll try to execute it by breaking it down or relying on the 'postgres' direct connection if available,
        // but typically raw SQL execution on Supabase requires either Dashboard access or the Supabase CLI.

        // Since we can't reliably run raw SQL via the REST API if no execute function exists, 
        // we'll attempt a common fallback: using RPC if an exec function was created previously.
        const { data, error } = await supabaseAdmin.rpc('run_sql', { query: sql });

        if (error) {
            return NextResponse.json({ error: 'Supabase JS client cannot execute raw SQL without a predefined RPC function. Please run the SQL file manually in Supabase SQL Editor.', details: error }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'SQL tablosu başarıyla oluşturuldu.' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
