# Záznam o testovaní – KINO

| Položka | Hodnota |
|---|---|
| **Identifikátor** | LOG-KINO-001 |
| **Dátum** | 17. 11. 2026 |
| **Autor** | Bc. Bohdan Lynnyk, I-API |
| **Nadradené dokumenty** | Plán testov LTP-KINO-001, Opis testov LTD-KINO-001 v1.1 |
| **Štandard** | IEEE 829-2008: Záznam o testovaní (test log) |

Testovaný kód: aplikácia KINO 1.0.0, zdrojový kód `src/`, `server.js`, `public/` je od tagu `v1.0-pred` nezmenený. Menili sa iba testy a dokumentácia.

## 1. Prostredie

| | Automatické testy (PR-03, PR-04) | UI prípady (PR-02) |
|---|---|---|
| Stroj | MacBook, macOS | Linux kontajner (Claude) |
| Node.js | v22.23.4 | v22.23.4 |
| Prehliadač | – | Chromium 153.0.8010.12, Playwright 1.63.0, okno 1280 × 1000 |
| Nástroje | `node:test`, Stryker 8.7.1 | `tests/ui/pr02-ui-run.mjs` |

**Odchýlka od PR-02:** procedúra predpokladá ručné klikanie v Google Chrome. UI prípady boli vykonané skriptom, ktorý v Chromiu robí presne kroky z kariet (výber filtra, klik na sedadlo, zmena kategórie, tlačidlá) a číta texty zobrazené na stránke. Výhoda: rovnaký postup sa dá zopakovať jedným príkazom a ku každej kontrole je zaznamenaná očakávaná aj skutočná hodnota. Obmedzenie: skript nehodnotí vizuálny dojem (farby, rozloženie). Ten bol skontrolovaný na snímkach obrazovky.

## 2. Priebeh

| Beh | Čas (CET) | Commit | Čo | Výsledok | Výstup |
|---|---|---|---|---|---|
| RUN-01 | 17. 11. 13:55 | `30f9cbf` | PR-03, 1. cyklus: TC-01, 04, 05, 06, 07 (API), 09, 12, 15, 16, 17, 19, 20 | 36 / 36 kontrol PASS | `docs/merania/po-cyklus1/npm-test.txt` |
| RUN-02 | 17. 11. 14:00 | `30f9cbf` | PR-04, 1. cyklus: pokrytie a mutačné skóre | K4 68,27 % ✗, K5 88,57 % ✗ | `docs/merania/po-cyklus1/` |
| – | 17. 11. 14:05 | – | Analýza prežitých mutantov → doplnené TC-04, TC-19, TC-20, nový TC-21 (LTD v1.1) | – | `docs/03_Opis_testov.md` |
| RUN-03 | 17. 11. 14:15 | `a33834f` | PR-03, 2. cyklus: 13 automatických TC vrátane TC-21 | 56 / 56 kontrol PASS | `docs/merania/po/npm-test.txt` |
| RUN-04 | 17. 11. 14:15 | `a33834f` | PR-04, 2. cyklus | K4 89,96 % ✓, K5 92,31 % ✓ | `docs/merania/po/` |
| RUN-05 | 17. 11. 14:32 | `a33834f` | PR-02: TC-02, 03, 07 (UI), 08, 10, 11, 13, 14, 18 | 9 / 9 PASS, 64 kontrol | `docs/merania/po/ui/` |
| RUN-06 | 17. 11. 14:34 | `a33834f` | Kontrolný beh RUN-05 proti `npm run start:bug` | TC-07, TC-18 FAIL (očakávané) | tento záznam, kap. 4 |

## 3. Výsledky UI prípadov (RUN-05)

Pred každým prípadom bol spustený nový server (PR-01), takže prípady sa navzájom neovplyvňujú. Každý prípad začína kontrolou začiatočného stavu podľa PR-02 krok 2 (žiadny DEMO banner, vybrané 21. 10. 2026, 15:00 Sála 1).

