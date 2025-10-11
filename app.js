const express = require('express');
const admin = require('firebase-admin');
// Inisialisasi Firebase Admin di sini (nanti)

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Backend Node.js siap di EC2!');
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});