// TC-09 (REQ-07) – hranice počtu lístkov na jednotkovej úrovni aj cez API.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuote } from '../src/domain.js';
import { withServer, post, adult } from './helpers.js';

const SIX = ['A1', 'A2', 'A4', 'A5', 'A6', 'A7'];
const cases = [
  { n: 0, seats: [], code: 'MIN_TICKETS', error: 'Vyberte aspoň 1 vstupenku.' },
  { n: 1, seats: ['A1'], total: 1000 },
  { n: 6, seats: SIX, total: 6000 },
  { n: 7, seats: [...SIX, 'A8'], code: 'MAX_TICKETS', error: 'Maximálny počet vstupeniek na jedno predstavenie je 6.' }
];

describe('TC-09 Hranice počtu lístkov 0 / 1 / 6 / 7 (REQ-07)', () => {
  for (const c of cases) {
    test(`jednotkový: ${c.n} lístkov`, () => {
      if (c.code) {
        assert.throws(() => calculateQuote(adult(...c.seats)), { status: 400, code: c.code, message: c.error });
      } else {
        assert.equal(calculateQuote(adult(...c.seats)).totalCents, c.total);
      }
    });
    test(`API: ${c.n} lístkov`, async () => {
      await withServer(async base => {
        const { status, body } = await post(base, '/api/quote', { sessionId: 's0-1', tickets: adult(...c.seats) });
        if (c.code) {
          assert.equal(status, 400);
          assert.equal(body.code, c.code);
          assert.equal(body.error, c.error);
        } else {
          assert.equal(status, 200);
          assert.equal(body.totalCents, c.total);
        }
      });
    });
  }
});
