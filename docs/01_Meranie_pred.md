# Meranie východiskového stavu (PRED)

**ID:** MER-PRED · **Dátum:** 17. 11. 2026 · **Autor:** Bc. Bohdan Lynnyk, I-API · **Build:** KINO 1.0.0 (tag `v1.0-pred`)

## Účel

Zachytiť kvalitu testovania pred zavedením plánu testov podľa IEEE 829. Rovnaké merania sa zopakujú po vykonaní plánu (stav PO) a výsledky sa porovnajú.

## Východiskový stav

- Požiadavky neboli zapísané; spätne zachytené v `docs/00_Poziadavky.md` (REQ-01 až REQ-12).
- Testy: 3 „naivné" automatické testy v `tests/naive.test.js`, napísané bez techník návrhu testov a bez väzby na požiadavky:
  1. dospelý lístok v zóne Štandard stojí 10 EUR,
  2. rezervácia voľného miesta vráti HTTP 201,
  3. rezervácia obsadeného miesta A3 vráti HTTP 409.
- Žiadny plán testov, testovacie prípady, záznamy o vykonaní ani evidencia incidentov.

## Prostredie a postup

Node.js v22.23.4, Stryker 8.7.1 (`@stryker-mutator/core`), testovací rámec `node:test`.

```bash
npm install
npm test                 # 3 testy
npm run test:coverage    # pokrytie kódu (vstavané v Node.js)
npm run test:mutation    # mutačné testovanie (Stryker, konfigurácia stryker.config.json)
```

Konfigurácia Strykera: test runner `command` (`node --test tests/*.test.js`), mutované súbory `src/domain.js` a `server.js` riadky 1–74. Riadky 76–89 `server.js` (spustenie servera a výpis do konzoly) sú vylúčené: nie sú súčasťou testovaného správania a ich mutanty (napr. zmena textu v `console.log`) by skresľovali skóre. Používateľské rozhranie `public/app.js` sa automatickými testami nemeria; overí sa manuálnymi testovacími prípadmi.

## Výsledky

### Vykonanie testov

| Testy | PASS | FAIL |
|---|---:|---:|
| `tests/naive.test.js` | 3 | 0 |

### Pokrytie požiadaviek

| Metrika | Hodnota |
|---|---|
| Požiadavky dotknuté aspoň jedným testom | 3 / 12 (25 %) – REQ-04, REQ-08, REQ-11 |
| Požiadavky overené úplne podľa kritéria overenia | 0 / 12 (0 %) |

REQ-04 je overená len pre Štandard/dospelý (chýba VIP a podvrhnutá cena), REQ-08 len cez API (chýba UI a oddelenie predstavení), REQ-11 len stavom 201 (chýba ID, suma, stav bez platby).

### Pokrytie kódu (`npm run test:coverage`)

| Súbor | Riadky | Vetvy | Funkcie |
|---|---:|---:|---:|
| `src/domain.js` | 100,00 % | 62,07 % | 100,00 % |
| `server.js` | 68,54 % | 38,10 % | 62,50 % |

Úplný výstup: `docs/merania/pred/coverage.txt`.

### Mutačné skóre (`npm run test:mutation`)

| Súbor | Mutanty | Zabité | Timeout | Prežili | Mutačné skóre |
|---|---:|---:|---:|---:|---:|
| `src/domain.js` | 132 | 59 | 0 | 73 | 44,70 % |
| `server.js` (r. 1–74) | 117 | 25 | 5 | 87 | 25,64 % |
| **Spolu** | **249** | **84** | **5** | **160** | **35,74 %** |

Mutačné skóre = (zabité + timeout) / všetky mutanty. Úplná správa: `docs/merania/pred/mutation.html` (otvoriť v prehliadači), dáta `mutation.json`.

### Príklady prežitých mutantov v `src/domain.js`

| Riadok | Pôvodný kód | Mutant | Čo to znamená |
|---|---|---|---|
| 45 | `(100 - discountPercent)` | `(100 + discountPercent)` | Žiadny test neoveruje zľavu – študent by platil 12 EUR namiesto 8 EUR a testy by prešli. |
| 32 | `tickets.length > 6` | `tickets.length >= 6` | Hranica limitu 6 nie je testovaná – zakázalo by sa už 6 lístkov. |
| 31 | `tickets.length === 0` → chyba | podmienka `false` | Prázdny košík sa netestuje. |
| 11 | `i < 4` (rady A–D Štandard) | `i <= 4` | Rad E by bol Štandard – VIP zóna nie je testovaná. |
| 38 | kontrola kategórie | podmienka `false` | Neznáma kategória lístka by prešla. |
| 39 | kontrola duplicitného sedadla | podmienka `false` | Dvakrát to isté miesto v jednej požiadavke by prešlo. |

## Interpretácia

Pokrytie riadkov `domain.js` je 100 %, napriek tomu prežilo 73 zo 132 mutantov. Tri testy kód spustia, ale takmer nič neoverujú: neskúmajú zľavy, VIP zónu, hranice limitu ani neplatné vstupy. Samotné pokrytie riadkov preto nie je dostatočným meradlom kvality testov; mutačné skóre a pokrytie požiadaviek ukazujú skutočný stav.

Časť prežitých mutantov tvoria `StringLiteral` mutácie textov chybových hlásení (39 v `domain.js`, 31 v `server.js`). Pri vyhodnotení v stave PO sa rozlíši, ktoré sú skutočné medzery v testoch a ktoré sú bez vplyvu na správanie (napr. vetva demo režimu `demoVipBug`, ktorú normálna konfigurácia nepoužíva).
