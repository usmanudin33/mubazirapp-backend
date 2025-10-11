#!/bin/bash
# NamaRepoAnda/deploy.sh

# 1. Masuk ke direktori proyek
cd /home/ec2-user/NamaRepoAnda # Ganti dengan path folder Anda

# 2. Tarik kode terbaru
echo "Pulling latest code from GitHub..."
git pull origin main

# 3. Instal dependensi baru jika ada
echo "Installing dependencies..."
npm install

# 4. Restart aplikasi menggunakan PM2
echo "Restarting application with PM2..."
pm2 reload my-express-app || pm2 start index.js --name "my-express-app"

echo "Deployment complete."