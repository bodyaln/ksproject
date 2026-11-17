# Požiadavky na testovaný modul KINO

**ID dokumentu:** REQ-KINO · **Verzia:** 1.0 · **Autor:** Bc. Bohdan Lynnyk, I-API · **Stav:** návrh

## Účel a rozsah

Dokument opisuje, ako sa má správať modul KINO: výber predstavenia, výber sedadiel, kategória vstupenky, výpočet ceny a potvrdenie rezervácie bez platby. Požiadavky sú základom pre plán testov, testovacie prípady a maticu sledovateľnosti. Očakávané výsledky testov sa odvodzujú z tohto dokumentu, nie z výstupu aplikácie.

**Východiskový stav:** pred vznikom tohto dokumentu požiadavky neboli nikde zapísané. Pravidlá existovali iba implicitne v zdrojovom kóde (`src/domain.js`, `server.js`, `public/app.js`). Táto verzia ich spätne zachytáva z kódu a pomenúva.

**Mimo rozsahu:** platba, registrácia a prihlásenie, overenie nároku na zľavu (preukaz, vek), storno, administrácia programu, databáza, viac serverových procesov, záťaž a bezpečnostné testovanie.

## Požiadavky

| ID | Názov | Požiadavka | Kritérium overenia | Priorita |
|---|---|---|---|---|
| REQ-01 | Program | Program obsahuje 9 predstavení v dňoch 21.–23. 10. 2026: každý deň 15:00 a 18:00 v Sále 1, 19:30 v Sále 2. | Katalóg `/api/catalog` vráti 9 predstavení s uvedenými dátumami, časmi a sálami. | P2 |
| REQ-02 | Filtre | Filtre dátumu, času a sály sa uplatňujú súčasne. „Do 18:00" znamená čas < 18:00, „Od 18:00" znamená čas ≥ 18:00. Ak žiadne predstavenie nevyhovuje, zobrazí sa oznam „Pre zvolené filtre nie je dostupné predstavenie." a výber miest nie je dostupný. | Predstavenie 18:00 patrí do „Od 18:00"; kombinácia bez zhody zobrazí oznam a prázdnu schému. | P2 |
| REQ-03 | Sála a zóny | Každé predstavenie má 48 sedadiel A1–F8. Rady A–D sú zóna Štandard, rady E–F zóna VIP. | Schéma obsahuje 6 radov po 8 miest; A1 je Štandard, E1 je VIP. | P1 |
| REQ-04 | Základná cena | Štandard stojí 10,00 EUR, VIP 15,00 EUR. Zónu aj cenu určuje server podľa ID sedadla; údaj poslaný klientom ich nemení. | A1 / dospelý = 10,00 EUR; E1 / dospelý = 15,00 EUR; podvrhnutá cena v požiadavke sa ignoruje. | P1 |
| REQ-05 | Zľavy | Dospelý platí 100 %, študent 80 %, dieťa 70 % ceny svojej zóny. Každá vstupenka má práve jednu kategóriu, zľavy sa nekombinujú. Predvolená kategória je Dospelý. | Všetkých 6 kombinácií zóna × kategória dáva ceny z tabuľky nižšie. | P1 |
| REQ-06 | Výpočet sumy | Sumy sa počítajú v celých centoch; cena lístka sa zaokrúhli na cent, celková suma je súčet cien lístkov. Pri zmene kategórie, pridaní alebo odstránení miesta sa suma prepočíta. | Košík A1 dospelý + A2 študent + E1 dieťa = 10,00 + 8,00 + 10,50 = 28,50 EUR. | P1 |
| REQ-07 | Limit vstupeniek | Jedna rezervácia obsahuje 1 až 6 rôznych miest jedného predstavenia. Pri 0 miestach: „Vyberte aspoň 1 vstupenku." Siedme miesto sa nepridá: „Maximálny počet vstupeniek na jedno predstavenie je 6." Limit platí v UI aj v API. | 0 → chyba; 1 a 6 → OK; 7 → odmietnuté v UI aj cez API (HTTP 400). | P1 |
| REQ-08 | Obsadené miesto | Obsadené miesto nemožno vybrať; kliknutie zobrazí „Toto sedadlo je obsadené. Vyberte iné miesto." Na začiatku sú obsadené A3, B6, E2, F7. Obsadenosť je samostatná pre každé predstavenie. | Klik na A3 nepridá miesto; A1 rezervované v s0-1 zostáva voľné v s0-2. | P1 |
| REQ-09 | Zmena výberu | Zmena predstavenia alebo filtrov vymaže rozpracovaný výber. Opätovný klik na vybrané miesto alebo tlačidlo × miesto odstráni. | Po zmene predstavenia je košík 0 / 6 a suma 0,00 EUR. | P2 |
| REQ-10 | Konflikt rezervácie | Pri potvrdení server znovu overí všetky miesta. Ak je niektoré už obsadené, vráti HTTP 409 a nerezervuje ani voľné miesta z toho istého košíka. Z dvoch klientov s rovnakým miestom uspeje iba prvý. | Dve karty s A1: prvá 201, druhá 409; pri košíku A1+A2 a obsadenom A1 zostane A2 voľné. | P1 |
| REQ-11 | Potvrdenie | Úspešné potvrdenie vráti identifikátor rezervácie, celkovú sumu a stav bez platby („reserved-unpaid"). Potvrdený výber sa už nedá meniť; „Začať nový výber" začne nový košík. | Po potvrdení sa zobrazí ID a suma, miesta sú obsadené, sedadlá a kategórie sú neaktívne. | P1 |
| REQ-12 | Validácia vstupov API | Neexistujúce predstavenie (404), neexistujúce sedadlo, neznáma kategória, duplicitné sedadlo, neplatný JSON a telo nad 16 kB server odmietne chybou 4xx, nie 500, a obsadenosť sa nezmení. | Každý chybný vstup vráti 4xx s textom chyby; obsadenosť zostane rovnaká. | P1 |

## Rozhodovacia tabuľka cien (REQ-04, REQ-05)

| Zóna | Dospelý | Študent −20 % | Dieťa −30 % |
|---|---|---|---|
| Štandard (10,00 EUR) | 10,00 EUR | 8,00 EUR | 7,00 EUR |
| VIP (15,00 EUR) | 15,00 EUR | 12,00 EUR | 10,50 EUR |

Vzorec: `cena_lístka = round(základ_v_centoch × (100 − zľava) / 100)`, `spolu = súčet(cena_lístka)`.

## Testovacie dáta a obmedzenia prototypu

- Predstavenia: `sN-1` 15:00 Sála 1 „Za horizontom", `sN-2` 18:00 Sála 1 „Za horizontom", `sN-3` 19:30 Sála 2 „Nočná stanica"; N = 0, 1, 2 pre 21., 22., 23. 10. 2026.
- Obsadenosť je v pamäti jedného serverového procesu; reštart servera obnoví východiskový stav (obsadené A3, B6, E2, F7).
- Rozpracovaný výber miesto dočasne neblokuje; obsadenosť sa obnoví tlačidlom „Obnoviť obsadenosť" alebo zmenou predstavenia.
- Režim `npm run start:bug` zámerne porušuje REQ-05 pre VIP / dieťa (7,00 EUR namiesto 10,50 EUR). Slúži iba na nácvik zápisu incidentu a nie je prijímanou konfiguráciou.

## Zdroj v kóde

| ID | Kde je pravidlo implementované |
|---|---|
| REQ-01 | `src/domain.js` – `DATES`, `SESSIONS` |
| REQ-02 | `public/app.js` – `renderSessions()` |
| REQ-03 | `src/domain.js` – `SEATS` |
| REQ-04, REQ-05, REQ-06 | `src/domain.js` – `PRICES`, `DISCOUNTS`, `calculateQuote()`; `public/app.js` – `updateQuote()` |
| REQ-07 | `src/domain.js` – `calculateQuote()`; `public/app.js` – klik na sedadlo, tlačidlo Potvrdiť |
| REQ-08 | `src/domain.js` – `createInventory()`, `checkAvailability()`; `public/app.js` – `renderSeats()` |
| REQ-09 | `public/app.js` – `loadSession()`, filtre, tlačidlo × |
| REQ-10 | `server.js` – `/api/reservations`; `src/domain.js` – `checkAvailability()` |
| REQ-11 | `server.js` – `/api/reservations`; `public/app.js` – tlačidlo Potvrdiť, Nový výber |
| REQ-12 | `server.js` – `jsonBody()`, `validateSession()`; `src/domain.js` – `calculateQuote()` |

## História

| Verzia | Dátum | Zmena |
|---|---|---|
| 1.0 | 16. 11. 2026 | Prvé spísanie požiadaviek spätne zo zdrojového kódu. |
