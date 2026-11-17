// Vykonanie manuálnych UI prípadov TC-02, 03, 07 (UI), 08, 10, 11, 13, 14, 18 podľa procedúry PR-02.
// Skript v Chromiu (Playwright) vykonáva presne kroky z kariet v docs/03_Opis_testov.md a porovnáva
// texty na obrazovke s očakávaným výstupom. Pred každým prípadom spustí čistý server (PR-01).
// Spustenie:  npm i -D playwright@1.63.0 && npx playwright install chromium
//             node tests/ui/pr02-ui-run.mjs docs/merania/po/ui
// Výstup: <výstupný priečinok>/results.json (všetky kontroly) a snímka obrazovky pre každý prípad.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.argv[2] || 'ui-out';
mkdirSync(OUT, { recursive: true });
const norm = s => (s ?? '').replace(/\s+/g, ' ').trim();
const results = [];
let port = 3100;

async function withApp(fn) {
  const p = ++port;
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(p) } });
  await new Promise(r => srv.stdout.once('data', r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, locale: 'sk-SK' });
  try {
    await page.goto(`http://127.0.0.1:${p}/`);
    await page.waitForSelector('[data-seat-id="A1"]');
    return await fn(page, browser.version());
  } finally { await browser.close(); srv.kill(); }
}

const ui = page => ({
  total: async () => norm(await page.textContent('#total')),
  count: async () => norm(await page.textContent('#count')),
  notice: async () => (await page.isHidden('#notice')) ? '' : norm(await page.textContent('#notice')),
  sessions: async () => page.$$eval('#sessions .session-time', els => els.map(e => e.textContent)),
  sessionsText: async () => norm(await page.textContent('#sessions')),
  summary: async () => norm(await page.textContent('#session-summary')),
  seat: id => page.click(`[data-seat-id="${id}"]`),
  price: async id => norm(await page.textContent(`[data-price-seat="${id}"]`)),
  settle: () => page.waitForFunction(() => !document.querySelector('#total').textContent.includes('…') && ![...document.querySelectorAll('[data-price-seat]')].some(e => e.textContent === '…')),
  selected: async () => page.$$eval('.seat[aria-pressed="true"]', els => els.map(e => e.dataset.seatId)),
  occupied: async () => page.$$eval('.seat', els => els.filter(e => e.getAttribute('aria-label').includes('obsadené')).map(e => e.dataset.seatId)),
  type: (id, value) => page.selectOption(`select[aria-label="Typ vstupenky ${id}"]`, value)
});

