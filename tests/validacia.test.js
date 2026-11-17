// TC-19, TC-20 (REQ-12) – neplatné vstupy sa odmietnu bez chyby servera a bez zmeny obsadenosti.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuote, validateSession } from '../src/domain.js';
import { withServer, post, get, occupiedSeats, adult, INITIAL_OCCUPIED } from './helpers.js';

const initial = [...INITIAL_OCCUPIED].sort();

describe('TC-19 Neexistujúce predstavenie, sedadlo, kategória (REQ-12)', () => {
  test('jednotkový: neplatné hodnoty vyhodia DomainError', () => {
    assert.throws(() => validateSession('s9-9'), { status: 404, message: 'Predstavenie neexistuje.' });
    assert.throws(() => calculateQuote([{ seatId: 'Z9', type: 'adult' }]), { status: 400, message: 'Sedadlo neexistuje.' });
    assert.throws(() => calculateQuote([{ seatId: 'A1', type: 'senior' }]), { status: 400, message: 'Neplatný typ vstupenky.' });
  });

  const cases = [
    ['a) sessionId s9-9', { sessionId: 's9-9', tickets: adult('A1') }, 404, 'Predstavenie neexistuje.'],
    ['b) seatId Z9', { sessionId: 's0-1', tickets: adult('Z9') }, 400, 'Sedadlo neexistuje.'],
    ['c) type senior', { sessionId: 's0-1', tickets: [{ seatId: 'A1', type: 'senior' }] }, 400, 'Neplatný typ vstupenky.']
  ];
  for (const [name, body, status, error] of cases) {
    test(`API: ${name}`, async () => {
      await withServer(async base => {
        const res = await post(base, '/api/reservations', body);
        assert.equal(res.status, status);
        assert.equal(res.body.error, error);
        assert.deepEqual(await occupiedSeats(base, 's0-1'), initial);
      });
    });
  }
  test('API: d) GET /api/seats/s9-9 → 404', async () => {
    await withServer(async base => {
      const res = await get(base, '/api/seats/s9-9');
      assert.equal(res.status, 404);
    });
  });
});

describe('TC-20 Duplicita, neplatný JSON, veľké telo (REQ-12)', () => {
  const cases = [
    ['a) A1 dvakrát', { sessionId: 's0-1', tickets: adult('A1', 'A1') }, 400, 'Sedadlo nemožno vybrať dvakrát.'],
    ['b) neplatný JSON', '{nie je json', 400, 'Neplatný JSON.'],
    ['c) telo > 16 384 B', JSON.stringify({ sessionId: 's0-1', tickets: adult('A1'), pad: 'x'.repeat(17000) }), 413, 'Požiadavka je príliš veľká.'],
    ['d) tickets nie je pole', { sessionId: 's0-1', tickets: 'A1' }, 400, 'Neplatný zoznam vstupeniek.']
  ];
  for (const [name, body, status, error] of cases) {
    test(name, async () => {
      await withServer(async base => {
        const res = await post(base, '/api/reservations', body);
        assert.equal(res.status, status);
        assert.equal(res.body.error, error);
        assert.deepEqual(await occupiedSeats(base, 's0-1'), initial);
      });
    });
  }
});
