#!/bin/bash

# DataIce Automated Deployment Script für Hetzner
# Usage: ./deploy.sh <SERVER_IP> <DOMAIN> <DB_PASSWORD>

set -e

SERVER_IP=${1:-}
DOMAIN=${2:-}
DB_PASSWORD=${3:-}

if [ -z "$SERVER_IP" ] || [ -z "$DOMAIN" ] || [ -z "$DB_PASSWORD" ]; then
    echo "Usage: ./deploy.sh <SERVER_IP> <DOMAIN> <DB_PASSWORD>"
    echo "Example: ./deploy.sh 49.12.34.56 example.com mysecurepass123"
    exit 1
fi

echo "🚀 DataIce Deployment Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Server: $SERVER_IP"
echo "Domain: $DOMAIN"
echo ""

# Step 1: SSH Zugang testen
echo "✓ Testing SSH Connection..."
ssh -o ConnectTimeout=5 root@$SERVER_IP "echo OK" > /dev/null || {
    echo "❌ Cannot connect to server. Check SSH access."
    exit 1
}

# Step 2: Server vorbereiten
echo "✓ Installing Docker & Docker Compose..."
ssh root@$SERVER_IP << 'SCRIPT'
    apt update && apt upgrade -y
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    useradd -m -s /bin/bash appuser 2>/dev/null || true
    usermod -aG docker appuser
SCRIPT

# Step 3: Repository klonen
echo "✓ Cloning Repository..."
ssh appuser@$SERVER_IP << SCRIPT
    cd ~
    git clone https://github.com/PhippuStreit/DataIce.git || cd DataIce && git pull
    cd DataIce
SCRIPT

# Step 4: Environment konfigurieren
echo "✓ Configuring Environment..."
ssh appuser@$SERVER_IP << SCRIPT
    cd ~/DataIce
    cat > .env.prod << EOF
DB_PASSWORD=$DB_PASSWORD
NODE_ENV=production
LOG_LEVEL=info
SESSION_SECRET=$(openssl rand -base64 32)
EOF
SCRIPT

# Step 5: Nginx konfigurieren
echo "✓ Installing Nginx..."
ssh root@$SERVER_IP << SCRIPT
    apt install -y nginx certbot python3-certbot-nginx
    
    cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX
    
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx
SCRIPT

# Step 6: SSL Zertifikat
echo "✓ Generating SSL Certificate with Let's Encrypt..."
ssh root@$SERVER_IP "certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos -m admin@$DOMAIN --non-interactive"

# Step 7: Application starten
echo "✓ Starting Application..."
ssh appuser@$SERVER_IP << SCRIPT
    cd ~/DataIce
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
SCRIPT

# Step 8: Firewall konfigurieren
echo "✓ Configuring Firewall..."
ssh root@$SERVER_IP << SCRIPT
    apt install -y ufw
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw enable --force
SCRIPT

# Step 9: Backup-Script
echo "✓ Setting up Backup Script..."
ssh appuser@$SERVER_IP << 'SCRIPT'
    cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/home/appuser/backups
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec dataice-db pg_dump -U postgres dataice | gzip > $BACKUP_DIR/dataice_$TIMESTAMP.sql.gz
find $BACKUP_DIR -name "dataice_*.sql.gz" -mtime +30 -delete
echo "Backup created: $BACKUP_DIR/dataice_$TIMESTAMP.sql.gz"
EOF
    chmod +x ~/backup-db.sh
    (crontab -l 2>/dev/null || true; echo "0 3 * * * /home/appuser/backup-db.sh") | crontab -
SCRIPT

echo ""
echo "✅ Deployment erfolgreich!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Öffne: https://$DOMAIN"
echo "📊 Server: $SERVER_IP"
echo ""
echo "Nächste Schritte:"
echo "1. DNS konfigurieren: A Record → $SERVER_IP"
echo "2. Warte 15-30 Min auf DNS Propagation"
echo "3. Öffne https://$DOMAIN im Browser"
echo ""
echo "Wichtige Befehle:"
echo "  ssh appuser@$SERVER_IP"
echo "  cd ~/DataIce"
echo "  docker-compose -f docker-compose.prod.yml logs -f web"
echo ""
