// Pomocné funkcie pre automatické testovacie prípady (procedúra PR-03).
// Každý test spúšťa vlastný server na náhodnom porte, takže obsadenosť
// z jedného prípadu neovplyvní iný (zodpovedá reštartu v PR-01).
import { createApp } from '../server.js';

export const INITIAL_OCCUPIED = ['A3', 'B6', 'E2', 'F7'];

export async function withServer(fn, options = {}) {
  const server = createApp(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { server.close(); }
}

export async function post(base, path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
  return { status: res.status, body: await res.json() };
}

export async function get(base, path) {
  const res = await fetch(base + path);
  return { status: res.status, body: await res.json() };
}

export async function occupiedSeats(base, sessionId) {
  const { body } = await get(base, `/api/seats/${sessionId}`);
  return body.seats.filter(seat => seat.occupied).map(seat => seat.id).sort();
}

export const adult = (...seatIds) => seatIds.map(seatId => ({ seatId, type: 'adult' }));
