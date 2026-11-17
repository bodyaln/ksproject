# Súhrnná správa o testovaní – KINO

| Položka | Hodnota |
|---|---|
| **Identifikátor** | STR-KINO-001 |
| **Verzia** | 1.0 |
| **Dátum** | 17. 11. 2026 |
| **Autor** | Bc. Bohdan Lynnyk, I-API |
| **Nadradené dokumenty** | Plán testov LTP-KINO-001 v1.1, Opis testov LTD-KINO-001 v1.1, Záznam o testovaní LOG-KINO-001 |
| **Štandard** | IEEE 829-2008: Súhrnná správa o testovaní (*Level Test Report*) |
| **Testovaná verzia** | KINO 1.0.0, kód nezmenený od tagu `v1.0-pred`; testy a dokumentácia: commit `86bd458` |

---

## 1. Zhrnutie

Modul KINO **spĺňa všetky kritériá prijatia K1 – K5** z plánu testov. Všetkých 21 testovacích prípadov prešlo, každá z 12 požiadaviek je overená a nebol zistený žiadny incident.

Hlavný prínos projektu nie je samotný výsledok PASS, ale **merateľný rozdiel oproti stavu bez plánu**. Pôvodné tri „naivné" testy tiež prechádzali a pokrývali 100 % riadkov `domain.js`, no zabili iba 35,74 % mutantov a úplne neoverili ani jednu požiadavku. Po zavedení postupu podľa IEEE 829 a dvoch cykloch testovania je mutačné skóre 89,96 % a overených je 12 z 12 požiadaviek.

| Metrika | PRED | PO (1. cyklus) | PO (2. cyklus) | Cieľ |
|---|---:|---:|---:|---:|
| Zapísané požiadavky | 0 | 12 | 12 | – |
| Testovacie prípady s väzbou na požiadavku | 0 | 20 | 21 | – |
| Automatické kontroly (`npm test`) | 3 | 36 | 56 | – |
| UI kontroly (PR-02) | 0 | – | 64 | – |
| Požiadavky dotknuté testom | 3 / 12 | 12 / 12 | 12 / 12 | – |
| Požiadavky overené úplne (K3) | **0 / 12** | – | **12 / 12** | 12 / 12 |
| Pokrytie vetiev `domain.js` (K5) | **62,07 %** | 88,57 % | **92,31 %** | ≥ 90 % |
| Pokrytie vetiev `server.js` | 38,10 % | 80,00 % | 97,14 % | – |
| Mutačné skóre spolu (K4) | **35,74 %** | 68,27 % | **89,96 %** | ≥ 75 % |
| – `src/domain.js` | 44,70 % | 81,82 % | 87,12 % | – |
| – `server.js` r. 1–74 | 25,64 % | 52,99 % | 93,16 % | – |
| Prežité mutanty | 160 | 79 | 25 | – |

Zdroje: `docs/merania/pred/`, `docs/merania/po-cyklus1/`, `docs/merania/po/`, `docs/04_Zaznam_o_testovani.md`.

---

## 2. Detaily

### 2.1 Výsledky podľa požiadaviek

| Požiadavka | Priorita | Testovacie prípady | Spôsob | Výsledok |
|---|---|---|---|---|
| REQ-01 Program | P2 | TC-01 | API | PASS |
| REQ-02 Filtre | P2 | TC-02, TC-03 | UI | PASS |
| REQ-03 Sála a zóny | P1 | TC-04 | jednotkový | PASS |
| REQ-04 Základná cena | P1 | TC-05, TC-06 | jednotkový, API | PASS |
| REQ-05 Zľavy | P1 | TC-05, TC-08 | jednotkový, UI | PASS |
| REQ-06 Výpočet sumy | P1 | TC-07, TC-08 | API + UI, UI | PASS |
| REQ-07 Limit 1 – 6 | P1 | TC-09, TC-10 | jednotkový + API, UI | PASS |
| REQ-08 Obsadené miesto | P1 | TC-11, TC-12 | UI, API | PASS |
| REQ-09 Zmena výberu | P2 | TC-13, TC-14 | UI | PASS |
| REQ-10 Konflikt rezervácie | P1 | TC-15, TC-16 | API | PASS |
| REQ-11 Potvrdenie | P1 | TC-17, TC-18 | API, UI | PASS |
| REQ-12 Validácia vstupov | P1 | TC-19, TC-20, TC-21 | jednotkový + API | PASS |

