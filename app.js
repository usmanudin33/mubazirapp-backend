const express = require('express');
const admin = require('firebase-admin');
const axios = require('axios');

const app = express();
app.use(express.json());

// === Firebase Admin ===
const serviceAccount = require('./mubazir-48ee5-firebase-adminsdk-fbsvc-352ebfdacb.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// === Evolution API v2 ===
const EVOLUTION_URL = 'http://localhost:8080';
const INSTANCE = 'default';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11'; // Ganti dengan API_KEY dari .env Evolution (lihat langkah 2)

// === Simpan OTP sementara ===
const otpStore = new Map();

// === KIRIM OTP VIA WHATSAPP (FIXED v2) ===
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body; // contoh: "628123456789"
  if (!phone) return res.status(400).json({ error: 'Nomor diperlukan' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expiry: Date.now() + 5 * 60 * 1000 });

  try {
    await axios.post(
      `${EVOLUTION_URL}/message/sendText/${INSTANCE}`,
      {
        number: phone,           // TANPA @s.whatsapp.net
        text: `Kode OTP Mubazir App: *${otp}*\nBerlaku 5 menit.\nJangan bagikan kode ini ke siapa pun.`
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY      // WAJIB!
        }
      }
    );
    res.json({ success: true, message: 'OTP terkirim!' });
  } catch (err) {
    console.error('Evolution error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Gagal kirim OTP', details: err.response?.data });
  }
});

// === VERIFIKASI OTP ===
app.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  const stored = otpStore.get(phone);

  if (!stored || stored.expiry < Date.now() || stored.otp !== otp) {
    return res.status(400).json({ error: 'OTP salah atau kadaluarsa' });
  }

  otpStore.delete(phone);

  try {
    const uid = phone;
    const token = await admin.auth().createCustomToken(uid);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Gagal buat token Firebase' });
  }
});

// === TEST ROUTE ===
app.get('/', (req, res) => res.send('Mubazir Backend v2 SIAP! 🚀'));

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend jalan di port ${PORT}`);
});