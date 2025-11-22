const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let sock = null;

async function connectWA() {
  if (sock) return sock;
  const authDir = path.join(__dirname, 'auth_info_baileys');
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: require('pino')({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) connectWA();
    }
  });

  return sock;
}

module.exports = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Nomor telepon wajib diisi" });

    const wa = await connectWA();
    const number = phone.replace(/\D/g, '');
    const jid = `${number}@s.whatsapp.net`;

    const code = Math.floor(100000 + Math.random() * 900000);
    await wa.sendMessage(jid, { text: `Kode OTP Mubazir App: *${code}*\nBerlaku 5 menit.\nJangan bagikan kode ini ke siapa pun.` });

    res.json({ success: true, message: "OTP terkirim!", code });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal kirim OTP", details: e.message });
  }
};