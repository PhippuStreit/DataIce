# DataIce auf Hetzner deployen – Kompletter Guide mit SSL

## 1. Server-Auswahl auf Hetzner

### Empfohlene Konfiguration
- **Type:** Hetzner Cloud VPS (CPX11 oder höher)
- **OS:** Ubuntu 22.04 LTS oder 24.04
- **RAM:** Min. 2 GB (CPX11)
- **Disk:** 40 GB SSD (genügt für Start)
- **Region:** Swizerland (nbg1 oder fsn1)

**Kosten:** ~5-10 €/Monat

### Schritt 1: Server erstellen
1. Gehe zu https://console.hetzner.cloud
2. Erstelle neuen Server
3. Wähle Ubuntu 22.04 LTS
4. SSH Key hinzufügen (oder später setzen)
5. Server erstellen (~1 Min)

---

## 2. SSH-Zugang konfigurieren

### Auf deinem lokalen Mac:
```bash
# Verbinde dich zum neuen Server
ssh root@<SERVER_IP>

# Oder mit SSH Key:
ssh -i ~/.ssh/id_ed25519 root@<SERVER_IP>
```

---

## 3. Server vorbereiten

```bash
# Als root ausführen:

# Updates installieren
apt update && apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Nicht-root User erstellen (optional, empfohlen)
useradd -m -s /bin/bash appuser
usermod -aG docker appuser
```

---

## 4. Domain und DNS konfigurieren

### DNS auf Hetzner/deinem DNS-Provider:
```
A Record: example.com -> <SERVER_IP>
A Record: www.example.com -> <SERVER_IP>
```

**Hinweis:** Warte 15-30 Min, bis DNS propagiert ist.

---

## 5. Application auf dem Server deployen

### Repository klonen:
```bash
# Als appuser
su - appuser

# Repository klonen
git clone https://github.com/PhippuStreit/DataIce.git
cd DataIce

# Environment konfigurieren
cp .env.example .env
# Passe DATABASE_URL an, falls nötig (default ist OK)
```

### docker-compose.yml anpassen (WICHTIG für Production):
```bash
nano docker-compose.yml
```

Ändere die Umgebung für Production:
```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: CHANGE_THIS_PASSWORD  # ← Ändere dieses Passwort!
      POSTGRES_DB: dataice
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d dataice"]
      timeout: 5s
      interval: 10s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    networks:
      - dataice-net

  web:
    build:
      context: .
      dockerfile: Dockerfile
    command: sh -c "npx prisma db push && npm run build && npm start -- --hostname 0.0.0.0"
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:CHANGE_THIS_PASSWORD@db:5432/dataice?schema=public
      NODE_ENV: production
      LOG_LEVEL: info
      SESSION_SECRET: $(openssl rand -base64 32)
    restart: always
    expose:
      - 3000
    networks:
      - dataice-net

networks:
  dataice-net:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

---

## 6. Nginx als Reverse Proxy + SSL mit Let's Encrypt

### Nginx installieren:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Nginx Config erstellen:
```bash
sudo nano /etc/nginx/sites-available/dataice
```

```nginx
# HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;

    # SSL Zertifikate (werden von Certbot generiert)
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # SSL Security Best Practices
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Proxy zu Docker App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Nginx Config aktivieren:
```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/dataice /etc/nginx/sites-enabled/

# Default Site deaktivieren (optional)
sudo rm /etc/nginx/sites-enabled/default

# Teste Konfiguration
sudo nginx -t

# Nginx starten
sudo systemctl restart nginx
```

---

## 7. SSL-Zertifikat mit Let's Encrypt

### Zertifikat ausstellen:
```bash
# Ersetze example.com mit deiner Domain
sudo certbot certonly --nginx -d example.com -d www.example.com
```

**Hinweis:** Certbot wird dich nach deiner Email fragen. Nutze eine echte Email, falls Zertifikat-Renewals notwendig sind.

### Auto-Renewal konfigurieren:
```bash
# Teste Renewal
sudo certbot renew --dry-run

# Prüfe ob Service läuft
sudo systemctl status certbot.timer
sudo systemctl enable certbot.timer
```

---

## 8. Application starten

```bash
cd ~/DataIce

# Container bauen und starten
docker-compose up -d --build

# Prüfe Status
docker-compose ps
docker-compose logs --tail=50 web

# Prüfe die App
curl -I http://localhost:3000
```

---

## 9. Firewall konfigurieren (optional, empfohlen)

```bash
# UFW installieren
sudo apt install -y ufw

# Ports öffnen
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Status prüfen
sudo ufw status
```

---

## 10. Backup-Strategie

### PostgreSQL Backup Script erstellen:
```bash
# Datei erstellen
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/home/appuser/backups
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

docker exec dataice-db-1 pg_dump -U postgres dataice | gzip > $BACKUP_DIR/dataice_$TIMESTAMP.sql.gz

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "dataice_*.sql.gz" -mtime +30 -delete

echo "Backup erstellt: $BACKUP_DIR/dataice_$TIMESTAMP.sql.gz"
EOF

# Executable machen
chmod +x ~/backup-db.sh

# In Crontab hinzufügen (täglich 3 Uhr)
crontab -e
# Hinzufügen: 0 3 * * * /home/appuser/backup-db.sh
```

---

## 11. Monitoring und Logs

### Docker Logs anschauen:
```bash
# Laufende Logs
docker-compose logs -f web

# Letzte 100 Zeilen
docker-compose logs --tail=100 web

# Container Status
docker-compose ps
```

### Hetzner Metrics nutzen:
- Gehe zu https://console.hetzner.cloud
- Klicke auf deinen Server
- Sieh CPU, RAM, Disk, Traffic in Echtzeit

---

## 12. Domain SSL überprüfen

Nachdem alles läuft, teste deine SSL:
```bash
# Via Browser: https://example.com
# Sollte grünes Schloss zeigen

# Via CLI:
curl -I https://example.com
```

---

## Troubleshooting

### App läuft nicht:
```bash
docker-compose logs web
# Suche nach Fehlern
```

### Nginx zeigt Error:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### SSL-Fehler:
```bash
# Zertifikat überprüfen
sudo certbot certificates

# Manuell erneuern
sudo certbot renew --force-renewal
```

### Datenbank-Verbindung:
```bash
docker-compose exec web npx prisma studio
# Öffnet Web-Interface für Datenbank (localhost:5555)
```

---

## Production Checkliste

- [ ] Server auf Hetzner erstellt
- [ ] SSH-Zugang funktioniert
- [ ] Docker & Docker Compose installiert
- [ ] Repository geklont
- [ ] docker-compose.yml für Production angepasst (Passwort geändert!)
- [ ] Nginx installiert und konfiguriert
- [ ] Domain DNS konfiguriert
- [ ] SSL-Zertifikat mit Let's Encrypt erstellt
- [ ] App läuft: `docker-compose up -d`
- [ ] https://example.com erreichbar
- [ ] Backup-Script eingerichtet
- [ ] Firewall konfiguriert

---

## Kosten Übersicht (monatlich)

- **Server (CPX11):** ~5 €
- **Zusätze:** Backups, Traffic → meist kostenlos bei Hetzner
- **Domain:** Je nach Provider (0,50-2 €)
- **Total:** ~5-10 € / Monat

---

## Nächste Schritte

1. **Monitoring:** Setze PM2 oder systemd-Service auf für automatische Restarts
2. **CI/CD:** Nutze GitHub Actions für automatische Deployments
3. **Logging:** Setze ELK Stack oder Grafana auf
4. **Load Balancing:** Für Multiple Server später
