# Správa o presune testovaných položiek – KINO

| Položka | Hodnota |
|---|---|
| **Identifikátor** | TIR-KINO-001 |
| **Dátum** | 17. 11. 2026 |
| **Odovzdal / prevzal** | Bc. Bohdan Lynnyk (vývoj) / Bc. Bohdan Lynnyk (testovanie) |
| **Štandard** | IEEE 829-2008: Správa o presune testovaných položiek (*Level Test Item Transmittal Report*) |

## Odovzdané položky

| Položka | Verzia | Umiestnenie |
|---|---|---|
| Aplikácia KINO (doména, server, rozhranie) | 1.0.0, tag `v1.0-pred`, commit `6b25cf3` | `src/domain.js`, `server.js`, `public/` |
| Požiadavky | v1.0 (v1.1 po spresnení REQ-12) | `docs/00_Poziadavky.md` |
| Konfigurácia testovacích nástrojov | Stryker 8.7.1 | `package.json`, `package-lock.json`, `stryker.config.json` |

## Stav pri odovzdaní

- Aplikácia sa spúšťa príkazom `npm start` (http://127.0.0.1:3000), bez externých závislostí, Node.js 20 alebo novší.
- `npm run start:bug` spúšťa demo režim so zámernou chybou ceny VIP + dieťa. Nie je súčasťou odovzdanej verzie na prijatie (plán testov, kap. 2.3).
- Dáta sú v pamäti; po štarte sú v každom predstavení obsadené miesta A3, B6, E2, F7.
- Známe obmedzenia: jeden proces Node.js, bez platby a prihlásenia.

## Kontrola pri prevzatí

| Kontrola | Výsledok |
|---|---|
| `git log -1` zodpovedá tagu `v1.0-pred` | áno |
| `npm start` vypíše „normálny režim" a `GET /api/catalog` vráti 9 predstavení | áno |
| Po pridaní naivných testov (tag `v1.0-meranie-pred`) `npm test` prejde | 3 / 3 |

Zdrojový kód aplikácie sa počas testovania nemenil. Tag `v1.0-meranie-pred` pridáva naivné testy a meranie PRED, tag `v1.1-po` obsahuje ten istý kód s doplnenými testami a dokumentáciou.
