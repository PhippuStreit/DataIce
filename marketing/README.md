# Marketing

## flyer-glacetruhe.html — A4

Aushang, der **auf der Glacetruhe** liegt. Wer hier scannt, ist schon am Ziel.

## flyer-a5-tisch.html — A5

Kärtchen für **Tische** im Raum. Sagt: Formular ausfüllen, dann zur Glacetruhe
gehen und den generierten QR-Code vorzeigen.

Beide: QR-Code zeigt auf `https://data.digidude.ch`. Fertige PDFs liegen daneben
(`*.pdf`), erzeugt mit `./build-pdf.sh`.

**Drucken:** Datei im Browser öffnen → „Als PDF drucken" (oder Cmd/Strg+P).
Format **A4** bzw. **A5**, Skalierung **100 %**, Ränder **keine**.

QR-Code neu erzeugen (falls Domain ändert):

```bash
node -e "require('qrcode').toString('https://NEUE-DOMAIN', {type:'svg',margin:0}, (e,s)=>console.log(s))"
```

Danach das `<svg …viewBox="0 0 25 25"…>` im `.qr`-Block ersetzen.
