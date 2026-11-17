// TC-21 (REQ-12) – smerovanie požiadaviek: nepodporovaná metóda alebo cesta, hlavičky odpovedí.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { withServer, adult, occupiedSeats, INITIAL_OCCUPIED } from './helpers.js';

const request = (base, method, path, body) => fetch(base + path, {
  method,
  headers: body ? { 'Content-Type': 'application/json' } : undefined,
  body: body ? JSON.stringify(body) : undefined
});

describe('TC-21 Nepodporovaná metóda a cesta, hlavičky odpovedí (REQ-12)', () => {
  const notFound = [
    ['a) GET /api/reservations', 'GET', '/api/reservations'],
    ['b) GET /api/quote', 'GET', '/api/quote'],
    ['c) POST /api/catalog', 'POST', '/api/catalog', {}],
    ['d) POST /api/seats/s0-1', 'POST', '/api/seats/s0-1', {}],
    ['e) DELETE /api/reservations', 'DELETE', '/api/reservations'],
    ['f) GET /neexistuje', 'GET', '/neexistuje'],
    ['g) POST / (stránka)', 'POST', '/', {}],
    ['h) GET /api/catalog/x', 'GET', '/api/catalog/x']
  ];
  for (const [name, method, path, body] of notFound) {
    test(`${name} → 404 NOT_FOUND`, async () => {
      await withServer(async base => {
        const res = await request(base, method, path, body);
        assert.equal(res.status, 404);
        assert.match(res.headers.get('content-type'), /^application\/json/);
        assert.deepEqual(await res.json(), { error: 'Stránka neexistuje.', code: 'NOT_FOUND' });
      });
    });
  }

  test('i) POST na nepodporovanú cestu nič nerezervuje', async () => {
    await withServer(async base => {
      await request(base, 'POST', '/api/seats/s0-1', { sessionId: 's0-1', tickets: adult('A1') });
      assert.deepEqual(await occupiedSeats(base, 's0-1'), [...INITIAL_OCCUPIED].sort());
    });
  });

  test('j) POST /api/quote iba počíta, nerezervuje', async () => {
    await withServer(async base => {
      const res = await request(base, 'POST', '/api/quote', { sessionId: 's0-1', tickets: adult('A1') });
      assert.equal(res.status, 200);
      assert.deepEqual(await occupiedSeats(base, 's0-1'), [...INITIAL_OCCUPIED].sort());
    });
  });

  test('k) odpoveď API: JSON, Cache-Control no-store', async () => {
    await withServer(async base => {
      const res = await request(base, 'GET', '/api/catalog');
      assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
      assert.equal(res.headers.get('cache-control'), 'no-store');
    });
  });

  const assets = [
    ['/', 'text/html; charset=utf-8', '<!doctype html'],
    ['/styles.css', 'text/css; charset=utf-8', null],
    ['/app.js', 'text/javascript; charset=utf-8', null]
  ];
  for (const [path, type, start] of assets) {
    test(`l) GET ${path} → 200 ${type.split(';')[0]}`, async () => {
      await withServer(async base => {
        const res = await request(base, 'GET', path);
        assert.equal(res.status, 200);
        assert.equal(res.headers.get('content-type'), type);
        assert.equal(res.headers.get('cache-control'), 'no-store');
        assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
        const text = await res.text();
        assert.ok(text.length > 0);
        if (start) assert.ok(text.toLowerCase().startsWith(start), 'HTML stránka');
      });
    });
  }
});
