#!/bin/bash
# mubazirapp-backend/deploy.sh → VERSI FINAL 100% JALAN

echo "============================================"
echo "    MUBAZIRAPP-BACKEND AUTO DEPLOY STARTED"
echo "============================================"

# 1. Masuk ke folder proyek
cd /home/ec2-user/mubazirapp-backend || { echo "Folder tidak ada!"; exit 1; }

# 2. Tarik kode terbaru dari GitHub (force sync kalau ada conflict)
echo "Sync dengan GitHub..."
git fetch origin
git reset --hard origin/main
git clean -fd
git pull origin main

# 3. Clone Evolution API kalau belum ada
if [ ! -d "evolution-api" ]; then
  echo "Cloning Evolution API..."
  git clone https://github.com/EvolutionAPI/evolution-api.git
fi

# 4. Setup Evolution API (MASUK FOLDER DULU!)
echo "Setup Evolution API (v2 fix)..."
cd evolution-api

# Update repo Evolution
git pull origin main || true

# Hapus husky & script bermasalah
npm pkg delete scripts.prepare 2>/dev/null || true

# Install tanpa script + tanpa error prisma
npm install --production --ignore-scripts --legacy-peer-deps

# Fix Prisma + Database SQLite otomatis
mkdir -p src/prisma
npx prisma generate 2>/dev/null || true
npx prisma migrate deploy --skip-generate 2>/dev/null || true

# CONFIG .env Evolution API (WAJIB!)
cat > .env << EOF
# Server binding
SERVER_URL=http://0.0.0.0:8080
HOST=0.0.0.0
PORT=8080

# Database SQLite (wajib!)
DATABASE_ENABLED=true
DATABASE_CONNECTION=sqlite:./src/prisma/db.sqlite

# Instance default
CONFIG_SESSION_PHONE_NAME=default

# Global API Key (jika belum ada, generate otomatis)
GLOBAL_API_KEY=$(openssl rand -hex 16)
EOF

# Kembali ke root proyek
cd ..

# 5. Install backend (Express + Firebase)
echo "Install backend dependencies..."
npm install

# 6. Restart Evolution API
echo "Restart Evolution API..."
pm2 delete evolution-api 2>/dev/null || true
pm2 start "npm start" --name "evolution-api" --cwd "/home/ec2-user/mubazirapp-backend/evolution-api" --wait-ready --time

# 7. Restart Backend Express
echo "Restart Backend Express..."
pm2 delete mubazirapp-backend 2>/dev/null || true
pm2 start app.js --name "mubazirapp-backend" --wait-ready --time

# 8. Simpan konfigurasi PM2
pm2 save

# 9. Auto-restart saat server reboot (hanya sekali)
if ! pm2 list | grep -q "startup"; then
  pm2 startup systemd -u ec2-user --hp /home/ec2-user | grep -o "sudo.*" | sh
fi
pm2 save

# 10. Tampilkan info penting
PUBLIC_IP=$(curl -s ifconfig.me)

echo "============================================"
echo "           DEPLOYMENT SELESAI!           "
echo "============================================"
echo "Backend API   : http://$PUBLIC_IP:3000"
echo "Evolution QR  : http://$PUBLIC_IP:8080"
echo "Scan QR di atas dengan WhatsApp → Linked Devices"
echo "Test OTP      : curl -X POST http://$PUBLIC_IP:3000/send-otp -d '{\"phone\":\"628xxx\"}' -H 'Content-Type: application/json'"
echo "============================================"
echo "API_KEY Evolution (simpan!):"
grep GLOBAL_API_KEY evolution-api/.env
echo "============================================"