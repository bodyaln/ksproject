// TC-04, TC-05, TC-06, TC-07 (REQ-03 až REQ-06) – zóny, kategórie a výpočet ceny.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuote, SEATS } from '../src/domain.js';
import { withServer, post } from './helpers.js';

describe('TC-04 Hranica zón D8 / E1 (REQ-03)', () => {
  test('D8 je posledné miesto zóny Štandard – 1000 centov', () => {
    const [item] = calculateQuote([{ seatId: 'D8', type: 'adult' }]).items;
    assert.equal(item.zone, 'standard');
    assert.equal(item.priceCents, 1000);
  });
  test('E1 je prvé miesto zóny VIP – 1500 centov', () => {
    const [item] = calculateQuote([{ seatId: 'E1', type: 'adult' }]).items;
    assert.equal(item.zone, 'vip');
    assert.equal(item.priceCents, 1500);
  });
  test('sála má 48 miest A1 … F8, rady A–D Štandard, E–F VIP', () => {
    assert.equal(SEATS.length, 48);
    assert.equal(SEATS[0].id, 'A1');
    assert.equal(SEATS.at(-1).id, 'F8');
    for (const seat of SEATS) {
      assert.equal(seat.zone, 'ABCD'.includes(seat.row) ? 'standard' : 'vip', seat.id);
      assert.equal(seat.id, `${seat.row}${seat.number}`, 'číslo miesta zodpovedá ID');
    }
  });
});

describe('TC-05 Rozhodovacia tabuľka 6 cien (REQ-04, REQ-05)', () => {
  const rules = [
    ['A1', 'adult', 1000], ['A1', 'student', 800], ['A1', 'child', 700],
    ['E1', 'adult', 1500], ['E1', 'student', 1200], ['E1', 'child', 1050]
  ];
  for (const [seatId, type, expected] of rules) {
    test(`${seatId} / ${type} → ${expected} centov`, () => {
      assert.equal(calculateQuote([{ seatId, type }]).totalCents, expected);
    });
  }
});

test('TC-06 Podvrhnutá cena a zóna (REQ-04, REQ-12)', async () => {
  await withServer(async base => {
    const { status, body } = await post(base, '/api/quote', {
      sessionId: 's0-1',
      tickets: [{ seatId: 'E1', type: 'adult', priceCents: 1, zone: 'standard' }]
    });
    assert.equal(status, 200);
    assert.equal(body.items[0].zone, 'vip');
    assert.equal(body.items[0].priceCents, 1500);
    assert.equal(body.totalCents, 1500);
  });
});

test('TC-07 Zmiešaný košík 28,50 € – automatická časť (REQ-06)', async () => {
  await withServer(async base => {
    const { status, body } = await post(base, '/api/quote', {
      sessionId: 's0-1',
      tickets: [
        { seatId: 'A1', type: 'adult' },
        { seatId: 'A2', type: 'student' },
        { seatId: 'E1', type: 'child' }
      ]
    });
    assert.equal(status, 200);
    assert.deepEqual(body.items.map(i => i.priceCents), [1000, 800, 1050]);
    assert.equal(body.totalCents, 2850);
    assert.equal(body.currency, 'EUR');
  });
});
