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
```

Iný port: `PORT=3001 npm start`. Reštart servera vymaže rezervácie.

- `src/domain.js` – ceny, zľavy, limity, kontrola dostupnosti
- `server.js` – HTTP server a API (`/api/quote`, `/api/reservations`)
- `public/` – používateľské rozhranie
- `tests/` – automatické testy (`node:test`)
- `docs/` – požiadavky, merania a testovacia dokumentácia
