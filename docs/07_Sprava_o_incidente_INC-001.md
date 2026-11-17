# Správa o incidente INC-001

| Položka | Hodnota |
|---|---|
| **Identifikátor** | INC-001 |
| **Dátum** | 17. 11. 2026 |
| **Autor** | Bc. Bohdan Lynnyk, I-API |
| **Štandard** | IEEE 829-2008: Správa o incidente (*Level Test Incident Report*) |
| **Beh / prípady** | RUN-06 (kontrolný beh, `04_Zaznam_o_testovani.md`) · TC-07, TC-18 (UI), TC-05 (jednotkový) |
| **Testovaná položka** | KINO 1.0.0, commit `a33834f`, spustené `npm run start:bug` |
| **Priorita / závažnosť** | P1 / vysoká (nesprávna cena) |
| **Stav** | Closed – zamietnuté, mimo rozsahu |

## Opis

**Kroky:** 1. `npm run start:bug`. 2. Predstavenie 21. 10. 2026, 15:00, Sála 1. 3. Vybrať E1 (VIP) a kategóriu „Dieťa −30 %".

| | Očakávané (REQ-04, REQ-05) | Skutočné |
|---|---|---|
| E1, dieťa | 15,00 € × 70 % = **10,50 €** | **7,00 €** |
| TC-07: A1 dospelý + A2 študent + E1 dieťa | 28,50 € | 25,00 € |
| TC-18: potvrdenie A1 + E1 dieťa | „Spolu 20,50 €" | „Spolu 17,00 €" |
| TC-05 (jednotkový, `demoVipBug: true`) | 1050 centov | 700 centov |

**Príčina:** `src/domain.js`, r. 44 – v demo režime sa pre kombináciu VIP + dieťa použije základná cena Štandard (1000 namiesto 1500 centov).

## Rozhodnutie

Demo režim je podľa plánu testov (kap. 2.3) zámerne chybná konfigurácia, nie prijímaná verzia. V normálnom režime TC-05, TC-07 a TC-18 prechádzajú (RUN-03, RUN-05). Incident bol uzavretý ako mimo rozsahu; slúži ako dôkaz, že testy chybu ceny odhalia.

**Odporúčanie D2 (súhrnná správa):** odstrániť prepínač `demoVipBug` z produkčného kódu a chybu vkladať iba v teste.
