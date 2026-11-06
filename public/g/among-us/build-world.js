(() => {
  'use strict';

  const W = 1600, H = 1120;
  const types = [
    { id: 'cafeteria', name: 'Cafeteria', color: '#a5e4d3' },
    { id: 'reactor', name: 'Reactor', color: '#b3bbf5' },
    { id: 'electrical', name: 'Electrical', color: '#f5d28b' },
    { id: 'navigation', name: 'Navigation', color: '#9dd9fa' },
    { id: 'medbay', name: 'Medbay', color: '#a8e7dd' },
    { id: 'cargo', name: 'Cargo Bay', color: '#badb9d' },
    { id: 'engine', name: 'Engine Room', color: '#f2ac8d' },
    { id: 'observatory', name: 'Observatory', color: '#d2b6f2' },
    { id: 'empty', name: 'Empty Bay', color: '#657489' }
  ];
  const byType = new Map(types.map(t => [t.id, t]));
  const allowedDecor = new Set(['plant', 'crystal', 'pizza', 'star']);
  const themes = {
    teal: { hull: '#152738', floor: '#2c4b5d', corridor: '#345166', rim: '#7797a8', accent: '#8edbcb' },
    purple: { hull: '#231e36', floor: '#433955', corridor: '#514362', rim: '#a393b5', accent: '#d7b5f5' },
    amber: { hull: '#2e2726', floor: '#51493f', corridor: '#615446', rim: '#b7a38a', accent: '#f1d08e' }
  };
  const slotPositions = [
    { x: 40, y: 80 }, { x: 600, y: 80 }, { x: 1160, y: 80 },
    { x: 40, y: 640 }, { x: 600, y: 640 }, { x: 1160, y: 640 }
  ];
  const linkDefs = [
    { id: 'h0', a: 0, b: 1, x: 440, y: 220, w: 160, h: 120 },
    { id: 'h1', a: 1, b: 2, x: 1000, y: 220, w: 160, h: 120 },
    { id: 'h3', a: 3, b: 4, x: 440, y: 780, w: 160, h: 120 },
    { id: 'h4', a: 4, b: 5, x: 1000, y: 780, w: 160, h: 120 },
    { id: 'v0', a: 0, b: 3, x: 180, y: 480, w: 120, h: 160 },
    { id: 'v1', a: 1, b: 4, x: 740, y: 480, w: 120, h: 160 },
    { id: 'v2', a: 2, b: 5, x: 1300, y: 480, w: 120, h: 160 }
  ];
  const byLink = new Map(linkDefs.map(l => [l.id, l]));

  function defaults() {
    return {
      version: 1, name: 'My Skeld', theme: 'teal',
      rooms: ['reactor', 'cafeteria', 'navigation', 'electrical', 'cargo', 'medbay'].map(type => ({ type, decor: [] })),
      links: ['h0', 'h1', 'h3', 'h4', 'v0', 'v1', 'v2']
    };
  }
  function cleanName(value) {
    const name = typeof value === 'string' ? value : 'My Skeld';
    return Array.from(name.replace(/[<>&"'`\\\u0000-\u001f\u007f]/g, '').trim()).slice(0, 24).join('') || 'My Skeld';
  }
  function prop(room, kind, x, y, w, h, blocking = true) {
    return { x: room.x + x, y: room.y + y, w, h, kind, slot: room.slot, blocking };
  }
  function roomProps(r) {
    switch (r.type) {
      case 'cafeteria': return [prop(r, 'table', 100, 205, 200, 70)];
      case 'reactor': return [prop(r, 'reactor', 65, 170, 55, 140), prop(r, 'reactor', 280, 170, 55, 140)];
      case 'electrical': return [prop(r, 'cabinet', 65, 150, 55, 130), prop(r, 'cabinet', 280, 150, 55, 130)];
      case 'navigation': return [prop(r, 'console', 70, 100, 260, 65)];
      case 'medbay': return [prop(r, 'bed', 65, 165, 105, 62), prop(r, 'bed', 235, 250, 105, 62), prop(r, 'medical', 270, 100, 58, 62)];
      case 'cargo': return [prop(r, 'crate', 65, 140, 80, 65), prop(r, 'crate', 260, 145, 75, 65), prop(r, 'crystal-box', 80, 270, 80, 60)];
      case 'engine': return [prop(r, 'engine', 110, 165, 180, 120)];
      case 'observatory': return [prop(r, 'window', 65, 145, 165, 165, false), prop(r, 'telescope', 275, 165, 55, 120)];
      default: return [];
    }
  }

  function compile(input) {
    const errors = [];
    if (!input || typeof input !== 'object' || input.version !== 1) {
      return { ok: false, errors: ['Choose a valid ship design.'] };
    }
    if (!Array.isArray(input.rooms) || input.rooms.length !== 6) {
      return { ok: false, errors: ['A ship blueprint needs six room bays.'] };
    }
    if (!Object.prototype.hasOwnProperty.call(themes, input.theme)) errors.push('Choose the teal, purple, or amber theme.');
    const normalizedRooms = input.rooms.map((r, i) => {
      if (!r || typeof r !== 'object' || !byType.has(r.type)) {
        errors.push(`Bay ${i + 1} needs a valid room type.`);
        return { type: 'empty', decor: [] };
      }
      const decorations = r.decor === undefined ? [] : r.decor;
      if (!Array.isArray(decorations) || decorations.some(d => !allowedDecor.has(d))) {
        errors.push(`Bay ${i + 1} has an unknown decoration.`);
        return { type: r.type, decor: [] };
      }
      return { type: r.type, decor: [...new Set(decorations)] };
    });
    if (!Array.isArray(input.links) || input.links.some(id => !byLink.has(id))) errors.push('Choose hallways from the blueprint connections.');
    if (errors.length) return { ok: false, errors };
    for (const id of ['cafeteria', 'reactor', 'electrical', 'navigation']) {
      const count = normalizedRooms.filter(r => r.type === id).length;
      if (count !== 1) errors.push(`Your ship needs exactly one ${byType.get(id).name}.`);
    }
    const selectedLinks = [...new Set(input.links)];
    const occupied = normalizedRooms.map((r, i) => r.type === 'empty' ? -1 : i).filter(i => i >= 0);
    const occupiedSet = new Set(occupied);
    // A hallway touching an empty bay is inactive. It returns if that bay is filled later.
    const activeLinks = selectedLinks.map(id => byLink.get(id)).filter(l => occupiedSet.has(l.a) && occupiedSet.has(l.b));
    if (occupied.length) {
      const visited = new Set([occupied[0]]), queue = [occupied[0]];
      for (let i = 0; i < queue.length; i++) for (const l of activeLinks) {
        const next = l.a === queue[i] ? l.b : l.b === queue[i] ? l.a : -1;
        if (next >= 0 && !visited.has(next)) { visited.add(next); queue.push(next); }
      }
      if (visited.size !== occupied.length) errors.push('Some rooms are cut off. Add hallways to connect every room.');
    }
    if (errors.length) return { ok: false, errors };

    const design = {
      version: 1, name: cleanName(input.name), theme: input.theme,
      rooms: normalizedRooms.map(r => ({ type: r.type, decor: [...r.decor] })), links: selectedLinks
    };
    const rooms = occupied.map(slot => {
      const meta = byType.get(normalizedRooms[slot].type);
      const r = { ...slotPositions[slot], w: 400, h: 400, name: meta.name, color: meta.color,
        type: meta.id, slot, tag: String(slot + 1).padStart(2, '0'), decor: [...normalizedRooms[slot].decor] };
      r.props = roomProps(r); return r;
    });
    const corridors = activeLinks.map(l => ({ ...l }));
    const obstacles = rooms.flatMap(r => r.props.filter(p => p.blocking).map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h, kind: p.kind, slot: p.slot })));
    const cafe = rooms.find(r => r.type === 'cafeteria');
    const taskInfo = {
      reactor: { name: 'Restore power', kind: 'power', x: 200, y: 130 },
      electrical: { name: 'Repair the wiring', kind: 'wires', x: 200, y: 200 },
      navigation: { name: 'Restore navigation', kind: 'course', x: 200, y: 220 }
    };
    const taskDefs = ['reactor', 'electrical', 'navigation'].map(id => {
      const r = rooms.find(room => room.type === id), t = taskInfo[id];
      return { id, name: t.name, kind: t.kind, room: r.name, x: r.x + t.x, y: r.y + t.y };
    });
    const vents = rooms.filter(r => r.type !== 'cafeteria').map(r => ({ x: r.x + 350, y: r.y + 350, room: r.name, slot: r.slot }));
    const meetingPoint = { x: cafe.x + 340, y: cafe.y + 360 };
    const spawnPoints = [
      { x: 200, y: 370 },
      ...[60, 130, 200, 270, 340].map(x => ({ x, y: 150 })),
      ...[60, 130, 200, 270, 340].map(x => ({ x, y: 315 }))
    ].map(p => ({ x: cafe.x + p.x, y: cafe.y + p.y }));
    const world = { W, H, name: design.name, theme: design.theme, design, rooms, corridors, obstacles, taskDefs, vents, meetingPoint, spawnPoints };
    world.draw = (ctx, options = {}) => drawWorld(ctx, world, options);
    world.drawMonsterShadow = (ctx, actor, time = 0) => {
      if (window.WorldArt && typeof window.WorldArt.drawMonsterShadow === 'function') window.WorldArt.drawMonsterShadow(ctx, actor, time);
      else drawShadow(ctx, actor, time);
    };
    return { ok: true, errors: [], world };
  }

  const ink = '#152737';
  function box(ctx, x, y, w, h, radius, fill, stroke, width = 2) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function oval(ctx, x, y, rx, ry, fill, stroke, width = 2) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function line(ctx, points, color, width = 2) {
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }
  function text(ctx, s, x, y, size = 12, color = '#d9e8ed') {
    ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function heart(ctx, x, y, scale = 1, color = '#8cdbca') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-19, -4, -10, -18, 0, -9); ctx.bezierCurveTo(10, -18, 19, -4, 0, 8);
    ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function pizza(ctx, x, y, size = 25) {
    oval(ctx, x, y + 3, size + 4, size * .52 + 4, '#172c3e');
    oval(ctx, x, y, size + 4, size * .52 + 3, '#e4e4d2', '#bcc7bc', 1);
    oval(ctx, x, y - 1, size, size * .5, '#c18545', '#76583e', 1);
    oval(ctx, x, y - 2, size - 3, size * .42, '#f3d080');
    for (let i = 0; i < 6; i++) {
      const a = i * 2.35, d = size * (.25 + (i % 2) * .28);
      oval(ctx, x + Math.cos(a) * d, y - 2 + Math.sin(a) * d * .45, 3, 1.9, '#bd5147');
    }
    line(ctx, [[x - size + 4, y - 1], [x + size - 4, y - 1]], '#bb8c52', .8);
    line(ctx, [[x, y - size * .4], [x, y + size * .4]], '#bb8c52', .8);
  }
  function crystal(ctx, x, y, size = 22, fill = '#92cfe0') {
    ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size * .46, y - size * .35); ctx.lineTo(x + size * .28, y + size * .48);
    ctx.lineTo(x - size * .28, y + size * .48); ctx.lineTo(x - size * .43, y - size * .3); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();
    line(ctx, [[x, y - size + 3], [x - 2, y + size * .4]], '#e4fff4aa', 2);
  }

  function drawFloors(ctx, world, theme) {
    for (const c of world.corridors) {
      box(ctx, c.x - 7, c.y - 7, c.w + 14, c.h + 14, 10, theme.hull, theme.rim, 3);
      box(ctx, c.x, c.y, c.w, c.h, 3, theme.corridor);
    }
    for (const r of world.rooms) {
      box(ctx, r.x - 9, r.y - 9, 418, 418, 22, theme.hull, theme.rim, 4);
      box(ctx, r.x, r.y, 400, 400, 16, theme.floor, ink, 3);
      ctx.save(); ctx.beginPath(); ctx.roundRect(r.x + 3, r.y + 3, 394, 394, 14); ctx.clip();
      ctx.strokeStyle = '#c4dce913'; ctx.lineWidth = 1;
      for (let d = 40; d < 400; d += 40) {
        ctx.beginPath(); ctx.moveTo(r.x + d, r.y); ctx.lineTo(r.x + d, r.y + 400); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(r.x, r.y + d); ctx.lineTo(r.x + 400, r.y + d); ctx.stroke();
      }
      box(ctx, r.x + 90, r.y + 8, 220, 36, 10, '#12233444'); ctx.restore();
      text(ctx, r.name.toUpperCase(), r.x + 200, r.y + 26, 14, r.color);
      text(ctx, r.tag, r.x + 25, r.y + 26, 9, theme.rim);
      for (const x of [r.x + 14, r.x + 386]) for (const y of [r.y + 14, r.y + 386]) oval(ctx, x, y, 3, 3, theme.rim);
    }
    for (const c of world.corridors) {
      const horizontal = c.w > c.h;
      const doors = horizontal ? [{ x: c.x, y: c.y + 60 }, { x: c.x + c.w, y: c.y + 60 }]
        : [{ x: c.x + 60, y: c.y }, { x: c.x + 60, y: c.y + c.h }];
      for (const d of doors) {
        if (horizontal) {
          box(ctx, d.x - 12, d.y - 51, 24, 102, 0, theme.corridor);
          box(ctx, d.x - 7, d.y - 58, 14, 11, 3, theme.accent, ink, 2);
          box(ctx, d.x - 7, d.y + 47, 14, 11, 3, theme.accent, ink, 2);
        } else {
          box(ctx, d.x - 51, d.y - 12, 102, 24, 0, theme.corridor);
          box(ctx, d.x - 58, d.y - 7, 11, 14, 3, theme.accent, ink, 2);
          box(ctx, d.x + 47, d.y - 7, 11, 14, 3, theme.accent, ink, 2);
        }
      }
      ctx.save(); ctx.setLineDash([11, 12]); ctx.strokeStyle = '#dae8e836'; ctx.lineWidth = 2; ctx.beginPath();
      if (horizontal) { ctx.moveTo(c.x + 22, c.y + 60); ctx.lineTo(c.x + c.w - 22, c.y + 60); }
      else { ctx.moveTo(c.x + 60, c.y + 22); ctx.lineTo(c.x + 60, c.y + c.h - 22); }
      ctx.stroke(); ctx.restore();
    }
  }

  function drawRoomDetails(ctx, r, world, time, game) {
    if (r.type === 'cafeteria') {
      line(ctx, [[r.x + 58, r.y + 52], [r.x + 200, r.y + 64], [r.x + 342, r.y + 52]], ink, 2);
      ctx.beginPath(); ctx.moveTo(r.x + 70, r.y + 57); ctx.quadraticCurveTo(r.x + 200, r.y + 72, r.x + 330, r.y + 57);
      ctx.lineTo(r.x + 324, r.y + 100); ctx.quadraticCurveTo(r.x + 200, r.y + 112, r.x + 76, r.y + 100); ctx.closePath(); ctx.fillStyle = '#e4e7cf'; ctx.fill(); ctx.strokeStyle = '#acbdaf'; ctx.lineWidth = 2; ctx.stroke();
      text(ctx, "WE’RE NOT DEAD", r.x + 200, r.y + 83, 19, '#34a9ae');
      const m = world.meetingPoint;
      oval(ctx, m.x, m.y + 5, 28, 16, '#173447', '#87b8bf', 2);
      box(ctx, m.x - 16, m.y - 14, 32, 20, 6, '#80454e', ink, 3);
      box(ctx, m.x - 10, m.y - 18, 20, 14, 5, '#fb8588', '#f9cab1', 1);
      text(ctx, 'MEETING', m.x, m.y + 27, 8, '#e1dfc9');
    }
    for (const p of r.props) drawProp(ctx, p, time, game);
    if (r.type === 'engine') text(ctx, 'KEEP IT HUMMING', r.x + 200, r.y + 330, 9, '#debba8');
    if (r.type === 'observatory') text(ctx, 'A VERY BIG UNIVERSE', r.x + 200, r.y + 330, 9, '#cebee9');
    if (r.type === 'cargo') text(ctx, 'HANDLE WITH CURIOSITY', r.x + 200, r.y + 370, 8, '#aec9a6');
    for (const decoration of r.decor) drawDecoration(ctx, r, decoration, time);
  }
  function drawProp(ctx, p, time, game) {
    const { x, y, w, h } = p;
    if (p.kind === 'table') {
      for (const dx of [35, 100, 165]) {
        box(ctx, x + dx - 16, y - 9, 32, 16, 6, '#1b4056', ink, 2);
        box(ctx, x + dx - 16, y + h - 4, 32, 16, 6, '#4b93a5', ink, 2);
      }
      box(ctx, x, y + 6, w, h, 23, '#173546');
      box(ctx, x, y, w, h, 23, '#3b9ab5', ink, 4);
      box(ctx, x + 6, y + 5, w - 12, h - 12, 18, '#3d93ae', '#90c6d3', 1.5);
      pizza(ctx, x + 100, y + 35, 29); pizza(ctx, x + 39, y + 25, 17); pizza(ctx, x + 165, y + 46, 17);
      for (const [dx, dy] of [[29, 49], [70, 18], [142, 23], [182, 29]]) {
        oval(ctx, x + dx, y + dy, 4, 5, '#ef725a', '#ac493e', 1);
        oval(ctx, x + dx - 1, y + dy - 1.5, 1.5, 2, '#ffc79b');
      }
      return;
    }
    if (p.kind === 'reactor') {
      const restored = game?.tasks?.some(t => t.id === 'reactor' && t.done);
      box(ctx, x, y + 5, w, h, 12, '#172b40'); box(ctx, x, y, w, h, 12, '#5a7392', ink, 3);
      box(ctx, x + 8, y + 10, w - 16, h - 26, 9, '#1d334b', '#b3c7da', 1.5);
      const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, restored ? '#58b59f' : '#6384c0'); g.addColorStop(.5, restored ? '#c8ffe3' : '#b1dcf4'); g.addColorStop(1, '#5d7d9f');
      box(ctx, x + 16, y + 20, w - 32, h - 46, 6, g);
      for (let d = 34; d < h - 22; d += 24) box(ctx, x + 10, y + d, w - 20, 4, 1, '#2b405b');
      box(ctx, x + 10, y + 21 + (time * 14 % (h - 50)), w - 20, 4, 1, '#cfffff77');
      for (let i = 0; i < 3; i++) oval(ctx, x + 17 + i * 10, y + h - 9, 2.5, 2.5, '#acd9dc');
      return;
    }
    if (p.kind === 'cabinet') {
      box(ctx, x, y + 5, w, h, 8, '#192b39'); box(ctx, x, y, w, h, 8, '#7b8586', ink, 3);
      box(ctx, x + 7, y + 10, w - 14, h - 35, 4, '#263b4c', '#bbc7c4', 1.5);
      const colors = ['#eac27e', '#7bd5bb', '#c0a5dd'];
      for (let i = 0; i < 4; i++) { const yy = y + 26 + i * 18; line(ctx, [[x + 13, yy], [x + w / 2, yy + 5], [x + w - 13, yy]], colors[i % 3], 3); }
      box(ctx, x + 12, y + h - 17, w - 24, 6, 2, '#384e5b'); return;
    }
    if (p.kind === 'console') {
      box(ctx, x, y + 5, w, h, 11, '#1a3042'); box(ctx, x, y, w, h, 11, '#718d9a', ink, 3);
      for (let i = 0; i < 3; i++) {
        const xx = x + 10 + i * 82; box(ctx, xx, y + 8, 75, 39, 5, '#183a4e', '#a4d2d0', 1.5);
        line(ctx, [[xx + 7, y + 33], [xx + 23, y + 17], [xx + 38, y + 31], [xx + 56, y + 14], [xx + 68, y + 21]], '#93e0d3', 1.5);
        for (let j = 0; j < 4; j++) box(ctx, xx + 12 + j * 13, y + 54, 7, 3, 1, '#b5d1d2');
      }
      return;
    }
    if (p.kind === 'bed') {
      box(ctx, x, y + 5, w, h, 11, '#1a3b45'); box(ctx, x, y, w, h, 11, '#7eafb7', ink, 3);
      box(ctx, x + 7, y + 8, 26, h - 16, 7, '#dbe8da'); box(ctx, x + 37, y + 8, w - 44, h - 16, 7, '#b0d0cc');
      line(ctx, [[x + 44, y + 11], [x + 44, y + h - 11]], '#73a2af', 3); return;
    }
    if (p.kind === 'medical') {
      box(ctx, x, y, w, h, 9, '#759ba5', ink, 3); box(ctx, x + 7, y + 8, w - 14, 37, 5, '#214758', '#b3d3d6', 1.5);
      heart(ctx, x + w / 2, y + 26, .7 + Math.sin(time * 2) * .03); box(ctx, x + 18, y + 52, 22, 4, 1, '#b7d4d1'); return;
    }
    if (p.kind === 'crate' || p.kind === 'crystal-box') {
      box(ctx, x, y + 5, w, h, 7, '#203a3d'); box(ctx, x, y, w, h, 7, '#849374', ink, 3);
      box(ctx, x + 7, y + 7, w - 14, h - 14, 4, p.kind === 'crate' ? '#6e805f' : '#29464c', '#b2bc96', 2);
      if (p.kind === 'crate') { line(ctx, [[x + 11, y + 11], [x + w - 11, y + h - 11]], '#aeb68b', 3); line(ctx, [[x + w - 11, y + 11], [x + 11, y + h - 11]], '#aeb68b', 3); }
      else { crystal(ctx, x + 25, y + 32, 19, '#a78bd1'); crystal(ctx, x + 48, y + 27, 24, '#83d4d0'); crystal(ctx, x + 62, y + 37, 12, '#a8c5e6'); }
      return;
    }
    if (p.kind === 'engine') {
      box(ctx, x, y + 7, w, h, 18, '#193040'); box(ctx, x, y, w, h, 18, '#758e9a', ink, 4);
      box(ctx, x + 12, y + 12, w - 24, h - 24, 14, '#2a485c', '#acc2c6', 2);
      for (const cx of [x + 51, x + 129]) {
        oval(ctx, cx, y + 60, 32, 40, '#102f42', '#9fbfc5', 3);
        ctx.save(); ctx.translate(cx, y + 60); ctx.scale(1, 1.2); ctx.rotate(time * .8);
        for (let i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(28, -4, 23, 12); ctx.lineTo(7, 8); ctx.closePath(); ctx.fillStyle = '#7ab6c5'; ctx.fill(); }
        oval(ctx, 0, 0, 7, 7, '#d0e5d8', ink, 2); ctx.restore();
      }
      return;
    }
    if (p.kind === 'window') {
      const cx = x + w / 2, cy = y + h / 2;
      oval(ctx, cx, cy + 3, w / 2, h / 2, '#0c1b2d', '#7995a8', 5);
      oval(ctx, cx, cy, w / 2 - 8, h / 2 - 8, '#111c3c', '#a5b5d655', 2);
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, w / 2 - 10, h / 2 - 10, 0, 0, Math.PI * 2); ctx.clip();
      for (let i = 0; i < 28; i++) { const xx = x + 12 + (Math.sin(i * 17.3) * .5 + .5) * (w - 24), yy = y + 12 + (Math.cos(i * 9.7) * .5 + .5) * (h - 24); oval(ctx, xx, yy, i % 5 === 0 ? 1.6 : .8, i % 5 === 0 ? 1.6 : .8, '#d7d8ef'); }
      oval(ctx, cx + 22, cy - 6, 24, 24, '#967bc0'); oval(ctx, cx + 22, cy - 6, 36, 10, null, '#b7a9dd', 4);
      ctx.restore(); return;
    }
    if (p.kind === 'telescope') {
      line(ctx, [[x + w / 2, y + 70], [x + 3, y + h]], '#9cb7bf', 5);
      line(ctx, [[x + w / 2, y + 70], [x + w - 3, y + h]], '#9cb7bf', 5);
      ctx.save(); ctx.translate(x + w / 2, y + 47); ctx.rotate(-.35);
      box(ctx, -22, -42, 44, 82, 9, '#93a9c1', ink, 3); oval(ctx, 0, -40, 22, 12, '#bdd9dd', ink, 2); oval(ctx, 0, -41, 15, 7, '#436b97'); ctx.restore();
    }
  }

  function drawDecoration(ctx, r, kind, time) {
    if (kind === 'plant') {
      const x = r.x + 40, y = r.y + 85;
      oval(ctx, x, y + 2, 17, 7, '#142b3b55'); box(ctx, x - 12, y - 17, 24, 24, 4, '#bd8464', ink, 2);
      line(ctx, [[x, y - 17], [x, y - 53]], '#4f9f7a', 4);
      for (const [dx, dy, rot] of [[-11, -40, -.6], [11, -47, .6], [-10, -25, -.7], [10, -30, .7]]) {
        ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(rot); oval(ctx, 0, 0, 10, 5, '#81c29a', '#396c58', 1); ctx.restore();
      }
    } else if (kind === 'crystal') {
      const x = r.x + 360, y = r.y + 85;
      oval(ctx, x, y + 6, 19, 8, '#182c3c66'); crystal(ctx, x - 8, y, 19, '#ab93da'); crystal(ctx, x + 5, y - 7, 26, '#96e0db');
    } else if (kind === 'pizza') pizza(ctx, r.x + 56, r.y + 352, 22);
    else if (kind === 'star') {
      const x = r.x + 350, y = r.y + 352, pulse = 1 + Math.sin(time * 2) * .03;
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, radius = (i % 2 ? 9 : 21) * pulse; const xx = x + Math.cos(a) * radius, yy = y + Math.sin(a) * radius; if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
      ctx.closePath(); ctx.fillStyle = '#f3d982'; ctx.fill(); ctx.strokeStyle = '#a48d5b'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  function drawVent(ctx, v, world, time, game, player) {
    box(ctx, v.x - 25, v.y - 16, 50, 32, 6, '#162d3e', themes[world.theme].rim, 2);
    for (let dy = -8; dy <= 8; dy += 8) box(ctx, v.x - 17, v.y + dy, 34, 3, 1, '#819aa8');
    if (game?.role === 'imp' && player && Math.hypot(player.x - v.x, player.y - v.y) < 90) {
      oval(ctx, v.x, v.y, 33 + Math.sin(time * 4) * 2, 23, null, '#ddc6ff', 2); text(ctx, 'VENT', v.x, v.y + 31, 8, '#ddc6ff');
    }
  }
  function drawTask(ctx, task, time, game) {
    const active = game?.role === 'crew' && !task.done;
    const color = task.done ? '#8de3bd' : active ? '#ffe09a' : '#b0ced2';
    if (active) oval(ctx, task.x, task.y, 43, 35, `rgba(255,218,130,${.12 + Math.sin(time * 3) * .035})`);
    box(ctx, task.x - 23, task.y - 21, 46, 42, 8, '#173042', color, 2.5);
    box(ctx, task.x - 16, task.y - 14, 32, 22, 4, task.done ? '#32684f' : '#3d687b');
    text(ctx, task.done ? '✓' : '!', task.x, task.y - 2, 18, color);
    for (let i = 0; i < 3; i++) box(ctx, task.x - 10 + i * 8, task.y + 12, 5, 3, 1, color);
    if (active || task.done) text(ctx, task.done ? 'ONLINE' : task.id === 'reactor' ? 'POWER' : task.id === 'electrical' ? 'WIRES' : 'NAVIGATION', task.x, task.y + 34, 8, color);
  }
  function drawWorld(ctx, world, options) {
    const { time = 0, game = null, player = game?.player || null } = options;
    ctx.save();
    drawFloors(ctx, world, themes[world.theme]);
    for (const room of world.rooms) drawRoomDetails(ctx, room, world, time, game);
    for (const vent of world.vents) drawVent(ctx, vent, world, time, game, player);
    for (const task of game?.tasks || world.taskDefs) drawTask(ctx, task, time, game);
    ctx.restore();
  }
  function drawShadow(ctx, actor, time) {
    if (!actor) return;
    ctx.save(); ctx.translate(actor.x, actor.y + 7); const pulse = 1 + Math.sin(time * 2) * .025; ctx.scale(pulse, pulse);
    ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-75, 115); ctx.bezierCurveTo(-120, 190, -65, 250, 0, 250); ctx.bezierCurveTo(65, 250, 120, 190, 75, 115); ctx.lineTo(15, 0); ctx.closePath(); ctx.fillStyle = '#07182766'; ctx.fill();
    oval(ctx, 0, 153, 38, 16, '#b6dcdf22');
    ctx.beginPath(); ctx.moveTo(-60, 188); ctx.lineTo(-38, 205); ctx.lineTo(-17, 190); ctx.lineTo(3, 207); ctx.lineTo(24, 190); ctx.lineTo(46, 207); ctx.lineTo(62, 188); ctx.lineTo(47, 229); ctx.lineTo(23, 216); ctx.lineTo(0, 233); ctx.lineTo(-23, 216); ctx.lineTo(-46, 229); ctx.closePath(); ctx.fillStyle = '#b5dce533'; ctx.fill(); ctx.restore();
  }

  window.BuildWorld = { types: types.map(t => ({ ...t })), defaults, compile };
})();
