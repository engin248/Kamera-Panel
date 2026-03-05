const http = require('http');

const payload = JSON.stringify({
    message: "Ahmet Yılmaz adında yeni bir personeli operatör rolüyle ve 26500 ₺ maaşla işe al.",
    history: []
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/agent/ik-asistan',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('RESPONSE:', data);
    });
});

req.on('error', (e) => {
    console.error('Hata:', e.message);
});

req.write(payload);
req.end();