Spolu: 21 TC (16 × P1, 5 × P2), 21 PASS, 0 FAIL, 0 BLOCKED, 0 NOT_RUN. Výsledky sú zapísané aj v poli *Výsledok testu* v GitHub Project „KINO – Testovanie (KS)" a každý TC je *sub-issue* svojej požiadavky.

### 2.2 Celkové hodnotenie podľa kritérií prijatia

| # | Kritérium | Cieľ | Výsledok | Splnené |
|---|---|---|---|---|
| K1 | TC priority P1 s výsledkom PASS | 100 % | 16 / 16 = 100 % | áno |
| K2 | Otvorené incidenty P1 | 0 | 0 | áno |
| K3 | Požiadavky overené aspoň jedným PASS | 12 / 12 | 12 / 12 | áno |
| K4 | Mutačné skóre | ≥ 75 % | 89,96 % | áno (v 2. cykle) |
| K5 | Pokrytie vetiev `domain.js` | ≥ 90 % | 92,31 % | áno (v 2. cykle) |

**Odporúčanie:** modul v testovanej verzii prijať. Výhrady sú uvedené v kapitole 4.

### 2.3 Analýza prežitých mutantov (2. cyklus)

Plán testov (kap. 2.6) vyžaduje prežité mutanty zdôvodniť. Z 25 prežitých:

| Skupina | Počet | Miesto | Zdôvodnenie |
|---|---:|---|---|
| Demo režim `demoVipBug` | 9 | `domain.js` r. 44, `server.js` r. 40, 50 | podľa plánu mimo rozsahu (kap. 2.3) |
| Obsluha chyby 500 | 4 | `server.js` r. 65, 67 | pri správnom kóde nedosiahnuteľná, žiadny vstup ju nespustí |
| Texty katalógu (verzia, názvy filmov, žánre) | 8 | `domain.js` r. 1, 6 – 8 | REQ-01 ich nepredpisuje; medzera v požiadavke, nie v testoch |
| Ekvivalentné mutanty | 3 | `domain.js` r. 38, `server.js` r. 19 | zmena kódu nemení pozorovateľné správanie (nadbytočná kontrola typu, zahadzovanie dát nad limit) |
| Text hlásenia pri konflikte 409 | 1 | `domain.js` r. 58 | **skutočná medzera**: TC-15 a TC-16 overujú kód `SEAT_TAKEN`, nie text |

Bez demo režimu a nedosiahnuteľnej obsluhy chyby 500 (13 mutantov) je skóre 224 / 236 = **94,92 %**. Toto číslo slúži iba na interpretáciu; za kritérium K4 sa podľa plánu berie surové skóre 89,96 %.

### 2.4 Odchýlky od plánu a procedúr

| # | Odchýlka | Dôvod | Vplyv |
|---|---|---|---|
| O1 | **Druhý cyklus testovania**, ktorý plán nepredpokladal | po 1. cykle neboli splnené K4 (68,27 %) a K5 (88,57 %) | doplnené vstupy v TC-04, TC-19, TC-20 a nový TC-21; opis testov v1.1 |
| O2 | **REQ-12 spresnená** o nepodporovanú metódu a cestu | analýza mutantov ukázala správanie, ktoré požiadavka nepopisovala | požiadavky v1.1; zmena je zapísaná v histórii a v komentári k issue REQ-12 |
| O3 | **UI prípady vykonané skriptom** v Chromiu (Playwright), nie ručne v Chrome | prehliadač na počítači autora nemal prístup k serveru v pracovnom prostredí; skript je navyše opakovateľný | kroky a očakávané hodnoty sú totožné s kartami; skript nehodnotí vizuálny dojem, ten bol skontrolovaný na snímkach |
| O4 | **Harmonogram** v pláne (28. 10. – 19. 11.) nezodpovedá skutočnému priebehu | práce prebehli 16. – 17. 11. 2026 (história commitov, kap. 2.5) | poradie krokov (požiadavky → meranie PRED → plán → opis → vykonanie → meranie PO) bolo dodržané |
| O5 | Bez incidentov, takže **životný cyklus incidentu** (plán 3.6) nebol v praxi použitý | žiadny TC nezlyhal | citlivosť testov bola overená kontrolnými behmi so zámernou chybou (kap. 2.6) |

### 2.5 Súhrn činností

| Čas (CET) | Commit | Činnosť |
|---|---|---|
| 16. 11. 13:43 | `6b25cf3`, `7b7a390` | východiskový stav (tag `v1.0-pred`), spätné spísanie požiadaviek REQ-01 – 12 |
| 17. 11. 12:43 | `6600f28` | naivné testy a meranie PRED |
| 17. 11. 12:58 – 13:12 | `83ddc69`, `14a8543` | plán testov, opis testov (20 TC), issues a GitHub Project |
| 17. 11. 13:56 | `30f9cbf` | automatické testy 1. cyklu, meranie PO 1 |
| 17. 11. 14:26 | `a33834f` | 2. cyklus: analýza mutantov, TC-21, meranie PO 2 |
| 17. 11. 14:38 | `86bd458` | UI prípady (PR-02), záznam o testovaní |

