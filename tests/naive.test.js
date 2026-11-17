// Východiskové („naivné") testy pred zavedením plánu testov.
// Napísané bez techník návrhu testov a bez väzby na požiadavky – slúžia ako stav PRED.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuote } from '../src/domain.js';
import { createApp } from '../server.js';

async function withServer(fn) {
  const server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { server.close(); }
}

test('dospelý lístok v štandardnej zóne stojí 10 EUR', () => {
  const quote = calculateQuote([{ seatId: 'A1', type: 'adult' }]);
  assert.equal(quote.totalCents, 1000);
});

test('rezervácia voľného miesta prejde', async () => {
  await withServer(async base => {
    const res = await fetch(`${base}/api/reservations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 's0-1', tickets: [{ seatId: 'A1', type: 'adult' }] })
    });
    assert.equal(res.status, 201);
  });
});

test('obsadené miesto sa nedá rezervovať', async () => {
  await withServer(async base => {
    const res = await fetch(`${base}/api/reservations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 's0-1', tickets: [{ seatId: 'A3', type: 'adult' }] })
    });
    assert.equal(res.status, 409);
  });
});
