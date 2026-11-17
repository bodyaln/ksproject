// TC-12, TC-15, TC-16, TC-17 (REQ-08, REQ-10, REQ-11) – obsadenosť a rezervácia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withServer, post, occupiedSeats, adult, INITIAL_OCCUPIED } from './helpers.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test('TC-12 Obsadenosť oddelená medzi predstaveniami (REQ-08)', async () => {
  await withServer(async base => {
    const res = await post(base, '/api/reservations', { sessionId: 's0-1', tickets: adult('A1') });
    assert.equal(res.status, 201);
    assert.ok((await occupiedSeats(base, 's0-1')).includes('A1'), 'A1 v s0-1 má byť obsadené');
    assert.ok(!(await occupiedSeats(base, 's0-2')).includes('A1'), 'A1 v s0-2 má zostať voľné');
  });
});

test('TC-15 Dvaja klienti, rovnaké miesto (REQ-10)', async () => {
  await withServer(async base => {
    const request = { sessionId: 's0-1', tickets: adult('A1') };
    const results = await Promise.all([
      post(base, '/api/reservations', request),
      post(base, '/api/reservations', request)
    ]);
    const statuses = results.map(r => r.status).sort();
    assert.deepEqual(statuses, [201, 409]);
    assert.equal(results.find(r => r.status === 409).body.code, 'SEAT_TAKEN');
  });
});

test('TC-16 Konflikt nerezervuje zvyšok košíka (REQ-10)', async () => {
  await withServer(async base => {
    const b = await post(base, '/api/reservations', { sessionId: 's0-1', tickets: adult('A1') });
    assert.equal(b.status, 201);
    const a = await post(base, '/api/reservations', { sessionId: 's0-1', tickets: adult('A1', 'A2') });
    assert.equal(a.status, 409);
    assert.equal(a.body.code, 'SEAT_TAKEN');
    const occupied = await occupiedSeats(base, 's0-1');
    assert.ok(occupied.includes('A1'));
    assert.ok(!occupied.includes('A2'), 'A2 nesmie byť rezervované');
  });
});

test('TC-17 Odpoveď potvrdenia (REQ-11)', async () => {
  await withServer(async base => {
    const { status, body } = await post(base, '/api/reservations', {
      sessionId: 's0-1', tickets: [{ seatId: 'E1', type: 'child' }]
    });
    assert.equal(status, 201);
    assert.match(body.id, UUID);
    assert.equal(body.sessionId, 's0-1');
    assert.equal(body.totalCents, 1050);
    assert.equal(body.status, 'reserved-unpaid');
    assert.deepEqual(await occupiedSeats(base, 's0-1'), [...INITIAL_OCCUPIED, 'E1'].sort());
  });
});
