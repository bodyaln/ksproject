const $ = selector => document.querySelector(selector);
const money = cents => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const state = { catalog: null, sessionId: null, seats: [], selected: new Map(), quote: null, quoteSerial: 0, seatSerial: 0, done: false, busy: false };
const types = [['adult', 'Dospelý'], ['student', 'Študent −20 %'], ['child', 'Dieťa −30 %']];

async function api(path, body) {
  const response = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error), { code: data.code });
  return data;
}
function notify(message) { $('#notice').textContent = message; $('#notice').hidden = !message; }
function tickets() { return [...state.selected].map(([seatId, type]) => ({ seatId, type })); }
function setLocked(locked) {
  state.busy = locked;
  for (const selector of ['#date', '#time', '#hall', '#refresh', '#new-selection']) $(selector).disabled = locked;
  $('#reserve').disabled = locked || state.done || !state.sessionId || !state.seats.length;
  for (const button of document.querySelectorAll('.session, .seat, .remove, .ticket select')) button.disabled = locked;
}
function renderSessions() {
  const sessions = state.catalog.sessions.filter(session => session.date === $('#date').value && ($('#hall').value === 'all' || session.hall === $('#hall').value) && ($('#time').value === 'all' || ($('#time').value === 'evening' ? session.time >= '18:00' : session.time < '18:00')));
  $('#sessions').replaceChildren();
  for (const session of sessions) {
    const button = document.createElement('button');
    button.className = 'session';
    button.type = 'button';
    button.dataset.sessionId = session.id;
    button.setAttribute('aria-pressed', String(session.id === state.sessionId));
    for (const [className, text] of [['session-time', session.time], ['session-movie', session.movie], ['session-meta', `${session.hall} · ${session.genre}`]]) {
      const span = document.createElement('span'); span.className = className; span.textContent = text; button.append(span);
    }
    button.onclick = () => loadSession(session.id);
    $('#sessions').append(button);
  }
  if (!sessions.length) $('#sessions').textContent = 'Pre zvolené filtre nie je dostupné predstavenie.';
  return sessions;
}
async function loadSession(id) {
  const serial = ++state.seatSerial;
  state.quoteSerial++;
  state.sessionId = id; state.selected.clear(); state.quote = null; state.done = false; state.seats = [];
  $('#confirmation').hidden = true; $('#new-selection').hidden = true;
  notify(''); renderSessions(); renderSeats(); renderTickets(); updateTotal(); setLocked(false);
  const session = state.catalog.sessions.find(item => item.id === id);
  $('#session-summary').textContent = session ? `${session.movie} · ${session.date.split('-').reverse().join('. ')} · ${session.time} · ${session.hall}` : 'Zmeňte filtre a vyberte predstavenie.';
  if (!id) return;
  try {
    const data = await api(`/api/seats/${id}`);
    if (serial !== state.seatSerial) return;
    state.seats = data.seats; renderSeats(); setLocked(false);
  } catch (error) { if (serial === state.seatSerial) notify(error.message); }
}
function renderSeats() {
  $('#seats').replaceChildren();
  for (const row of 'ABCDEF') {
    const seats = state.seats.filter(seat => seat.row === row);
    if (!seats.length) continue;
    const rowElement = document.createElement('div'); rowElement.className = 'seat-row';
    const label = () => { const span = document.createElement('span'); span.className = 'row-label'; span.textContent = row; return span; };
    rowElement.append(label());
    for (const seat of seats) {
      const button = document.createElement('button'); button.type = 'button'; button.className = `seat ${seat.zone}`;
      button.dataset.seatId = seat.id; button.textContent = seat.number;
      button.setAttribute('aria-pressed', String(state.selected.has(seat.id)));
      button.setAttribute('aria-disabled', String(seat.occupied || state.done));
      button.setAttribute('aria-label', `${seat.id}, ${seat.zone === 'vip' ? 'VIP' : 'Štandard'}, ${seat.occupied ? 'obsadené' : 'voľné'}`);
      button.title = seat.occupied ? 'Toto sedadlo je obsadené.' : `${seat.id} · ${seat.zone === 'vip' ? 'VIP 15 €' : 'Štandard 10 €'}`;
      button.disabled = state.busy;
      button.onclick = () => {
        if (state.done) return;
        if (seat.occupied) return notify('Toto sedadlo je obsadené. Vyberte iné miesto.');
        notify('');
        if (state.selected.has(seat.id)) state.selected.delete(seat.id);
        else {
          if (state.selected.size === 6) return notify('Maximálny počet vstupeniek na jedno predstavenie je 6.');
          state.selected.set(seat.id, 'adult');
        }
        renderSeats(); renderTickets(); updateQuote();
        document.querySelector(`[data-seat-id="${seat.id}"]`)?.focus({ preventScroll: true });
      };
      rowElement.append(button);
    }
    rowElement.append(label()); $('#seats').append(rowElement);
  }
}
function renderTickets() {
  $('#tickets').replaceChildren(); $('#count').textContent = `${state.selected.size} / 6`;
  if (!state.selected.size) {
    const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Vaše miesto na vás čaká. Vyberte si ho v sále.'; $('#tickets').append(empty); return;
  }
  for (const [seatId, type] of state.selected) {
    const seat = state.seats.find(item => item.id === seatId);
    const ticket = document.createElement('div'); ticket.className = 'ticket';
    const details = document.createElement('div');
    const label = document.createElement('div'); label.className = 'ticket-label'; label.textContent = `${seatId} · ${seat.zone === 'vip' ? 'VIP' : 'Štandard'}`;
    const line = document.createElement('div'); line.className = 'ticket-line';
    const select = document.createElement('select'); select.setAttribute('aria-label', `Typ vstupenky ${seatId}`); select.disabled = state.done || state.busy;
    for (const [value, text] of types) { const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option); }
    select.value = type;
    select.onchange = () => { state.selected.set(seatId, select.value); notify(''); updateQuote(); };
    const price = document.createElement('strong'); price.dataset.priceSeat = seatId; price.textContent = '…';
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove'; remove.textContent = '×'; remove.setAttribute('aria-label', `Odstrániť ${seatId}`); remove.disabled = state.done || state.busy;
    remove.onclick = () => { state.selected.delete(seatId); notify(''); renderSeats(); renderTickets(); updateQuote(); };
    line.append(select, price); details.append(label, line); ticket.append(details, remove); $('#tickets').append(ticket);
  }
  updateTotal();
}
function updateTotal() {
  $('#total').textContent = state.selected.size ? (state.quote ? money(state.quote.totalCents) : '…') : money(0);
  for (const element of document.querySelectorAll('[data-price-seat]')) {
    const item = state.quote?.items.find(item => item.seatId === element.dataset.priceSeat);
    element.textContent = item ? money(item.priceCents) : '…';
  }
}
async function updateQuote() {
  const serial = ++state.quoteSerial; state.quote = null; updateTotal();
  if (!state.selected.size || !state.sessionId) return;
  try {
    const quote = await api('/api/quote', { sessionId: state.sessionId, tickets: tickets() });
    if (serial !== state.quoteSerial) return;
    state.quote = quote; updateTotal();
  } catch (error) { if (serial === state.quoteSerial) notify(error.message); }
}
async function refreshSeats() {
  if (!state.sessionId || state.done || state.busy) return;
  const id = state.sessionId; const serial = ++state.seatSerial;
  setLocked(true);
  try {
    const data = await api(`/api/seats/${id}`);
    if (serial !== state.seatSerial) return;
    state.seats = data.seats;
    const removed = data.seats.filter(seat => seat.occupied && state.selected.has(seat.id));
    for (const seat of removed) state.selected.delete(seat.id);
    notify(removed.length ? 'Niektoré vybrané miesta už boli rezervované. Vyberte si iné.' : 'Obsadenosť bola obnovená.');
    renderSeats(); renderTickets(); await updateQuote();
  } catch (error) { notify(error.message); }
  finally { setLocked(false); }
}
$('#reserve').onclick = async () => {
  if (state.busy || state.done) return;
  notify('');
  if (!state.selected.size) return notify('Vyberte aspoň 1 vstupenku.');
  setLocked(true); state.quoteSerial++;
  try {
    const result = await api('/api/reservations', { sessionId: state.sessionId, tickets: tickets() });
    state.done = true; state.quote = result; updateTotal();
    $('#confirmation').textContent = `Výber je potvrdený. Spolu ${money(result.totalCents)}. Rezervácia ${result.id}. Platba nebola vykonaná.`;
    $('#confirmation').hidden = false; $('#new-selection').hidden = false;
  } catch (error) { notify(error.message); }
  finally { setLocked(false); renderSeats(); renderTickets(); }
};
$('#refresh').onclick = refreshSeats;
$('#new-selection').onclick = () => loadSession(state.sessionId);
for (const selector of ['#date', '#time', '#hall']) $(selector).onchange = () => { const sessions = renderSessions(); loadSession(sessions[0]?.id || null); };
setLocked(true);
try {
  state.catalog = await api('/api/catalog');
  $('#build').textContent = `v${state.catalog.build} · ${state.catalog.mode}`;
  if (state.catalog.mode === 'demo-vip-bug') { $('#mode-banner').hidden = false; $('#mode-banner').textContent = 'DEMO REŽIM S CHYBOU: detská vstupenka vo VIP má nesprávnu cenu. Použite iba na reprodukciu incidentu INC-001.'; }
  await loadSession(state.catalog.sessions[0].id);
} catch (error) { notify(`Aplikáciu sa nepodarilo načítať. ${error.message}`); }
