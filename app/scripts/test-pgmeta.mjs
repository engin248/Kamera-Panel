import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSQL() {
    console.log('Testing pg-meta with service role key...');
    const res = await fetch(`${URL}/pg-meta/default/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${KEY}`,
            'apiKey': KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'SELECT 1 as result;' })
    });
    const data = await res.text();
    console.log('Status: ', res.status);
    console.log('Data: ', data);
}

testSQL();
