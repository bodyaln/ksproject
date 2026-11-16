import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BUILD, DATES, SESSIONS, SEATS, DomainError, calculateQuote, validateSession, createInventory, checkAvailability } from './src/domain.js';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']]
]);

async function jsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) { chunks.length = 0; continue; }
    chunks.push(chunk);
  }
  if (size > 16384) throw new DomainError('Požiadavka je príliš veľká.', 413);
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString());
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new DomainError('Neplatný JSON.'); }
}

export function createRequestHandler({ demoVipBug = false } = {}) {
  const inventory = createInventory();
  return async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/catalog') {
        return send(200, { build: BUILD, mode: demoVipBug ? 'demo-vip-bug' : 'normal', dates: DATES, sessions: SESSIONS });
      }
      if (req.method === 'GET' && url.pathname.startsWith('/api/seats/')) {
        const sessionId = url.pathname.slice('/api/seats/'.length);
        validateSession(sessionId);
        return send(200, { seats: SEATS.map(seat => ({ ...seat, occupied: inventory.get(sessionId).has(seat.id) })) });
      }
      if (req.method === 'POST' && ['/api/quote', '/api/reservations'].includes(url.pathname)) {
        const body = await jsonBody(req);
        validateSession(body.sessionId);
        const quote = calculateQuote(body.tickets, { demoVipBug });
        checkAvailability(inventory, body.sessionId, quote.items);
        if (url.pathname === '/api/quote') return send(200, quote);
        // No await between availability check and mutation: atomic in this one Node process.
        for (const ticket of quote.items) inventory.get(body.sessionId).add(ticket.seatId);
        return send(201, { id: randomUUID(), sessionId: body.sessionId, ...quote, status: 'reserved-unpaid' });
      }
      if (req.method === 'GET' && assets.has(url.pathname)) {
        const [name, contentType] = assets.get(url.pathname);
        const content = await readFile(new URL(`./public/${name}`, import.meta.url));
        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        return res.end(content);
      }
      send(404, { error: 'Stránka neexistuje.', code: 'NOT_FOUND' });
    } catch (error) {
      if (error instanceof DomainError) return send(error.status, { error: error.message, code: error.code });
      console.error(error);
      send(500, { error: 'Interná chyba servera.', code: 'INTERNAL' });
    }
  };
}

export function createApp(options = {}) {
  return http.createServer(createRequestHandler(options));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const demoVipBug = process.argv.includes('--demo-vip-bug');
  const port = Number(process.env.PORT || 3000);
  const server = createApp({ demoVipBug });
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} je obsadený. Zastavte druhý server alebo použite PORT=3001 npm start.` : error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`KINO / Téma 16 · ${BUILD} · ${demoVipBug ? 'DEMO: zámerná chyba VIP' : 'normálny režim'}`);
    console.log(`http://127.0.0.1:${port}`);
    console.log('Pamäťové testovacie dáta sa obnovia po reštarte. Zastavenie: Ctrl+C.');
  });
}
