(() => {
  'use strict';
  const STORAGE_KEY = 'among-us-show-ship-v1';
  const LINKS = [
    { id: 'h0', a: 0, b: 1, row: 1, col: 2 },
    { id: 'h1', a: 1, b: 2, row: 1, col: 4 },
    { id: 'h3', a: 3, b: 4, row: 3, col: 2 },
    { id: 'h4', a: 4, b: 5, row: 3, col: 4 },
    { id: 'v0', a: 0, b: 3, row: 2, col: 1 },
    { id: 'v1', a: 1, b: 4, row: 2, col: 3 },
    { id: 'v2', a: 2, b: 5, row: 2, col: 5 }
  ];
  const DECOR = [
    { id: 'plant', name: 'Plants' }, { id: 'crystal', name: 'Crystals' },
    { id: 'pizza', name: 'Pizza' }, { id: 'star', name: 'Star lights' }
  ];
  const THEMES = [
    { id: 'teal', name: 'Ocean', color: '#69dfca' },
    { id: 'purple', name: 'Nebula', color: '#c8a5f5' },
    { id: 'amber', name: 'Sunrise', color: '#f2c981' }
  ];
  const REQUIRED = ['cafeteria', 'reactor', 'electrical', 'navigation'];
  const SLOT_NAMES = ['top left', 'top middle', 'top right', 'bottom left', 'bottom middle', 'bottom right'];
  const paths = {
    ship: '<path d="m4 13 8-9 8 9-8 7z"/><path d="M4 13h16M12 4v16M7 9h10"/>',
    cafeteria: '<ellipse cx="12" cy="13" rx="9" ry="5"/><path d="m7 11 5-4 5 4m-5-4v9M4 15v4m16-4v4"/>',
    reactor: '<rect x="7" y="3" width="10" height="18" rx="4"/><path d="m13 7-4 6h5l-2 4M5 7H3m2 10H3m16-10h2m-2 10h2"/>',
    electrical: '<path d="m14 2-9 12h6l-1 8 9-12h-6z"/>',
    navigation: '<path d="m12 3 4 14-4-3-4 3z"/><circle cx="12" cy="12" r="9"/>',
    medbay: '<path d="M4 9v12m16-12v12M4 16h16M8 9h9a3 3 0 0 1 3 3v4H4v-4a3 3 0 0 1 3-3Z"/><path d="M12 7C5 3 10 0 12 3c2-3 7 0 0 4Z"/>',
    cargo: '<path d="m3 7 9-4 9 4v12l-9 3-9-3zM3 7l9 4 9-4M12 11v11m-5-18 10 5"/>',
    engine: '<path d="M7 7h10v10H7zM9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4"/><circle cx="12" cy="12" r="2"/>',
    observatory: '<circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="11" ry="3" transform="rotate(-25 12 12)"/><path d="M19 3v3m-1.5-1.5h3"/>',
    empty: '<path d="M6 6h12v12H6z" stroke-dasharray="2 3"/><path d="m9 9 6 6m0-6-6 6"/>',
    plant: '<path d="M7 15h10l-1 6H8zM12 15V8C5 10 3 5 4 3c5-1 8 2 8 5m0 4c0-6 5-9 8-8 0 5-3 8-8 8Z"/>',
    crystal: '<path d="m12 2 6 6-2 13H8L6 8zM6 8h12M12 2v19m-6-13 6 13 6-13"/>',
    pizza: '<path d="m4 20 6-17c5 1 8 4 11 8zM9 6c4 1 7 4 9 7"/><circle cx="9" cy="13" r="1"/><circle cx="13" cy="11" r="1"/>',
    star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    undo: '<path d="M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12"/>',
    reset: '<path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    link: '<path d="M3 8h18v8H3zM7 11h10m-10 2h10"/>',
    save: '<path d="M4 3h14l3 3v15H3V3zM7 3v6h9V3M7 21v-8h10v8"/>'
  };
  const icon = (name, extra = '') => `<svg ${extra} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.ship}</svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const copy = value => JSON.parse(JSON.stringify(value));
  let overlay = null, draft = null, selected = 1, callbacks = {}, history = [], returnFocus = null;

  function types() { return window.BuildWorld.types; }
  function typeFor(id) { return types().find(t => t.id === id) || types().find(t => t.id === 'empty'); }
  function roomName(slot) { return typeFor(draft.rooms[slot].type)?.name || 'Empty'; }
  function normalize(design) {
    const source = design && typeof design === 'object' ? design : window.BuildWorld.defaults();
    return {
      version: 1,
      name: String(source.name || 'My Skeld').slice(0, 24),
      theme: THEMES.some(t => t.id === source.theme) ? source.theme : 'teal',
      rooms: Array.from({ length: 6 }, (_, i) => ({
        type: types().some(t => t.id === source.rooms?.[i]?.type) ? source.rooms[i].type : 'empty',
        decor: DECOR.filter(d => source.rooms?.[i]?.decor?.includes(d.id)).map(d => d.id)
      })),
      links: LINKS.filter(l => source.links?.includes(l.id)).map(l => l.id)
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const design = normalize(JSON.parse(raw));
      return window.BuildWorld.compile(design).ok ? design : null;
    } catch { return null; }
  }
  function remember() { history.push(copy(draft)); if (history.length > 30) history.shift(); }
  function update(action, message = '') {
    remember(); action(); render();
    if (message) overlay.querySelector('[data-status]').textContent = message;
  }
  function roomButton(slot) {
    const room = draft.rooms[slot], type = typeFor(room.type), active = slot === selected;
    const color = type?.color || '#647c94';
    return `<button type="button" class="sb-room ${room.type === 'empty' ? 'sb-empty' : ''}" data-slot="${slot}" style="grid-column:${(slot % 3) * 2 + 1};grid-row:${slot < 3 ? 1 : 3};--room:${esc(color)}" aria-pressed="${active}" aria-label="Edit ${esc(roomName(slot))}, ${SLOT_NAMES[slot]}"><span class="sb-room-number">0${slot + 1}</span><span class="sb-room-art">${icon(room.type)}</span><strong>${esc(roomName(slot))}</strong><span class="sb-room-decor">${room.decor.map(d => icon(d)).join('')}</span><span class="sb-selected-marker">${icon('check')}</span></button>`;
  }
  function hallButton(link) {
    const connected = draft.links.includes(link.id);
    const empty = draft.rooms[link.a].type === 'empty' || draft.rooms[link.b].type === 'empty';
    const vertical = link.id[0] === 'v';
    return `<button type="button" class="sb-hall ${vertical ? 'sb-vertical' : ''} ${connected && !empty ? 'sb-connected' : ''}" data-link="${link.id}" style="grid-column:${link.col};grid-row:${link.row}" aria-pressed="${connected && !empty}" aria-label="${connected && !empty ? 'Remove' : 'Add'} hallway between ${esc(roomName(link.a))} (${SLOT_NAMES[link.a]}) and ${esc(roomName(link.b))} (${SLOT_NAMES[link.b]})" ${empty ? 'disabled' : ''}><span class="sb-hall-track"></span><span class="sb-hall-symbol">${connected && !empty ? '−' : '+'}</span></button>`;
  }
  function render() {
    if (!overlay) return;
    const scrollTop = overlay.querySelector('.sb-scroll')?.scrollTop || 0;
    const validation = window.BuildWorld.compile(draft);
    const room = draft.rooms[selected];
    const name = roomName(selected);
    overlay.dataset.theme = draft.theme;
    overlay.innerHTML = `<section class="sb-dialog" role="dialog" aria-modal="true" aria-labelledby="sbTitle">
      <header class="sb-header"><div class="sb-logo">${icon('ship')}<div><span>YOUR SHIP. YOUR RULES.</span><h1 id="sbTitle">Build the ship</h1></div></div><button class="sb-close" type="button" data-close aria-label="Close ship builder">${icon('close')}</button></header>
      <div class="sb-scroll"><div class="sb-intro"><p>Pick a room. Connect the hallways. Make it yours.</p><div class="sb-tools"><button type="button" data-undo ${history.length ? '' : 'disabled'}>${icon('undo')} Undo</button><button type="button" data-reset>${icon('reset')} Starter ship</button></div></div>
      <div class="sb-workspace"><section class="sb-blueprint-panel" aria-label="Ship blueprint">
        <div class="sb-ship-settings"><label class="sb-name-label">SHIP NAME<input id="sbName" maxlength="24" value="${esc(draft.name)}" autocomplete="off" spellcheck="false"></label><div class="sb-paint"><span>SHIP COLORS</span><div role="group" aria-label="Ship color theme">${THEMES.map(t => `<button type="button" data-theme="${t.id}" style="--paint:${t.color}" aria-label="${t.name} colors" aria-pressed="${draft.theme === t.id}" title="${t.name}"><span></span></button>`).join('')}</div></div></div>
        <div class="sb-blueprint"><div class="sb-blueprint-heading"><span>DECK PLAN</span><span>${draft.rooms.filter(r => r.type !== 'empty').length} ROOMS</span></div><div class="sb-grid">${draft.rooms.map((_, i) => roomButton(i)).join('')}${LINKS.map(hallButton).join('')}</div><div class="sb-grid-legend"><span><i class="sb-legend-line"></i> Tap a hallway to connect it</span><span><i class="sb-legend-selected"></i> Selected room</span></div></div>
        <div class="sb-validation ${validation.ok ? 'sb-valid' : ''}" role="status" aria-live="polite">${icon(validation.ok ? 'check' : 'ship')}<div><strong>${validation.ok ? 'Ready for the crew' : 'A little more building…'}</strong>${validation.ok ? '<p>Your rooms are connected. All four mission rooms are aboard.</p>' : `<ul>${validation.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`}</div></div>
      </section><aside class="sb-inspector" aria-label="Room editor"><div class="sb-inspector-heading"><span>EDITING ROOM 0${selected + 1}</span><strong>${esc(name)}</strong><small>${SLOT_NAMES[selected]}</small></div><div class="sb-section-label">CHOOSE A ROOM</div><div class="sb-room-palette" role="group" aria-label="Room type">${types().map(t => `<button type="button" data-type="${esc(t.id)}" aria-pressed="${room.type === t.id}" style="--room:${esc(t.color || '#8ca4b9')}" ${t.id === 'empty' ? 'class="sb-erase"' : ''}>${icon(t.id)}<span>${esc(t.name)}</span></button>`).join('')}</div><p class="sb-tip">Choose an existing room to swap places with it.</p><div class="sb-section-label">ADD SOME PERSONALITY</div><div class="sb-decor-palette" role="group" aria-label="Room decorations">${DECOR.map(d => `<button type="button" data-decor="${d.id}" aria-pressed="${room.decor.includes(d.id)}" ${room.type === 'empty' ? 'disabled' : ''}>${icon(d.id)}<span>${d.name}</span></button>`).join('')}</div><div class="sb-essentials"><strong>EVERY ADVENTURE NEEDS</strong><p>${REQUIRED.map(id => { const present = draft.rooms.some(r => r.type === id); return `<span class="${present ? 'sb-present' : ''}">${icon(present ? 'check' : 'ship')}${esc(typeFor(id)?.name || id)}</span>`; }).join('')}</p></div></aside></div>
      <p class="sb-status" data-status aria-live="polite"></p></div>
      <footer class="sb-footer"><p>Your saved ship stays on this device.</p><div><button type="button" class="sb-save" data-save ${validation.ok ? '' : 'disabled'}>${icon('save')} Save &amp; back</button><button type="button" class="sb-play" data-play ${validation.ok ? '' : 'disabled'}>Play my ship ${icon('arrow')}</button></div></footer>
    </section>`;
    bind();
    overlay.querySelector('.sb-scroll').scrollTop = scrollTop;
  }
  function bind() {
    overlay.querySelector('[data-close]').onclick = () => close();
    overlay.querySelector('[data-undo]').onclick = () => { if (history.length) { draft = history.pop(); render(); overlay.querySelector('[data-undo]').focus({ preventScroll: true }); } };
    overlay.querySelector('[data-reset]').onclick = () => { update(() => { draft = normalize(window.BuildWorld.defaults()); selected = 1; }, 'Starter ship restored. Undo brings your design back.'); overlay.querySelector('[data-reset]').focus({ preventScroll: true }); };
    overlay.querySelectorAll('[data-slot]').forEach(button => button.onclick = () => { selected = Number(button.dataset.slot); render(); overlay.querySelector(`[data-slot="${selected}"]`).focus({ preventScroll: true }); });
    overlay.querySelectorAll('[data-link]').forEach(button => button.onclick = () => {
      const id = button.dataset.link;
      update(() => { draft.links = draft.links.includes(id) ? draft.links.filter(l => l !== id) : [...draft.links, id]; });
      overlay.querySelector(`[data-link="${id}"]`).focus({ preventScroll: true });
    });
    overlay.querySelectorAll('[data-theme]').forEach(button => button.onclick = () => {
      const id = button.dataset.theme;
      if (draft.theme === id) return;
      update(() => { draft.theme = id; });
      overlay.querySelector(`[data-theme="${id}"]`).focus({ preventScroll: true });
    });
    overlay.querySelectorAll('[data-type]').forEach(button => button.onclick = () => {
      const id = button.dataset.type;
      if (draft.rooms[selected].type === id) return;
      const other = id === 'empty' ? -1 : draft.rooms.findIndex((r, i) => i !== selected && r.type === id);
      update(() => {
        if (other >= 0) [draft.rooms[selected], draft.rooms[other]] = [draft.rooms[other], draft.rooms[selected]];
        else draft.rooms[selected] = { type: id, decor: id === 'empty' ? [] : draft.rooms[selected].decor };
      }, other >= 0 ? `${typeFor(id).name} moved to room 0${selected + 1}.` : `${typeFor(id).name} placed in room 0${selected + 1}.`);
      overlay.querySelector(`[data-type="${id}"]`).focus({ preventScroll: true });
    });
    overlay.querySelectorAll('[data-decor]').forEach(button => button.onclick = () => {
      const id = button.dataset.decor;
      update(() => { const decor = draft.rooms[selected].decor; draft.rooms[selected].decor = decor.includes(id) ? decor.filter(d => d !== id) : [...decor, id]; });
      overlay.querySelector(`[data-decor="${id}"]`).focus({ preventScroll: true });
    });
    const input = overlay.querySelector('#sbName');
    let nameBefore = draft.name;
    input.onfocus = () => { nameBefore = draft.name; };
    input.oninput = () => { draft.name = input.value.slice(0, 24); };
    input.onchange = () => { if (nameBefore !== draft.name) { const previous = copy(draft); previous.name = nameBefore; history.push(previous); overlay.querySelector('[data-undo]').disabled = false; } };
    overlay.querySelector('[data-save]').onclick = () => finish(false);
    overlay.querySelector('[data-play]').onclick = () => finish(true);
  }
  function finish(play) {
    const design = normalize(draft);
    design.name = design.name.trim() || 'My Skeld';
    if (!window.BuildWorld.compile(design).ok) { draft = design; render(); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(design)); } catch { /* The ship still works if device storage is unavailable. */ }
    const action = play ? callbacks.onPlay : callbacks.onApply;
    close(false);
    if (typeof action === 'function') action(copy(design));
  }
  function onKey(event) {
    if (!overlay) return;
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...overlay.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  function open(options = {}) {
    if (overlay) close(false);
    returnFocus = document.activeElement;
    callbacks = options;
    draft = normalize(options.design || load() || window.BuildWorld.defaults());
    selected = Math.max(0, draft.rooms.findIndex(r => r.type === 'cafeteria'));
    history = [];
    overlay = document.createElement('div');
    overlay.className = 'ship-builder ship-builder-overlay';
    document.body.append(overlay);
    overlay.addEventListener('keydown', onKey);
    render();
    overlay.querySelector('[data-close]').focus({ preventScroll: true });
  }
  function close(notify = true) {
    if (!overlay) return;
    const callback = callbacks.onClose;
    overlay.remove(); overlay = null; draft = null; history = [];
    returnFocus?.focus?.({ preventScroll: true });
    if (notify && typeof callback === 'function') callback();
  }
  window.ShipBuilder = Object.freeze({ open, close, load, storageKey: STORAGE_KEY });
})();