Rozsah vytvoreného testovacieho kódu: 582 riadkov v `tests/` (pôvodne 38). Beh `npm test` trvá približne 0,3 s, mutačné testovanie približne 1 minútu, UI prípady približne 30 s.

### 2.6 Overenie citlivosti testov

Prechádzajúce testy samy o sebe nedokazujú, že by chybu našli. Preto boli testy spustené aj proti zámerne pokazenému kódu (na kópii, projekt nezmenený):

| Zavedená chyba | Odhalili ju |
|---|---|
| limit `> 6` zmenený na `>= 6` | TC-09 |
| zľava `100 - %` zmenená na `100 + %` | TC-05, TC-07, TC-17 |
| demo chyba VIP + dieťa (`--demo-vip-bug`) | TC-05 (automaticky), TC-07 a TC-18 (UI) |
| odstránená kontrola obsadenosti pred rezerváciou | TC-15, TC-16 a naivný test 3 |

Mutačné testovanie (Stryker) robí to isté systematicky pre 249 automaticky vytvorených chýb.

---

## 3. Zhodnotenie prínosu štandardu a nástrojov

### 3.1 IEEE 829-2008

| Prínos v projekte | Konkrétny dôkaz |
|---|---|
| Kritériá prijatia stanovené **pred** testovaním | K4 a K5 po 1. cykle neboli splnené; bez vopred daného cieľa by sa 1. cyklus pravdepodobne považoval za hotový |
| Vynútená sledovateľnosť požiadavka → TC → výsledok | stav PRED: 3 testy dotýkajúce sa 3 požiadaviek, žiadna overená úplne; stav PO: 12 / 12 |
| Jasné oddelenie *čo* (návrh), *ako* (prípady) a *akými krokmi* (procedúry) | rovnaká karta TC slúžila na automatický test, ručný postup aj skript Playwright |
| Záznam o testovaní s ID behu | odchýlky (2. cyklus, skriptované UI) sú zaznamenané a dohľadateľné, nie skryté |

| Náklad / slabina | Poznámka |
|---|---|
| Rozsah dokumentácie | pre modul s ~250 riadkami logiky vzniklo 5 dokumentov; plán bolo nutné prispôsobiť a zlúčiť sekcie |
| Zastaraná norma | IEEE 829-2008 bola nahradená ISO/IEC/IEEE 29119-3; štruktúra dokumentov je takmer rovnaká, preto prechod nie je náročný |
| Norma nehovorí *ako dobre* testovať | kvalitu testov neodhalí formulár, ale meranie (mutačné skóre, kontrolné behy) |

**Hodnotenie:** pre tento projekt bol štandard prínosný najmä vďaka kritériám prijatia a matici sledovateľnosti. Zvyšok dokumentácie má väčšiu hodnotu v tíme alebo pri dlhšie žijúcom produkte než pri jednom autorovi.

### 3.2 Nástroje

| Nástroj | Úloha | Prínos | Obmedzenie |
|---|---|---|---|
| GitHub Issues + Projects | evidencia požiadaviek, TC a výsledkov; sub-issues ako matica sledovateľnosti | zadarmo, viditeľné pre celý tím, tabuľa podľa výsledku | pole *Výsledok testu* sa nastavuje ručne, nie z výsledku `npm test` |
| `node:test` | jednotkové a API testy | bez závislostí, vstavaný v Node.js, rýchly | menej pohodlný výpis než Jest / Vitest |
| Pokrytie kódu (`--experimental-test-coverage`) | metrika K5 | rýchla spätná väzba | **zavádzajúce samo o sebe**: 100 % riadkov `domain.js` už v stave PRED |
| Stryker 8.7.1 | mutačné skóre K4 | **najväčší prínos**: ukázal slabé testy aj pri vysokom pokrytí a priamo naviedol 2. cyklus | beh ~1 min; časť mutantov je ekvivalentná a treba ich posúdiť ručne |
| Playwright | vykonanie UI prípadov | opakovateľné, so záznamom každej kontroly a snímkou | nenahrádza ľudské posúdenie vzhľadu |

---

## 4. Kritické zhodnotenie a obmedzenia

