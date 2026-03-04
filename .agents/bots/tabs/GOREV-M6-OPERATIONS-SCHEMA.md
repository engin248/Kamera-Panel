# GÖREV M6 — Operations Tablosu Schema Düzeltme

**Zorluk:** ⭐ Kolay  
**Sorumlu:** _____________

---

## Sorun

SQLite'da `standard_time_min` sütunu var, Supabase'de `standart_sure_dk` — isim farkı. 2 operasyon kaydı aktarılamadı.

## Yapılacak

### 1. Supabase'de sütun ekle

Supabase Dashboard → SQL Editor:

```sql
ALTER TABLE operations ADD COLUMN IF NOT EXISTS standard_time_min NUMERIC;
```

### 2. SQLite'dan aktar

Terminalde çalıştır:

```bash
node -e "
const https=require('https');
const T='sbp_337305f3801d5dfb8e2f87a1ed0c6ae2a5b59365';
const dbM=require('C:/Users/Admin/Desktop/Kamera-Panel/app/node_modules/better-sqlite3');
const db=dbM('C:/Users/Admin/Desktop/Kamera-Panel/app/data/kamera-panel.db');
const rows=db.prepare('SELECT name,model_id,sequence,standard_time_min,station FROM operations').all();
db.close();
console.log(rows.length,'kayit');
rows.forEach(function(r){
  var q='INSERT INTO operations (name,model_id,sequence,standard_time_min,station) VALUES ('+
    [\"'\"+r.name+\"'\",r.model_id,r.sequence,r.standard_time_min,\"'\"+(r.station||'')+\"'\"].join(',')+
    ') ON CONFLICT DO NOTHING';
  var b=JSON.stringify({query:q});
  var req=https.request({hostname:'api.supabase.com',port:443,path:'/v1/projects/cauptlsnqieegdrgotob/database/query',method:'POST',
    headers:{'Authorization':'Bearer '+T,'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}},
    function(res){var d='';res.on('data',function(c){d+=c;});res.on('end',function(){console.log(res.statusCode,r.name);});});
  req.write(b);req.end();
});
"
```

### 3. Mevcut API'yi güncelle

Dosya: `app/app/api/operations/route.js`

- SELECT sorgusunda `standard_time_min` veya `standart_sure_dk` ikisini de al

## Test

- [ ] Supabase'de operations tablosunda 2 kayıt var
- [ ] `/api/operations` veya ilgili endpoint 200 dönüyor
- [ ] Standart süreler doğru görünüyor

## DOKUNMA

İmalat, Muhasebe, page.js'e DOKUNMA!
