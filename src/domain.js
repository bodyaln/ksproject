export const BUILD = '1.0.0';
export const PRICES = Object.freeze({ standard: 1000, vip: 1500 });
export const DISCOUNTS = Object.freeze({ adult: 0, student: 20, child: 30 });
export const DATES = ['2026-10-21', '2026-10-22', '2026-10-23'];
export const SESSIONS = DATES.flatMap((date, day) => [
  { id: `s${day}-1`, date, time: '15:00', hall: 'Sála 1', movie: 'Za horizontom', genre: 'Dobrodružný · 118 min' },
  { id: `s${day}-2`, date, time: '18:00', hall: 'Sála 1', movie: 'Za horizontom', genre: 'Dobrodružný · 118 min' },
  { id: `s${day}-3`, date, time: '19:30', hall: 'Sála 2', movie: 'Nočná stanica', genre: 'Sci-fi · 104 min' }
]);
export const SEATS = 'ABCDEF'.split('').flatMap((row, i) =>
  Array.from({ length: 8 }, (_, n) => ({ id: `${row}${n + 1}`, row, number: n + 1, zone: i < 4 ? 'standard' : 'vip' }))
);
const seatById = new Map(SEATS.map(seat => [seat.id, seat]));

export class DomainError extends Error {
  constructor(message, status = 400, code = 'INVALID_INPUT') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function validateSession(sessionId) {
  const session = SESSIONS.find(item => item.id === sessionId);
  if (!session) throw new DomainError('Predstavenie neexistuje.', 404, 'SESSION_NOT_FOUND');
  return session;
}

export function calculateQuote(tickets, { demoVipBug = false } = {}) {
  if (!Array.isArray(tickets)) throw new DomainError('Neplatný zoznam vstupeniek.');
  if (tickets.length === 0) throw new DomainError('Vyberte aspoň 1 vstupenku.', 400, 'MIN_TICKETS');
  if (tickets.length > 6) throw new DomainError('Maximálny počet vstupeniek na jedno predstavenie je 6.', 400, 'MAX_TICKETS');
  const used = new Set();
  const items = tickets.map(ticket => {
    if (!ticket || typeof ticket !== 'object') throw new DomainError('Neplatná vstupenka.');
    const seat = seatById.get(ticket.seatId);
    if (!seat) throw new DomainError('Sedadlo neexistuje.');
    if (typeof ticket.type !== 'string' || !Object.hasOwn(DISCOUNTS, ticket.type)) throw new DomainError('Neplatný typ vstupenky.');
    if (used.has(seat.id)) throw new DomainError('Sedadlo nemožno vybrať dvakrát.');
    used.add(seat.id);
    const baseCents = PRICES[seat.zone];
    const discountPercent = DISCOUNTS[ticket.type];
    // Explicit fault injection for a separately labelled educational test run.
    const chargedBase = demoVipBug && seat.zone === 'vip' && ticket.type === 'child' ? PRICES.standard : baseCents;
    const priceCents = Math.round(chargedBase * (100 - discountPercent) / 100);
    return { seatId: seat.id, zone: seat.zone, type: ticket.type, baseCents, discountPercent, priceCents };
  });
  return { items, totalCents: items.reduce((sum, item) => sum + item.priceCents, 0), currency: 'EUR' };
}

export function createInventory() {
  return new Map(SESSIONS.map(session => [session.id, new Set(['A3', 'B6', 'E2', 'F7'])]));
}

export function checkAvailability(inventory, sessionId, tickets) {
  const occupied = inventory.get(sessionId);
  if (tickets.some(ticket => occupied.has(ticket.seatId))) {
    throw new DomainError('Vybrané sedadlo už je obsadené. Obnovte obsadenosť a vyberte iné miesto.', 409, 'SEAT_TAKEN');
  }
}