1. **Požiadavky boli spísané spätne z kódu.** Hrozí, že testy potvrdzujú implementáciu, nie zámer (riziko R7). Zmiernenie: očakávané hodnoty sa počítali ručne z tabuľky cien, nie z výstupu programu. Úplne ho však odstráni len zadanie napísané pred kódom.
2. **Jeden autor.** Požiadavky, testy aj hodnotenie robila tá istá osoba. Chýba nezávislé preskúmanie (review) testovacích prípadov.
3. **Spresnenie REQ-12 počas testovania** (O2) je metodicky citlivé. Bolo zapísané otvorene a týka sa správania, ktoré už kód mal; nejde o zmenu očakávania, aby test prešiel.
4. **Prehliadače.** UI bolo overené v Chromiu, nie v Safari ani Firefoxe (plán, riziko R6).
5. **Súbeh (TC-15, TC-16)** je overený pre jeden proces Node.js. Pri viacerých inštanciách servera alebo databáze by bol potrebný iný mechanizmus zámku a nové testy.
6. **Bez incidentov** nebol overený celý proces riadenia incidentov v praxi; citlivosť testov preukazujú iba kontrolné behy.
7. **Metriky závisia od konfigurácie.** Mutačné skóre je počítané pre `domain.js` a `server.js` r. 1 – 74; UI (`public/app.js`) do neho nevstupuje.

---

## 5. Odporúčania

### 5.1 Pre modul KINO

| # | Odporúčanie | Priorita | Odôvodnenie |
|---|---|---|---|
| D1 | V TC-15 a TC-16 overovať aj text hlásenia pri konflikte 409 | nízka | jediný prežitý mutant, ktorý je skutočnou medzerou |
| D2 | Odstrániť demo prepínač `demoVipBug` z produkčného kódu, chybu vkladať iba v teste | stredná | zámerná chyba v kóde je riziko; 9 prežitých mutantov |
| D3 | Ak sú názvy filmov dôležité, doplniť ich do REQ-01 a TC-01 | nízka | 8 prežitých mutantov v textoch katalógu |
| D4 | Pred nasadením na viac inštancií navrhnúť rezerváciu s databázovým zámkom a nové testy súbehu | vysoká pri škálovaní | TC-15 a 16 platia iba pre jeden proces |
| D5 | Rozšíriť PR-02 o Safari a Firefox (Playwright to podporuje bez zmeny skriptu) | stredná | riziko R6 |

### 5.2 Pre proces testovania („ako nerobiť chaos od začiatku")

| # | Odporúčanie | Ako |
|---|---|---|
| P1 | **Požiadavky s kritériom overenia pred kódom** | každá požiadavka ako issue s poľom „Kritérium overenia"; bez neho sa nezačína implementácia |
| P2 | **Kritériá prijatia s číslami v pláne** | aspoň pokrytie požiadaviek, mutačné skóre a počet otvorených incidentov P1, ako K1 – K5 |
| P3 | **Mutačné testovanie namiesto samotného pokrytia** | v `stryker.config.json` nastaviť `"thresholds": { "break": 75 }`, aby beh pod hranicou zlyhal |
| P4 | **Kontinuálna integrácia** | GitHub Actions: pri každom push `npm test` a pokrytie, raz denne Stryker a UI skript; výsledok automaticky do poľa *Výsledok testu* |
| P5 | **Šablóny issues** | `.github/ISSUE_TEMPLATE/` pre testovací prípad a incident s povinnými poliami (REQ, kroky, očakávané, skutočné) |
| P6 | **Názov testu = ID prípadu** | `TC-05 …`, vďaka čomu sa výstup `npm test` dá priamo priradiť ku karte |
| P7 | **Izolované testovacie dáta** | každý test vlastný server / databáza; zabraňuje závislosti medzi testami |
| P8 | **Review testovacích prípadov druhou osobou** | pred prvým behom; rieši obmedzenie 2 |
| P9 | **Štandard podľa veľkosti projektu** | pre malé projekty stačí plán + karty TC + záznam + správa (ISO/IEC/IEEE 29119-3 ako aktuálna norma); plnú sadu IEEE 829 ponechať pre väčšie alebo regulované projekty |

---

## 6. Schválenie

| Rola | Meno | Dátum | Rozhodnutie |
|---|---|---|---|
| Autor testovania | Bc. Bohdan Lynnyk | 17. 11. 2026 | modul prijať v testovanej verzii |

## História dokumentu

| Verzia | Dátum | Zmena |
|---|---|---|
| 1.0 | 17. 11. 2026 | Prvá verzia po 2. cykle a vykonaní UI prípadov |