async function run(id, title, body) {
  const checks = [];
  const check = (step, expected, actual) => checks.push({ step, expected, actual, ok: norm(String(expected)) === norm(String(actual)) });
  let version = '';
  try {
    await withApp(async (page, v) => {
      version = v;
      const u = ui(page);
      // PR-02 krok 2: začiatočný stav
      check('PR-02/2 bez DEMO bannera', 'true', String(await page.isHidden('#mode-banner')));
      check('PR-02/2 predvolené predstavenie', 'Za horizontom · 21. 10. 2026 · 15:00 · Sála 1', await u.summary());
      await body(page, u, check);
      await page.screenshot({ path: `${OUT}/${id}.png`, fullPage: true });
    });
  } catch (e) { checks.push({ step: 'beh', expected: 'bez chyby', actual: e.message.split('\n')[0], ok: false }); }
  const ok = checks.every(c => c.ok);
  results.push({ id, title, result: ok ? 'PASS' : 'FAIL', checks, version });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${title}`);
  for (const c of checks) if (!c.ok) console.log(`   ✗ ${c.step}: očakávané „${c.expected}", skutočné „${c.actual}"`);
}

await run('TC-02', 'Hranica filtra 18:00', async (page, u, check) => {
  await page.fill('#date', '2026-10-21'); await page.selectOption('#hall', 'all');
  await page.selectOption('#time', 'afternoon');
  check('2 Do 18:00 → zobrazené časy', '15:00', (await u.sessions()).join(', '));
  await page.selectOption('#time', 'evening');
  check('3 Od 18:00 → zobrazené časy', '18:00, 19:30', (await u.sessions()).join(', '));
  check('následok: vybraté prvé predstavenie', 'Za horizontom · 21. 10. 2026 · 18:00 · Sála 1', await u.summary());
  check('následok: košík prázdny', '0 / 6', await u.count());
});

await run('TC-03', 'Kombinácia filtrov bez zhody', async (page, u, check) => {
  await page.fill('#date', '2026-10-21'); await page.selectOption('#hall', 'Sála 2');
  await page.selectOption('#time', 'afternoon');
  check('3 text bez zhody', 'Pre zvolené filtre nie je dostupné predstavenie.', await u.sessionsText());
  check('3 schéma sedadiel prázdna', '0', String((await page.$$('.seat')).length));
  check('3 súhrn', 'Zmeňte filtre a vyberte predstavenie.', await u.summary());
  await page.screenshot({ path: `${OUT}/TC-03-krok3.png`, fullPage: true });
  await page.selectOption('#time', 'all');
  check('4 zobrazené predstavenie', '19:30', (await u.sessions()).join(', '));
  check('4 súhrn', 'Nočná stanica · 21. 10. 2026 · 19:30 · Sála 2', await u.summary());
  await page.waitForSelector('[data-seat-id="A1"]');
  check('4 schéma má 48 miest', '48', String((await page.$$('.seat')).length));
});

await run('TC-07', 'Zmiešaný košík 28,50 € (UI časť)', async (page, u, check) => {
  await u.seat('A1'); await u.seat('A2'); await u.seat('E1');
  await u.type('A2', 'student'); await u.type('E1', 'child'); await u.settle();
  check('položka A1', '10,00 €', await u.price('A1'));
  check('položka A2', '8,00 €', await u.price('A2'));
  check('položka E1', '10,50 €', await u.price('E1'));
  check('Spolu', '28,50 €', await u.total());
  check('počítadlo', '3 / 6', await u.count());
});

await run('TC-08', 'Prepočet pri zmene kategórie', async (page, u, check) => {
  await u.seat('A1'); await u.settle();
  check('1 dospelý: položka / Spolu', '10,00 € / 10,00 €', `${await u.price('A1')} / ${await u.total()}`);
  for (const [step, type, exp] of [['2 študent', 'student', '8,00 €'], ['3 dieťa (nie 5,60 €)', 'child', '7,00 €'], ['4 dospelý', 'adult', '10,00 €']]) {
    await u.type('A1', type); await u.settle();
    check(`${step}: položka / Spolu`, `${exp} / ${exp}`, `${await u.price('A1')} / ${await u.total()}`);
  }
});

await run('TC-10', 'Siedme miesto v UI', async (page, u, check) => {
  await page.click('#reserve');
  check('1 hlásenie pri prázdnom výbere', 'Vyberte aspoň 1 vstupenku.', await u.notice());
  for (const s of ['A1', 'A2', 'A4', 'A5', 'A6', 'A7']) await u.seat(s);
  await u.settle();
  check('2 počítadlo', '6 / 6', await u.count());
  check('2 Spolu', '60,00 €', await u.total());
  await u.seat('A8');
  check('3 hlásenie', 'Maximálny počet vstupeniek na jedno predstavenie je 6.', await u.notice());
  check('3 A8 nepridané', 'false', String((await u.selected()).includes('A8')));
  check('3 počítadlo', '6 / 6', await u.count());
});

await run('TC-11', 'Klik na obsadené miesto', async (page, u, check) => {
  check('1 obsadené miesta', 'A3, B6, E2, F7', (await u.occupied()).join(', '));
  const bg = await page.$$eval('[data-seat-id="A3"], [data-seat-id="A1"]', els => els.map(e => getComputedStyle(e).backgroundColor + '|' + getComputedStyle(e).cursor));
  check('1 A3 vyzerá inak ako voľné A1', 'true', String(bg[0] !== bg[1]));
  const clickable = await page.$eval('[data-seat-id="A3"]', e => !e.disabled && getComputedStyle(e).pointerEvents !== 'none');
  check('2 A3 je klikateľné (nie disabled)', 'true', String(clickable));
  await page.click('[data-seat-id="A3"]', { force: true }); // aria-disabled: Playwright by inak čakal
  check('2 hlásenie', 'Toto sedadlo je obsadené. Vyberte iné miesto.', await u.notice());
  check('2 A3 nepridané', 'false', String((await u.selected()).includes('A3')));
  check('2 počítadlo', '0 / 6', await u.count());
});

await run('TC-13', 'Zmena predstavenia vymaže výber', async (page, u, check) => {
  await u.seat('A1'); await u.seat('A2'); await u.settle();
  check('1 počítadlo pred zmenou', '2 / 6', await u.count());
  await page.click('[data-session-id="s0-2"]');
  await page.waitForSelector('[data-seat-id="A1"]');
  check('2 počítadlo', '0 / 6', await u.count());
  check('2 Spolu', '0,00 €', await u.total());
  check('2 súhrn', 'Za horizontom · 21. 10. 2026 · 18:00 · Sála 1', await u.summary());
  check('2 A1, A2 neoznačené', '', (await u.selected()).join(', '));
});

await run('TC-14', 'Odstránenie miesta', async (page, u, check) => {
  await u.seat('A1'); await u.seat('A2'); await u.settle();
  check('1 Spolu', '20,00 €', await u.total());
  await page.click('button[aria-label="Odstrániť A2"]'); await u.settle();
  check('2 počítadlo / Spolu', '1 / 6 / 10,00 €', `${await u.count()} / ${await u.total()}`);
  await u.seat('A1'); await u.settle();
  check('3 počítadlo / Spolu', '0 / 6 / 0,00 €', `${await u.count()} / ${await u.total()}`);
});

await run('TC-18', 'Potvrdený výber je nemenný, nový výber', async (page, u, check) => {
  await u.seat('A1'); await u.seat('E1'); await u.type('E1', 'child'); await u.settle();
  await page.click('#reserve');
  await page.waitForSelector('#confirmation:not([hidden])');
  const conf = norm(await page.textContent('#confirmation'));
  const m = conf.match(/^Výber je potvrdený\. Spolu 20,50 €\. Rezervácia ([0-9a-f-]{36})\. Platba nebola vykonaná\.$/);
  check('2 potvrdenie (formát + UUID)', 'true', String(!!m));
  check('2 text potvrdenia', 'Výber je potvrdený. Spolu 20,50 €. Rezervácia ‹ID›. Platba nebola vykonaná.', conf.replace(/[0-9a-f-]{36}/, '‹ID›'));
  await page.screenshot({ path: `${OUT}/TC-18-krok2.png`, fullPage: true });
  await page.click('[data-seat-id="A2"]', { force: true });
  check('3 klik na A2 nič nezmenil', 'A1, E1 / 2 / 6', `${(await u.selected()).join(', ')} / ${await u.count()}`);
  check('3 výber kategórie A1 neaktívny', 'true', String(await page.isDisabled('select[aria-label="Typ vstupenky A1"]')));
  check('3 tlačidlo × neaktívne', 'true', String(await page.isDisabled('button[aria-label="Odstrániť A1"]')));
  await page.click('#new-selection');
  await page.waitForFunction(() => document.querySelector('[data-seat-id="A1"]')?.getAttribute('aria-label').includes('obsadené'));
  check('4 košík', '0 / 6 / 0,00 €', `${await u.count()} / ${await u.total()}`);
  const occ = await u.occupied();
  check('4 A1 a E1 obsadené', 'true', String(occ.includes('A1') && occ.includes('E1')));
});

writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
