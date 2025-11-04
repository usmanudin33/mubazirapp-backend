const express = require('express');
const admin = require('firebase-admin');
const axios = require('axios');

const app = express();
app.use(express.json());

// === Firebase Admin (GRATIS) ===
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// === Evolution API (localhost:8080) ===
const EVOLUTION_URL = 'http://localhost:8080';
const INSTANCE = 'default';

// === Simpan OTP sementara ===
const otpStore = new Map();

// 1. Kirim OTP via WhatsApp
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Nomor diperlukan' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expiry: Date.now() + 5 * 60 * 1000 });

  try {
    await axios.post(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      number: `${phone}@s.whatsapp.net`,
      textMessage: { text: `Kode OTP Anda: *${otp}*\nBerlaku 5 menit.` }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Evolution error:', err.message);
    res.status(500).json({ error: 'Gagal kirim OTP. Pastikan Evolution API jalan.' });
  }
});

// 2. Verifikasi OTP → Firebase Custom Token
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
    res.status(500).json({ error: 'Gagal buat token' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend jalan di http://localhost:${PORT}`);
});