(() => {
  'use strict';

  const W = 1600;
  const H = 1120;
  const rooms = [
    { name: 'Reactor', x: 40, y: 120, w: 320, h: 320, color: '#9cb9ef', floor: '#30455f', tag: '01' },
    { name: 'Cafeteria', x: 480, y: 80, w: 640, h: 400, color: '#c4eee3', floor: '#315a6d', tag: '02' },
    { name: 'Navigation', x: 1240, y: 120, w: 320, h: 320, color: '#a2d5f1', floor: '#304d66', tag: '03' },
    { name: 'Electrical', x: 40, y: 720, w: 320, h: 320, color: '#f1d28d', floor: '#45505a', tag: '04' },
    { name: 'Cargo Bay', x: 560, y: 720, w: 480, h: 320, color: '#b7dba5', floor: '#3b565a', tag: '05' },
    { name: 'Medbay', x: 1240, y: 720, w: 320, h: 320, color: '#a8e7dd', floor: '#355d65', tag: '06' }
  ];
  const corridors = [
    { x: 360, y: 240, w: 120, h: 100 },
    { x: 1120, y: 240, w: 120, h: 100 },
    { x: 360, y: 840, w: 200, h: 100 },
    { x: 1040, y: 840, w: 200, h: 100 },
    { x: 150, y: 440, w: 100, h: 280 },
    { x: 750, y: 480, w: 100, h: 240 },
    { x: 1350, y: 440, w: 100, h: 280 }
  ];
  const obstacles = [
    { x: 610, y: 270, w: 380, h: 95, kind: 'banquet' },
    { x: 80, y: 245, w: 48, h: 130, kind: 'reactor' },
    { x: 282, y: 245, w: 48, h: 110, kind: 'reactor' },
    { x: 1285, y: 175, w: 210, h: 48, kind: 'navigation' },
    { x: 80, y: 780, w: 60, h: 120, kind: 'cabinet' },
    { x: 282, y: 760, w: 44, h: 85, kind: 'cabinet' },
    { x: 600, y: 760, w: 85, h: 65, kind: 'crate' },
    { x: 910, y: 760, w: 80, h: 65, kind: 'crate' },
    { x: 640, y: 930, w: 100, h: 65, kind: 'crate' },
    { x: 830, y: 940, w: 70, h: 55, kind: 'crystals' },
    { x: 1280, y: 775, w: 90, h: 58, kind: 'bed' },
    { x: 1430, y: 900, w: 90, h: 58, kind: 'bed' },
    { x: 1460, y: 765, w: 60, h: 70, kind: 'scanner' }
  ];
  const taskDefs = [
    { id: 'reactor', name: 'Restore power', room: 'Reactor', kind: 'power', x: 200, y: 220 },
    { id: 'electrical', name: 'Repair the wiring', room: 'Electrical', kind: 'wires', x: 200, y: 820 },
    { id: 'navigation', name: 'Restore navigation', room: 'Navigation', kind: 'course', x: 1420, y: 260 }
  ];
  const vents = [
    { x: 300, y: 390, room: 'Reactor' },
    { x: 300, y: 990, room: 'Electrical' },
    { x: 980, y: 990, room: 'Cargo Bay' },
    { x: 1500, y: 390, room: 'Navigation' }
  ];
  const meetingPoint = { x: 1050, y: 400 };
  const spawnPoints = [
    { x: 800, y: 430 },
    { x: 600, y: 230 },
    { x: 680, y: 230 },
    { x: 760, y: 230 },
    { x: 840, y: 230 },
    { x: 920, y: 230 },
    { x: 1000, y: 230 },
    { x: 600, y: 430 },
    { x: 680, y: 430 },
    { x: 920, y: 430 },
    { x: 1000, y: 430 }
  ];

  function rounded(ctx, x, y, w, h, radius, fill, stroke, lineWidth = 2) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }
  function ellipse(ctx, x, y, rx, ry, fill, stroke, lineWidth = 2) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }
  function text(ctx, value, x, y, size = 12, color = '#d4e6ee', align = 'center') {
    ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }
  function line(ctx, points, color, width = 2) {
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function heart(ctx, x, y, scale = 1, color = '#83dcd0') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-19, -4, -10, -18, 0, -9);
    ctx.bezierCurveTo(10, -18, 19, -4, 0, 8); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }

  function drawFloors(ctx) {
    for (const r of corridors) {
      rounded(ctx, r.x - 8, r.y - 8, r.w + 16, r.h + 16, 12, '#121d2d', '#5f788f', 3);
      rounded(ctx, r.x, r.y, r.w, r.h, 4, '#334b60');
    }
    for (const r of rooms) {
      rounded(ctx, r.x - 10, r.y - 10, r.w + 20, r.h + 20, 22, '#142133', '#6e899d', 4);
      rounded(ctx, r.x, r.y, r.w, r.h, 16, r.floor, '#1a2d41', 3);
      ctx.save(); ctx.beginPath(); ctx.roundRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6, 14); ctx.clip();
      ctx.strokeStyle = '#b4d6e912'; ctx.lineWidth = 1;
      for (let x = r.x + 40; x < r.x + r.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); }
      for (let y = r.y + 40; y < r.y + r.h; y += 40) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
      // Bolted wall panels give the ship a hand-built cartoon silhouette.
      for (const x of [r.x + 15, r.x + r.w - 15]) {
        ellipse(ctx, x, r.y + 15, 3, 3, '#9cb7c4');
        ellipse(ctx, x, r.y + r.h - 15, 3, 3, '#9cb7c4');
      }
      ctx.restore();
      text(ctx, r.name.toUpperCase(), r.x + r.w / 2, r.y + 27, r.name === 'Cafeteria' ? 15 : 13, r.color);
      text(ctx, r.tag, r.x + 25, r.y + 27, 9, '#9eb3c0');
    }
    for (const r of corridors) {
      const horizontal = r.w > r.h;
      const doors = horizontal
        ? [{ x: r.x, y: r.y + r.h / 2 }, { x: r.x + r.w, y: r.y + r.h / 2 }]
        : [{ x: r.x + r.w / 2, y: r.y }, { x: r.x + r.w / 2, y: r.y + r.h }];
      for (const d of doors) {
        if (horizontal) {
          rounded(ctx, d.x - 13, d.y - 40, 26, 80, 0, '#334b60');
          rounded(ctx, d.x - 7, d.y - 47, 14, 10, 3, '#a9d4cf', '#172c3e', 2);
          rounded(ctx, d.x - 7, d.y + 37, 14, 10, 3, '#a9d4cf', '#172c3e', 2);
        } else {
          rounded(ctx, d.x - 40, d.y - 13, 80, 26, 0, '#334b60');
          rounded(ctx, d.x - 47, d.y - 7, 10, 14, 3, '#a9d4cf', '#172c3e', 2);
          rounded(ctx, d.x + 37, d.y - 7, 10, 14, 3, '#a9d4cf', '#172c3e', 2);
        }
      }
      ctx.save(); ctx.setLineDash([10, 13]); ctx.strokeStyle = '#bfd5dc35'; ctx.lineWidth = 2;
      ctx.beginPath();
      if (horizontal) { ctx.moveTo(r.x + 24, r.y + r.h / 2); ctx.lineTo(r.x + r.w - 24, r.y + r.h / 2); }
      else { ctx.moveTo(r.x + r.w / 2, r.y + 28); ctx.lineTo(r.x + r.w / 2, r.y + r.h - 28); }
      ctx.stroke(); ctx.restore();
    }
  }

  function pizza(ctx, x, y, radius = 24) {
    ellipse(ctx, x, y + 2, radius + 5, radius * .5 + 5, '#101f30');
    ellipse(ctx, x, y, radius + 5, radius * .5 + 4, '#e9e9d5', '#b4bcaf', 1);
    ellipse(ctx, x, y - 1, radius, radius * .49, '#bb7139', '#634b36', 1);
    ellipse(ctx, x, y - 2, radius - 3, radius * .43, '#f0ca75');
    for (let i = 0; i < 7; i++) {
      const a = i * 2.41, d = radius * (.2 + (i % 3) * .2);
      ellipse(ctx, x + Math.cos(a) * d, y - 2 + Math.sin(a) * d * .45, 3.5, 2, '#bf493f');
    }
    for (let i = 0; i < 4; i++) {
      const a = i * 1.57;
      line(ctx, [[x, y - 1], [x + Math.cos(a) * (radius - 3), y - 1 + Math.sin(a) * radius * .42]], '#c18b4d', .8);
    }
  }
  function tomato(ctx, x, y, scale = 1) {
    ellipse(ctx, x, y + 3 * scale, 6 * scale, 3 * scale, '#10243570');
    ellipse(ctx, x, y, 5 * scale, 5.5 * scale, '#ee6657', '#a9343c', 1);
    ellipse(ctx, x - 1.5 * scale, y - 2 * scale, 1.5 * scale, 2 * scale, '#ffb18a');
    line(ctx, [[x - 2 * scale, y - 4 * scale], [x, y - 6 * scale], [x + 2 * scale, y - 4 * scale]], '#74965a', 1.5);
  }
  function drawCafeteria(ctx, time, game) {
    // The banner is an in-world prop, not an image pasted over the playable area.
    ctx.save(); ctx.strokeStyle = '#101e2f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(514, 115); ctx.quadraticCurveTo(800, 149, 1086, 115); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(535, 120); ctx.quadraticCurveTo(800, 151, 1065, 120);
    ctx.lineTo(1058, 170); ctx.quadraticCurveTo(800, 194, 542, 170); ctx.closePath();
    ctx.fillStyle = '#e2e7cd'; ctx.fill(); ctx.strokeStyle = '#a6b9ad'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, "WE’RE NOT DEAD", 800, 153, 25, '#32aab3');
    line(ctx, [[550, 127], [550, 151]], '#b2beab', 1);
    line(ctx, [[1050, 128], [1047, 149]], '#b2beab', 1);
    ctx.restore();

    // Seats sit under the tabletop edge; only the table itself blocks movement.
    for (const x of [650, 725, 800, 875, 950]) {
      rounded(ctx, x - 20, 256, 40, 22, 7, '#18384f', '#102637', 2);
      rounded(ctx, x - 20, 357, 40, 22, 7, '#18384f', '#102637', 2);
      rounded(ctx, x - 16, 359, 32, 11, 4, '#4f8da0');
    }
    rounded(ctx, 610, 278, 380, 95, 30, '#122b3f');
    rounded(ctx, 610, 270, 380, 95, 30, '#338eae', '#132a3a', 5);
    rounded(ctx, 617, 276, 366, 80, 24, '#378eab', '#81bdd0', 2);
    // Gentle wipe marks, napkins, and plates give the party table some life.
    line(ctx, [[634, 347], [962, 347]], '#c2e7e922', 1.4);
    for (const [x, y] of [[645, 290], [710, 337], [885, 289], [953, 333]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.12);
      rounded(ctx, -9, -5, 18, 10, 2, '#e4e5d3', '#b6c8c6', .8); ctx.restore();
    }
    pizza(ctx, 800, 317, 43);
    pizza(ctx, 662, 316, 21);
    pizza(ctx, 729, 292, 20);
    pizza(ctx, 879, 335, 21);
    pizza(ctx, 944, 298, 19);
    for (const [x, y, s] of [[633, 336, .8], [689, 292, .9], [744, 343, 1], [850, 288, .8], [919, 322, .85], [974, 344, .9]]) tomato(ctx, x, y, s);
    // One escaped tomato is a harmless visual echo of the poster.
    tomato(ctx, 1032, 327, 1);

    const pulse = .5 + .5 * Math.sin(time * 3);
    ellipse(ctx, meetingPoint.x, meetingPoint.y + 7, 34, 18, '#112c40');
    ellipse(ctx, meetingPoint.x, meetingPoint.y + 4, 31, 16, '#57768a', '#b1cad0', 2);
    rounded(ctx, 1035, 382, 30, 20, 5, '#6c3448', '#1c273c', 3);
    rounded(ctx, 1040, 379, 20, 14, 5, '#f77c81', '#fac3aa', 1.5);
    if (game?.blackoutTriggered) {
      ctx.globalAlpha = .25 + pulse * .2; ellipse(ctx, 1050, 390, 30, 22, '#ff9b8055'); ctx.globalAlpha = 1;
    }
    text(ctx, 'MEETING', 1050, 432, 9, '#e0d9c5');
  }

  function drawReactor(ctx, time, game) {
    const restored = game?.tasks?.some(t => t.id === 'reactor' && t.done);
    for (const r of obstacles.filter(o => o.kind === 'reactor')) {
      rounded(ctx, r.x, r.y + 5, r.w, r.h, 12, '#122037');
      rounded(ctx, r.x, r.y, r.w, r.h, 12, '#485d83', '#14243a', 3);
      rounded(ctx, r.x + 8, r.y + 10, r.w - 16, r.h - 23, 9, '#192d4c', '#a4b9d5', 1.5);
      const g = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
      g.addColorStop(0, restored ? '#4ab898' : '#516ba8');
      g.addColorStop(.5, restored ? '#bdffe0' : '#b1d3f6');
      g.addColorStop(1, restored ? '#3c9489' : '#586caa');
      rounded(ctx, r.x + 15, r.y + 19, r.w - 30, r.h - 42, 6, g);
      const energyY = r.y + 22 + ((time * 12) % Math.max(1, r.h - 52));
      rounded(ctx, r.x + 12, energyY, r.w - 24, 5, 2, '#e7f7ff77');
      for (let y = r.y + 32; y < r.y + r.h - 25; y += 23) rounded(ctx, r.x + 9, y, r.w - 18, 4, 1, '#263650');
      for (let i = 0; i < 3; i++) ellipse(ctx, r.x + 14 + i * 10, r.y + r.h - 8, 2, 2, restored ? '#9ae7bd' : '#abbadb');
    }
    line(ctx, [[152, 391], [200, 391], [200, 347], [245, 347]], '#96aad14d', 4);
    text(ctx, 'BACKUP CORE', 200, 405, 9, '#91a9cd');
  }

  function drawNavigation(ctx, time) {
    const r = obstacles.find(o => o.kind === 'navigation');
    rounded(ctx, r.x, r.y + 5, r.w, r.h, 10, '#152536');
    rounded(ctx, r.x, r.y, r.w, r.h, 10, '#687f90', '#162839', 3);
    for (let i = 0; i < 3; i++) {
      const x = r.x + 9 + i * 67;
      rounded(ctx, x, r.y + 7, 59, 30, 4, '#102b42', '#9abec7', 1.5);
      const points = [[x + 5, r.y + 27], [x + 15, r.y + 14], [x + 28, r.y + 25], [x + 44, r.y + 11], [x + 53, r.y + 18]];
      line(ctx, points, '#8cddd8', 1.5);
      const active = points[Math.floor(time + i) % points.length]; ellipse(ctx, active[0], active[1], 2, 2, '#f8e7a8');
      for (let j = 0; j < 3; j++) rounded(ctx, x + 10 + j * 13, r.y + 40, 7, 3, 1, '#a3c8cb');
    }
    // A painted floor compass, rather than another obstacle.
    ellipse(ctx, 1320, 345, 30, 30, '#47687a33', '#7ca9b855', 2);
    line(ctx, [[1320, 323], [1320, 367]], '#9dc0c555', 2);
    line(ctx, [[1298, 345], [1342, 345]], '#9dc0c555', 2);
    ctx.beginPath(); ctx.moveTo(1320, 322); ctx.lineTo(1326, 340); ctx.lineTo(1320, 336); ctx.lineTo(1314, 340); ctx.closePath(); ctx.fillStyle = '#bdd9dc77'; ctx.fill();
  }

  function drawElectrical(ctx, time) {
    for (const r of obstacles.filter(o => o.kind === 'cabinet')) {
      rounded(ctx, r.x, r.y + 5, r.w, r.h, 7, '#192733');
      rounded(ctx, r.x, r.y, r.w, r.h, 7, '#777b80', '#1d2e3c', 3);
      rounded(ctx, r.x + 7, r.y + 10, r.w - 14, r.h - 32, 4, '#25394a', '#aab8bc', 1.5);
      const colors = ['#e5b16a', '#71cdb6', '#b29ada'];
      for (let i = 0; i < 3; i++) {
        const y = r.y + 22 + i * 16;
        line(ctx, [[r.x + 13, y], [r.x + r.w / 2, y + 5], [r.x + r.w - 12, y]], colors[i], 3);
        ellipse(ctx, r.x + 12, y, 2, 2, '#f0dca2');
      }
      rounded(ctx, r.x + 10, r.y + r.h - 15, r.w - 20, 6, 2, '#354753');
    }
    line(ctx, [[91, 940], [142, 940], [142, 965], [230, 965]], '#c2aa6b44', 5);
    for (let i = 0; i < 3; i++) ellipse(ctx, 91 + i * 14, 947, 2.5, 2.5, Math.sin(time * 2 + i) > 0 ? '#e9ca7e' : '#4b5960');
    text(ctx, 'MIND THE WIRES', 185, 1009, 9, '#c6bf9b');
  }

  function drawCrate(ctx, r) {
    rounded(ctx, r.x, r.y + 6, r.w, r.h, 7, '#182f36');
    rounded(ctx, r.x, r.y, r.w, r.h, 7, '#78866a', '#223c3d', 3);
    rounded(ctx, r.x + 7, r.y + 7, r.w - 14, r.h - 14, 3, '#64775e', '#a2b08b', 2);
    line(ctx, [[r.x + 11, r.y + 11], [r.x + r.w - 11, r.y + r.h - 11]], '#9ea980', 3);
    line(ctx, [[r.x + r.w - 11, r.y + 11], [r.x + 11, r.y + r.h - 11]], '#9ea980', 3);
    rounded(ctx, r.x + r.w / 2 - 11, r.y + r.h / 2 - 8, 22, 16, 2, '#d4c69e', '#5b6c58', 1);
    line(ctx, [[r.x + r.w / 2 - 6, r.y + r.h / 2], [r.x + r.w / 2 + 6, r.y + r.h / 2]], '#72806b', 2);
  }
  function crystal(ctx, x, y, size, color, bright) {
    ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size * .45, y - size * .35); ctx.lineTo(x + size * .25, y + size * .55);
    ctx.lineTo(x - size * .3, y + size * .55); ctx.lineTo(x - size * .45, y - size * .25); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#294655'; ctx.lineWidth = 2; ctx.stroke();
    line(ctx, [[x, y - size + 3], [x - size * .08, y + size * .45]], bright, 2);
  }
  function drawCargo(ctx) {
    for (const r of obstacles.filter(o => o.kind === 'crate')) drawCrate(ctx, r);
    const r = obstacles.find(o => o.kind === 'crystals');
    rounded(ctx, r.x, r.y + 6, r.w, r.h, 8, '#1e3a43');
    rounded(ctx, r.x, r.y, r.w, r.h, 8, '#607a70', '#213e48', 3);
    rounded(ctx, r.x + 7, r.y + 7, r.w - 14, r.h - 14, 5, '#233c4a');
    crystal(ctx, r.x + 20, r.y + 26, 17, '#7994dc', '#c3dbff');
    crystal(ctx, r.x + 40, r.y + 22, 22, '#7ed8d7', '#d1fff1');
    crystal(ctx, r.x + 53, r.y + 33, 12, '#ae8dcf', '#edc6fc');
    text(ctx, 'HANDLE WITH CURIOSITY', 800, 1015, 9, '#9ebfb5');
  }

  function drawMedbay(ctx, time) {
    for (const r of obstacles.filter(o => o.kind === 'bed')) {
      rounded(ctx, r.x, r.y + 5, r.w, r.h, 11, '#183843');
      rounded(ctx, r.x, r.y, r.w, r.h, 11, '#82acb0', '#203d4b', 3);
      rounded(ctx, r.x + 7, r.y + 7, 23, r.h - 14, 6, '#d2e4db');
      rounded(ctx, r.x + 33, r.y + 7, r.w - 40, r.h - 14, 6, '#a9c9c5');
      line(ctx, [[r.x + 40, r.y + 10], [r.x + 40, r.y + r.h - 10]], '#6c9da8', 3);
    }
    const r = obstacles.find(o => o.kind === 'scanner');
    rounded(ctx, r.x, r.y + 4, r.w, r.h, 9, '#1c3a46');
    rounded(ctx, r.x, r.y, r.w, r.h, 9, '#638b96', '#243e4d', 3);
    rounded(ctx, r.x + 7, r.y + 8, r.w - 14, 40, 5, '#193448', '#a0c6cd', 1.5);
    heart(ctx, r.x + r.w / 2, r.y + 28, .75 + Math.sin(time * 2) * .025, '#8ce0cf');
    rounded(ctx, r.x + 18, r.y + 56, 24, 5, 2, '#b4d0cc');
    ellipse(ctx, 1360, 961, 25, 25, '#5f929922', '#8ebcba44', 2);
    heart(ctx, 1360, 962, .9, '#94d8cb88');
    text(ctx, 'YOU LOOK MOSTLY ALIVE', 1400, 1008, 9, '#a6c8c5');
  }

  function drawVent(ctx, vent, time, game, player) {
    rounded(ctx, vent.x - 27, vent.y - 17, 54, 34, 7, '#152737', '#86a0ad', 2.5);
    rounded(ctx, vent.x - 22, vent.y - 12, 44, 24, 4, '#0d1e2b');
    for (let y = -8; y <= 8; y += 8) rounded(ctx, vent.x - 17, vent.y + y, 34, 3, 1, '#668293');
    if (game?.role === 'imp' && player && Math.hypot(player.x - vent.x, player.y - vent.y) < 95) {
      const radius = 36 + Math.sin(time * 4) * 2;
      ellipse(ctx, vent.x, vent.y, radius, 24, null, '#d8c3ff', 2);
      text(ctx, 'VENT', vent.x, vent.y + 33, 9, '#d8c3ff');
    }
  }
  function drawTask(ctx, task, time, game) {
    const active = game?.role === 'crew' && !task.done;
    const color = task.done ? '#8de3bd' : active ? '#ffdc83' : '#a5c7ce';
    if (active) {
      const pulse = .12 + (Math.sin(time * 3) + 1) * .035;
      ellipse(ctx, task.x, task.y, 46, 37, `rgba(255,216,118,${pulse})`);
      ellipse(ctx, task.x, task.y, 33, 28, null, '#ffe0a44a', 2);
    }
    rounded(ctx, task.x - 23, task.y - 20, 46, 40, 8, '#172b3b', color, 2.5);
    rounded(ctx, task.x - 16, task.y - 13, 32, 21, 4, task.done ? '#286651' : '#32576a');
    text(ctx, task.done ? '✓' : '!', task.x, task.y - 2, 18, color);
    for (let i = 0; i < 3; i++) rounded(ctx, task.x - 10 + i * 8, task.y + 12, 5, 3, 1, color);
    if (active || task.done) {
      const names = { reactor: 'POWER', electrical: 'WIRES', navigation: 'NAVIGATION' };
      text(ctx, task.done ? 'ONLINE' : names[task.id] || 'TASK', task.x, task.y + 35, 9, color);
    }
  }

  function draw(ctx, options = {}) {
    const { time = 0, game = null, player = game?.player || null } = options;
    ctx.save();
    drawFloors(ctx);
    drawCafeteria(ctx, time, game);
    drawReactor(ctx, time, game);
    drawNavigation(ctx, time);
    drawElectrical(ctx, time);
    drawCargo(ctx);
    drawMedbay(ctx, time);
    for (const vent of vents) drawVent(ctx, vent, time, game, player);
    for (const task of game?.tasks || taskDefs) drawTask(ctx, task, time, game);
    ctx.restore();
  }

  function drawMonsterShadow(ctx, actor, time = 0) {
    if (!actor) return;
    ctx.save();
    ctx.translate(actor.x, actor.y + 5);
    const pulse = 1 + Math.sin(time * 2) * .025;
    ctx.scale(pulse, pulse);
    // A stretched shadow hints at the hidden alien without obscuring the actor.
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(-79, 130);
    ctx.bezierCurveTo(-125, 172, -104, 231, -66, 247);
    ctx.lineTo(-89, 282); ctx.lineTo(89, 282); ctx.lineTo(66, 247);
    ctx.bezierCurveTo(108, 228, 123, 169, 79, 130); ctx.lineTo(14, 0); ctx.closePath();
    ctx.fillStyle = '#06152279'; ctx.fill();
    ellipse(ctx, 4, 163, 43, 19, '#88c5dc19');
    ctx.beginPath();
    ctx.moveTo(-70, 202); ctx.lineTo(-45, 213); ctx.lineTo(-24, 197); ctx.lineTo(-4, 215);
    ctx.lineTo(19, 198); ctx.lineTo(39, 215); ctx.lineTo(66, 202);
    ctx.lineTo(50, 232); ctx.lineTo(26, 220); ctx.lineTo(4, 238);
    ctx.lineTo(-18, 220); ctx.lineTo(-42, 233); ctx.closePath();
    ctx.fillStyle = '#a3d8e22a'; ctx.fill();
    ctx.restore();
  }

  window.WorldArt = { W, H, rooms, corridors, obstacles, taskDefs, vents, meetingPoint, spawnPoints, draw, drawMonsterShadow };
})();
