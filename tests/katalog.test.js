// TC-01 (REQ-01) – katalóg predstavení.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withServer, get } from './helpers.js';

test('TC-01 Katalóg obsahuje 9 predstavení (REQ-01)', async () => {
  await withServer(async base => {
    const { status, body } = await get(base, '/api/catalog');
    assert.equal(status, 200);
    assert.equal(body.mode, 'normal');
    assert.deepEqual(body.dates, ['2026-10-21', '2026-10-22', '2026-10-23']);
    assert.equal(body.sessions.length, 9);
    for (const date of body.dates) {
      const day = body.sessions.filter(s => s.date === date).map(s => `${s.time} ${s.hall}`);
      assert.deepEqual(day, ['15:00 Sála 1', '18:00 Sála 1', '19:30 Sála 2'], `deň ${date}`);
    }
  });
});
