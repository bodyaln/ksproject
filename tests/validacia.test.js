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
    assert.throws(() => calculateQuote([null]), { status: 400, code: 'INVALID_INPUT', message: 'Neplatná vstupenka.' });
    assert.throws(() => calculateQuote(['A1']), { status: 400, code: 'INVALID_INPUT', message: 'Neplatná vstupenka.' });
  });

  const cases = [
    ['a) sessionId s9-9', { sessionId: 's9-9', tickets: adult('A1') }, 404, 'SESSION_NOT_FOUND', 'Predstavenie neexistuje.'],
    ['b) seatId Z9', { sessionId: 's0-1', tickets: adult('Z9') }, 400, 'INVALID_INPUT', 'Sedadlo neexistuje.'],
    ['c) type senior', { sessionId: 's0-1', tickets: [{ seatId: 'A1', type: 'senior' }] }, 400, 'INVALID_INPUT', 'Neplatný typ vstupenky.'],
    ['e) vstupenka null', { sessionId: 's0-1', tickets: [null] }, 400, 'INVALID_INPUT', 'Neplatná vstupenka.']
  ];
  for (const [name, body, status, code, error] of cases) {
    test(`API: ${name}`, async () => {
      await withServer(async base => {
        const res = await post(base, '/api/reservations', body);
        assert.equal(res.status, status);
        assert.equal(res.body.code, code);
        assert.equal(res.body.error, error);
        assert.deepEqual(await occupiedSeats(base, 's0-1'), initial);
      });
    });
  }
  test('API: d) GET /api/seats/s9-9 → 404', async () => {
    await withServer(async base => {
      const res = await get(base, '/api/seats/s9-9');
      assert.equal(res.status, 404);
      assert.equal(res.body.code, 'SESSION_NOT_FOUND');
    });
  });
});

describe('TC-20 Duplicita, neplatný JSON, veľké telo (REQ-12)', () => {
  const cases = [
    ['a) A1 dvakrát', { sessionId: 's0-1', tickets: adult('A1', 'A1') }, 400, 'Sedadlo nemožno vybrať dvakrát.'],
    ['b) neplatný JSON', '{nie je json', 400, 'Neplatný JSON.'],
    ['c) telo > 16 384 B', JSON.stringify({ sessionId: 's0-1', tickets: adult('A1'), pad: 'x'.repeat(17000) }), 413, 'Požiadavka je príliš veľká.'],
    ['d) tickets nie je pole', { sessionId: 's0-1', tickets: 'A1' }, 400, 'Neplatný zoznam vstupeniek.'],
    ['e) telo presne 16 385 B', padTo({ sessionId: 's0-1', tickets: adult('A1') }, 16385), 413, 'Požiadavka je príliš veľká.'],
    ['f) telo je pole []', '[]', 400, 'Neplatný JSON.'],
    ['g) telo je null', 'null', 400, 'Neplatný JSON.'],
    ['h) telo je číslo', '42', 400, 'Neplatný JSON.']
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
  test('i) telo presne 16 384 B je ešte prijaté', async () => {
    await withServer(async base => {
      const body = padTo({ sessionId: 's0-1', tickets: adult('A1') }, 16384);
      assert.equal(Buffer.byteLength(body), 16384);
      const res = await post(base, '/api/reservations', body);
      assert.equal(res.status, 201);
    });
  });
});

// Doplní JSON objekt poľom „pad" na presnú veľkosť v bajtoch (hranica 16 384 B).
function padTo(obj, bytes) {
  const empty = JSON.stringify({ ...obj, pad: '' });
  return JSON.stringify({ ...obj, pad: 'x'.repeat(bytes - Buffer.byteLength(empty)) });
}
