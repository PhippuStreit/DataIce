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
# Verbinde dich zum Server (mit Passwort)
ssh root@88.198.172.8

# Nach SSH Key Setup (ohne Passwort):
ssh root@88.198.172.8
```

### SSH Key hinzufügen (erste Verbindung):
```bash
# Auf dem Server (nach Login mit Passwort):
mkdir -p ~/.ssh
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKx7z8+... ps@nexplore.ch
EOF

chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
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

### DNS auf deinem DNS-Provider:
```
A Record: data.digidude.ch -> 88.198.172.8
```

**Hinweis:** Warte 15-30 Min, bis DNS propagiert ist. Prüfen:
```bash
dig +short data.digidude.ch     # muss 88.198.172.8 liefern
```
Certbot schlägt fehl, solange der A-Record nicht auf den Server zeigt.

---

## 5. Application auf dem Server deployen

### Repository klonen:
```bash
# Als appuser
su - appuser

# Repository klonen
git clone https://github.com/PhippuStreit/DataIce.git
cd DataIce
```

Kein `.env` nötig – Production nutzt `.env.prod` (siehe nächster Abschnitt).

### Production-Setup: `docker-compose.prod.yml` + `.env.prod`

Das Repo enthält bereits `docker-compose.prod.yml`. Nicht editieren – alle
Secrets kommen über `.env.prod`:

```bash
cd ~/DataIce
cat > .env.prod << EOF
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
SESSION_SECRET=$(openssl rand -base64 32)
LOG_LEVEL=info
EOF
chmod 600 .env.prod
```

Wichtig an `docker-compose.prod.yml`:
- `web` published Port nur auf `127.0.0.1:3000` – nicht öffentlich, nginx
  proxyt von aussen dorthin.
- `DB_PASSWORD` und `SESSION_SECRET` sind Pflicht (`:?`), Start bricht ab wenn
  nicht in `.env.prod` gesetzt.
- Build (`next build`) passiert im `Dockerfile`, nicht im `command` – sonst
  baut jeder Container-Restart neu.
- Container heissen `dataice-db` / `dataice-web` (relevant fürs Backup-Script).

---

## 6. Nginx als Reverse Proxy + SSL mit Let's Encrypt

**Alles in diesem Abschnitt als `root` ausführen** (`ssh root@88.198.172.8`).
`appuser` hat kein `sudo`. `sudo` deshalb weglassen.

Zwei Phasen: erst HTTP-only, dann baut Certbot den HTTPS-Block selbst.
Direkt einen SSL-Block schreiben scheitert – die Zertifikate existieren noch
nicht (`cannot load certificate ... No such file or directory`).

### Nginx + Certbot installieren:
```bash
apt update
apt install -y nginx certbot python3-certbot-nginx
```

### Phase 1 – HTTP-only Config:
```bash
nano /etc/nginx/sites-available/dataice
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name data.digidude.ch;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

### Aktivieren:
```bash
ln -sf /etc/nginx/sites-available/dataice /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## 7. SSL-Zertifikat mit Let's Encrypt (Phase 2)

Voraussetzung: `dig +short data.digidude.ch` liefert `88.198.172.8`.

```bash
certbot --nginx -d data.digidude.ch \
  --agree-tos -m ps@nexplore.ch --redirect --non-interactive
```

`--nginx` (nicht `certonly`) → Certbot schreibt den `443 ssl`-Block +
HTTP→HTTPS-Redirect selbst in die Config und lädt nginx neu. `--redirect`
erzwingt HTTPS. Kein manueller SSL-Block nötig.

### Auto-Renewal prüfen:
```bash
certbot renew --dry-run
systemctl status certbot.timer     # muss "active" sein
```
Der Timer wird bei der Installation automatisch aktiviert.

### Testen:
```bash
nginx -t && systemctl reload nginx
curl -I https://data.digidude.ch
```

---

## 8. Application starten

```bash
cd ~/DataIce

# Container bauen und starten (Production!)
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Prüfe Status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50 web

# Prüfe die App (nur auf localhost erreichbar)
curl -I http://127.0.0.1:3000
```

---

## 9. Firewall konfigurieren (optional, empfohlen)

Als `root`:
```bash
apt install -y ufw
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw --force enable
ufw status
```
Port 3000 nicht öffnen – Container ist auf `127.0.0.1` gebunden, nur nginx greift zu.

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

docker exec dataice-db pg_dump -U postgres dataice | gzip > $BACKUP_DIR/dataice_$TIMESTAMP.sql.gz

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
cd ~/DataIce
alias dc="docker-compose -f docker-compose.prod.yml --env-file .env.prod"

# Laufende Logs
dc logs -f web

# Letzte 100 Zeilen
dc logs --tail=100 web

# Container Status
dc ps
```

### Hetzner Metrics nutzen:
- Gehe zu https://console.hetzner.cloud
- Klicke auf deinen Server
- Sieh CPU, RAM, Disk, Traffic in Echtzeit

---

## 12. Domain SSL überprüfen

Nachdem alles läuft, teste deine SSL:
```bash
# Via Browser: https://data.digidude.ch
# Sollte grünes Schloss zeigen

# Via CLI:
curl -I https://data.digidude.ch
```

---

## Troubleshooting

### App läuft nicht:
```bash
cd ~/DataIce
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs web
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
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec web npx prisma studio
# Öffnet Web-Interface für Datenbank (localhost:5555)
```

---

## Production Checkliste

- [ ] Server auf Hetzner erstellt
- [ ] SSH-Zugang funktioniert
- [ ] Docker & Docker Compose installiert
- [ ] Repository geklont
- [ ] `.env.prod` erstellt (DB_PASSWORD + SESSION_SECRET gesetzt!)
- [ ] Nginx installiert und konfiguriert
- [ ] Domain DNS konfiguriert
- [ ] SSL-Zertifikat mit Let's Encrypt erstellt
- [ ] App läuft: `docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build`
- [ ] https://data.digidude.ch erreichbar
- [ ] Backup-Script eingerichtet
- [ ] Firewall konfiguriert

---

## Kosten Übersicht (monatlich)

- **Server (CPX11):** ~5 €
- **Zusätze:** Backups, Traffic → meist kostenlos bei Hetzner
- **Domain:** Je nach Provider (0,50-2 €)
- **Total:** ~5-10 € / Monat

---

## Quick Start für dein Setup

### Schritt-für-Schritt (Server 88.198.172.8):

1. **SSH Key hinzufügen:**
   ```bash
   ssh root@88.198.172.8
   # Passwort eingeben
   
   mkdir -p ~/.ssh
   cat >> ~/.ssh/authorized_keys << 'EOF'
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKx7z8+... ps@nexplore.ch
   EOF
   chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
   exit
   ```

2. **Server vorbereiten:**
   ```bash
   ssh root@88.198.172.8
   apt update && apt upgrade -y
   
   # Docker installieren (siehe Schritt 3)
   ```

3. **Domain DNS einstellen:**
   - A Record: `data.digidude.ch` → `88.198.172.8`
   - Warte 15-30 Min auf Propagation, prüfen mit `dig +short data.digidude.ch`

4. **App deployen (siehe Schritt 5-8)**

## Nächste Schritte

1. **Monitoring:** Setze PM2 oder systemd-Service auf für automatische Restarts
2. **CI/CD:** Nutze GitHub Actions für automatische Deployments
3. **Logging:** Setze ELK Stack oder Grafana auf
4. **Load Balancing:** Für Multiple Server später
