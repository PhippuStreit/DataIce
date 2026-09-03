# Marketing

## flyer-glacetruhe.html

A4-Aushang für die Glacetruhe. QR-Code zeigt auf `https://data.digidude.ch`.

**Drucken:** Datei im Browser öffnen → „Als PDF drucken" (oder Cmd/Strg+P).
Format **A4**, Skalierung **100 %**, Ränder **keine**.

QR-Code neu erzeugen (falls Domain ändert):

```bash
node -e "require('qrcode').toString('https://NEUE-DOMAIN', {type:'svg',margin:0}, (e,s)=>console.log(s))"
```

Danach das `<svg …viewBox="0 0 25 25"…>` im `.qr`-Block ersetzen.