| TC | Kontroly | Kľúčové pozorovanie | Výsledok | Snímka |
|---|---:|---|---|---|
| TC-02 | 6 | Do 18:00 → iba 15:00; Od 18:00 → 18:00 a 19:30; po zmene filtra vybraté 18:00, košík 0 / 6 | PASS | `TC-02.png` |
| TC-03 | 8 | Sála 2 + Do 18:00 → „Pre zvolené filtre nie je dostupné predstavenie.", 0 sedadiel; Všetky časy → 19:30 Nočná stanica, 48 sedadiel | PASS | `TC-03-krok3.png`, `TC-03.png` |
| TC-07 | 7 | A1 10,00 €, A2 študent 8,00 €, E1 dieťa 10,50 €; Spolu 28,50 €; 3 / 6 | PASS | `TC-07.png` |
| TC-08 | 6 | A1: 10,00 → 8,00 → 7,00 (nie 5,60) → 10,00 €; položka = Spolu v každom kroku | PASS | `TC-08.png` |
| TC-10 | 8 | prázdny výber → „Vyberte aspoň 1 vstupenku."; 6 miest → 6 / 6, 60,00 €; A8 → hlásenie o limite, nepridané | PASS | `TC-10.png` |
| TC-11 | 8 | obsadené A3, B6, E2, F7 vyzerajú inak ako voľné; klik na A3 → „Toto sedadlo je obsadené. Vyberte iné miesto.", 0 / 6 | PASS | `TC-11.png` |
| TC-13 | 7 | A1 + A2, potom 18:00 → 0 / 6, 0,00 €, súhrn „… 18:00 · Sála 1", nič označené | PASS | `TC-13.png` |
| TC-14 | 5 | A1 + A2 = 20,00 €; × pri A2 → 1 / 6, 10,00 €; klik na A1 → 0 / 6, 0,00 € | PASS | `TC-14.png` |
| TC-18 | 9 | potvrdenie „Výber je potvrdený. Spolu 20,50 €. Rezervácia ‹UUID›. Platba nebola vykonaná."; potom klik na A2, kategória a × bez účinku; nový výber → 0 / 6, A1 a E1 obsadené | PASS | `TC-18-krok2.png`, `TC-18.png` |

Všetky jednotlivé kontroly (krok, očakávaná a skutočná hodnota) sú v `docs/merania/po/ui/results.json`.

**Poznámka k TC-11:** obsadené sedadlo má atribút `aria-disabled="true"`, ale nie je `disabled`, takže používateľ naň môže kliknúť a dostane hlásenie. Skript preto overuje, že tlačidlo je klikateľné, a klik vykoná priamo (Playwright by na prvok s `aria-disabled` inak nekonečne čakal). Nejde o chybu aplikácie.

## 4. Kontrolný beh proti známej chybe (RUN-06)

Aby bolo zrejmé, že UI prípady chybu naozaj odhalia, ten istý skript bol spustený proti serveru v demo režime `--demo-vip-bug` (detská vstupenka vo VIP sa počíta zo základnej ceny Štandard):

| TC | Kontrola | Očakávané | Skutočné |
|---|---|---|---|
| TC-07 | položka E1 (VIP, dieťa) | 10,50 € | **7,00 €** |
| TC-07 | Spolu | 28,50 € | **25,00 €** |
| TC-18 | text potvrdenia | Spolu 20,50 € | **Spolu 17,00 €** |

Ostatných 7 prípadov prešlo, čo zodpovedá tomu, že chyba sa týka iba kombinácie VIP + dieťa. Odchýlka je zapísaná ako incident INC-001 (`07_Sprava_o_incidente_INC-001.md`) a uzavretá ako mimo rozsahu, lebo demo režim podľa plánu testov nie je prijímaná verzia. Rovnakú chybu odhalí aj automatický TC-05 (overené pri tvorbe automatických testov zapnutím `demoVipBug`).

## 5. Incidenty

Počas RUN-01 až RUN-05 (prijímaná verzia) nebol zaznamenaný žiadny FAIL. Kontrolný beh RUN-06 v demo režime vytvoril incident INC-001, ktorý bol uzavretý ako mimo rozsahu. Kritérium K2 (0 otvorených incidentov P1) je splnené.

## 6. Stav po vykonaní

| | Počet |
|---|---:|
| Testovacie prípady | 21 |
| PASS | 21 |
| FAIL / BLOCKED / NOT_RUN | 0 / 0 / 0 |
| Požiadavky s aspoň jedným PASS a bez otvoreného FAIL | 12 / 12 |

Výsledky sú zapísané aj v poli **Výsledok testu** v GitHub Project „KINO – Testovanie (KS)".
