#!/bin/bash
# NamaRepoAnda/deploy.sh

echo "Starting deployment..."

# 1. Masuk ke direktori proyek
cd /home/ec2-user/mubazirapp-backend

# 2. Tarik kode terbaru
echo "Pulling latest code from GitHub..."
git pull origin main

# 3. Install Evolution API (jika belum ada)
if [ ! -d "evolution-api" ]; then
  echo "Cloning Evolution API..."
  git clone https://github.com/EvolutionAPI/evolution-api.git
fi

# 4. Update & install Evolution
echo "Setting up Evolution API..."
cd evolution-api
git pull origin main || true
npm install --production
cd ..

# 5. Install backend dependencies
echo "Installing backend dependencies..."
npm install

# 6. Start/Restart Evolution API dengan PM2
echo "Starting Evolution API..."
pm2 delete evolution-api 2>/dev/null || true
pm2 start "npm start" --name "evolution-api" --cwd "/home/ec2-user/mubazirapp-backend/evolution-api" --wait-ready

# 7. Start/Restart Express App
echo "Starting Express backend..."
pm2 delete mubazirapp-backend 2>/dev/null || true
pm2 start app.js --name "mubazirapp-backend" --wait-ready

# 8. Save PM2 process list
pm2 save

# 9. Setup auto-restart on reboot
pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

echo "Deployment complete!"
echo "Backend: http://$(curl -s ifconfig.me):3000"
echo "Evolution API: http://localhost:8080"
echo "Scan QR di: http://$(curl -s ifconfig.me):8080 (buka di browser)"