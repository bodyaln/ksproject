# KINO

Výber predstavenia, sedadiel a kategórie vstupenky s výpočtom ceny a potvrdením rezervácie bez platby.

Požiadavky: Node.js 20 alebo novší, bez externých závislostí.

```bash
npm start          # http://127.0.0.1:3000
npm run start:bug  # demo režim so zámernou chybou ceny VIP / dieťa

npm install            # iba pre mutačné testovanie (Stryker)
npm test               # automatické testy
npm run test:coverage  # pokrytie kódu
npm run test:mutation  # mutačné skóre (Stryker)

npm i -D playwright@1.63.0 && npx playwright install chromium
node tests/ui/pr02-ui-run.mjs docs/merania/po/ui   # UI prípady (PR-02)
```

Stav PRED: tag `v1.0-meranie-pred`, stav PO: tag `v1.1-po`. Dokumentácia projektu: `Lynnyk_KSS_Tema16_dokumentacia.pdf`.

Iný port: `PORT=3001 npm start`. Reštart servera vymaže rezervácie.

- `src/domain.js` – ceny, zľavy, limity, kontrola dostupnosti
- `server.js` – HTTP server a API (`/api/quote`, `/api/reservations`)
- `public/` – používateľské rozhranie
- `tests/` – automatické testy (`node:test`)
- `docs/` – požiadavky, merania a testovacia dokumentácia
