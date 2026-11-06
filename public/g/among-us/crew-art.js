/* Original vector fan-game sprites inspired by the animated show's crew.
 * Character roles: https://www.innersloth.com/among-us-show/
 * Costume names: https://www.innersloth.com/the-among-us-animated-show-arrives-emergency-meeting-42/
 * Drawings are deliberately simplified for small-screen play; no external assets are required.
 */
(() => {
  'use strict';
  const INK = '#101c2d';
  const roster = Object.freeze([
    { name: 'Red',    hex: '#e84757', shade: '#a92846', title: 'Captain',          outfit: 'captain',  accent: '#f8d078' },
    { name: 'Purple', hex: '#9665d8', shade: '#5c358c', title: 'Security chief',   outfit: 'security', accent: '#d2bbff' },
    { name: 'Blue',   hex: '#487ddb', shade: '#29488e', title: 'Doctor',           outfit: 'doctor',   accent: '#e7f1f5' },
    { name: 'Green',  hex: '#4ea858', shade: '#286b41', title: 'Intern',           outfit: 'intern',   accent: '#bd9970' },
    { name: 'White',  hex: '#edf1f4', shade: '#aebbc9', title: 'Contest winner',   outfit: 'polo',     accent: '#d6e0e8' },
    { name: 'Cyan',   hex: '#65d8d2', shade: '#329baf', title: 'Gemologist',       outfit: 'gemology', accent: '#f7b2d8' },
    { name: 'Black',  hex: '#46505b', shade: '#29343f', title: 'Geologist',        outfit: 'geology',  accent: '#b2a5c8' },
    { name: 'Lime',   hex: '#b5ce5b', shade: '#70863b', title: 'Engineer',         outfit: 'engineer', accent: '#92a3b7' },
    { name: 'Yellow', hex: '#f0d657', shade: '#bf9f3a', title: 'Ship cook',        outfit: 'cook',     accent: '#faf4de' },
    { name: 'Brown',  hex: '#ae7854', shade: '#704938', title: 'Ship cook',        outfit: 'linecook', accent: '#f4eadb' },
    { name: 'Orange', hex: '#f59c46', shade: '#b46232', title: 'HR',               outfit: 'hr',       accent: '#c19569' }
  ].map(Object.freeze));
  const byName = new Map(roster.map(c => [c.name.toLowerCase(), c]));
  const partsCache = new Map();
  const pathCache = new Map();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function resolve(character) {
    if (typeof character === 'string') return byName.get(character.toLowerCase()) || roster[0];
    if (character && typeof character === 'object') {
      const known = byName.get(String(character.name || '').toLowerCase());
      return known ? { ...known, ...character } : { ...roster[0], ...character };
    }
    return roster[0];
  }

  const path = (d, fill, stroke = INK, sw = 3, more = {}) => ({ type: 'path', d, fill, stroke, sw, ...more });
  const rect = (x, y, w, h, r, fill, stroke = INK, sw = 3, more = {}) => ({ type: 'rect', x, y, w, h, r, fill, stroke, sw, ...more });
  const circle = (x, y, r, fill, stroke = INK, sw = 2, more = {}) => ({ type: 'circle', x, y, r, fill, stroke, sw, ...more });
  const ellipse = (x, y, rx, ry, fill, stroke = null, sw = 0, more = {}) => ({ type: 'ellipse', x, y, rx, ry, fill, stroke, sw, ...more });
  const line = (d, stroke, sw = 3, more = {}) => path(d, null, stroke, sw, more);

  function costumeBody(c) {
    const lower = 'M35 78H92V108Q92 116 83 116H76V108H53V116H43Q35 116 35 108Z';
    switch (c.outfit) {
      case 'captain':
        return [
          path(lower, '#a82e42', INK, 2),
          path('M37 77 55 85 64 80 74 86 91 77', '#dc4654', '#ffd478', 3),
          line('M64 82V112', '#f3c05f', 3),
          line('M42 94H87M42 104H87', '#f7cb6b', 4),
          circle(52, 91, 2.5, '#ffdf81', null), circle(76, 91, 2.5, '#ffdf81', null),
          rect(35, 108, 57, 6, 2, '#742637', null, 0)
        ];
      case 'security':
        return [
          path(lower, '#39395c', INK, 2),
          path('M37 79 53 87 63 80 75 88 91 79', '#625284', '#22243e', 2),
          line('M63 84V113', '#8f7cb1', 2),
          rect(35, 104, 57, 8, 1, '#1c263a', null, 0),
          rect(57, 104, 13, 8, 2, '#b6bccd', '#161f32', 2),
          path('M75 88 85 90 84 98 80 101 75 97Z', '#ddd6ed', '#171f31', 2),
          line('M79 91V96', '#7a62a5', 2)
        ];
      case 'doctor':
        return [
          path(lower, '#e6eef1', INK, 2),
          path('M38 79 50 79 63 99 61 113H47L36 108Z', '#f9fcfd', '#8dabbc', 2),
          path('M89 79 77 79 64 99 66 113H82L91 108Z', '#f9fcfd', '#8dabbc', 2),
          path('M54 81 63 92 72 81 68 101H58Z', '#74b7cb', null, 0),
          rect(76, 96, 12, 8, 1, '#d5e6ec', '#9bb6c5', 1.5),
          line('M81 94V100', '#4d76b4', 2),
          circle(63, 105, 2, '#8a9dac', null)
        ];
      case 'intern':
        return [
          path(lower, '#aa815b', INK, 2),
          path('M36 77Q62 94 91 77L85 88Q63 97 42 88Z', '#d6bb92', '#795d47', 2),
          path('M45 82 49 97M80 82 77 97', null, '#f6e2bb', 2.5),
          circle(49, 99, 2, '#f6e2bb', null), circle(77, 99, 2, '#f6e2bb', null),
          rect(48, 103, 32, 10, 5, '#96714f', '#795b43', 1.8),
          line('M51 104 48 109M77 104 80 109', '#d1ad7f', 1.8)
        ];
      case 'polo':
        return [
          path(lower, '#e3eaf1', INK, 2),
          path('M43 79 59 84 64 80 70 84 86 79 80 92 65 85 50 92Z', '#fcfdfe', '#a8b8c8', 2),
          line('M65 86V101', '#adb9c9', 2),
          circle(66, 91, 1.4, '#8599af', null), circle(66, 97, 1.4, '#8599af', null),
          line('M39 112H88', '#bccbd7', 2)
        ];
      case 'gemology':
        return [
          path(lower, '#72d7c8', INK, 2),
          path('M38 88Q53 76 65 89T90 88M39 105Q56 116 67 103T90 103', null, '#dceac3', 7),
          path('M39 95Q52 88 61 97T87 94', null, '#92b9ed', 4),
          path('M49 94Q49 84 59 85Q72 87 66 98Q59 108 53 99Q48 93 57 91', null, '#d4a5dc', 3),
          path('M38 78Q61 94 89 79', null, '#f1e2dd', 4),
          path('M63 85 69 94 63 102 57 94Z', '#c4f9f4', '#396c86', 2),
          line('M63 87V99', '#84c5df', 1.5)
        ];
      case 'geology':
        return [
          path(lower, '#3b4651', INK, 2),
          rect(35, 78, 57, 9, 4, '#121a27', INK, 2),
          rect(59, 78, 9, 9, 2, '#aeb9c7', '#1a2533', 1.5),
          line('M39 96H52M76 96H88', '#65717d', 2),
          path('M46 101 52 99 57 106 53 112 45 110Z', '#747d86', '#25313e', 2)
        ];
      case 'engineer':
        return [
          path(lower, '#707d48', INK, 2),
          rect(43, 78, 8, 26, 2, '#64768a', '#334354', 1.6),
          rect(78, 78, 8, 26, 2, '#64768a', '#334354', 1.6),
          path('M45 92H84V111H46Z', '#586e83', '#344456', 2),
          circle(48, 93, 2.3, '#e5c46c', null), circle(82, 93, 2.3, '#e5c46c', null),
          rect(35, 106, 57, 7, 2, '#895f3e', '#493c32', 1.5),
          rect(58, 105, 12, 8, 2, '#c5ac79', '#4a4437', 1.5),
          path('M82 106v-8m-4-4 3 4h3l3-4', null, '#c4d1dd', 3)
        ];
      case 'cook':
      case 'linecook':
        return [
          path('M45 78H51V87H77V78H84V111Q83 118 77 118H51Q45 118 45 111Z', c.outfit === 'cook' ? '#f5f0d8' : '#ebe3d7', INK, 2),
          line('M49 82H80', '#b6b1a2', 2),
          rect(52, 99, 26, 12, 3, '#fffaf0', '#b8b3a4', 1.5),
          line('M55 103H75', '#c5bcaa', 1.5),
          path('M36 94 45 96M84 96 92 93', null, '#eee6cf', 3)
        ];
      case 'hr':
        return [
          path(lower, '#bb875b', INK, 2),
          path('M36 78 52 84 63 110 47 115 36 108Z', '#d4a273', '#855e43', 2),
          path('M91 78 75 84 63 110 79 115 91 108Z', '#c18d5f', '#855e43', 2),
          path('M53 83 63 88 74 83 64 109Z', '#edb35e', '#8c6445', 1.5),
          line('M63 109V115', '#694b39', 2),
          rect(74, 96, 12, 6, 1, '#b58057', '#835b41', 1.5),
          circle(63, 109, 2.5, '#f2d5a2', '#78543d', 1.5)
        ];
      default: return [];
    }
  }

  function costumeHat(c) {
    switch (c.outfit) {
      case 'captain':
        return [
          path('M29 38Q31 8 62 8Q92 8 99 36Z', '#b92b42', INK, 4.5),
          path('M32 32Q64 23 96 32L97 41Q62 33 31 42Z', '#752b39', INK, 2.5),
          path('M53 35Q85 29 107 39Q92 51 60 43Z', '#802d3b', INK, 4),
          path('M31 34Q64 26 96 34', null, '#f4c265', 4),
          circle(63, 22, 7, '#ebc46e', INK, 2),
          path('M60 21 63 17 66 21 64 26H61Z', '#c15f46', null, 0)
        ];
      case 'security':
        return [
          path('M29 38Q32 13 60 13Q89 13 97 37Z', '#40345f', INK, 4),
          path('M34 34Q65 27 95 35L96 42H33Z', '#252c44', INK, 2),
          path('M58 36Q84 32 106 41Q91 51 61 43Z', '#36344f', INK, 4),
          path('M58 22 68 22 69 29 63 33 57 28Z', '#c7badb', INK, 2)
        ];
      case 'doctor':
        return [
          path('M32 41Q62 29 94 41', null, '#e5edf2', 7),
          circle(43, 29, 12, '#b7c8d8', INK, 4),
          circle(43, 29, 8, '#ecf5f8', '#8596ab', 2),
          circle(43, 29, 3, '#778da6', null),
          line('M39 24 42 23', '#fff', 2)
        ];
      case 'intern':
        return [
          path('M30 38Q33 13 62 13Q89 13 96 39Z', '#87664b', INK, 4),
          path('M31 34Q63 27 94 35L95 43Q62 38 30 44Z', '#a18461', INK, 2.5),
          path('M56 37Q86 30 106 40Q92 49 62 44Z', '#a48a68', INK, 4),
          line('M63 16V29', '#b79a76', 2.5),
          path('M42 27Q42 20 49 18', null, '#a68a63', 2)
        ];
      case 'gemology':
        return [
          path('M30 39Q34 21 62 21Q89 21 97 39L94 46Q61 34 32 46Z', '#ecd7e4', INK, 3),
          path('M32 35Q62 25 95 36', null, '#d68abb', 5),
          ...[35,44,53,62,71,80,89].map((x,i) => circle(x, 36-Math.sin(i/6*Math.PI)*6, 2.1, i%2 ? '#73c6d0':'#fbe4f0', null)),
          path('M31 41 24 53 31 56 39 44Z', '#f2d6e6', INK, 2)
        ];
      case 'engineer':
        return [
          path('M31 39Q33 18 61 18Q87 18 96 39L94 45Q62 34 31 46Z', '#7c8a9f', INK, 3),
          path('M36 28Q57 20 78 27M35 36Q61 27 90 38', null, '#adbac7', 2),
          path('M33 37 20 38 15 49 31 45Z', '#74859b', INK, 3),
          path('M30 43 20 57 28 60 39 44Z', '#8f9cae', INK, 2.5)
        ];
      case 'linecook':
        return [
          path('M32 39 31 20Q30 11 42 10L83 10Q96 11 95 22L94 40Z', '#efece3', INK, 4),
          rect(32, 32, 63, 13, 3, '#faf8ef', INK, 3),
          line('M43 14V29M83 14V29', '#c9c7bf', 2),
          path('M34 21Q64 28 94 20', null, '#d9d5c9', 2)
        ];
      default: return [];
    }
  }

  function partsFor(character, monster = false) {
    const c = resolve(character);
    const key = `${c.name}|${c.hex}|${c.shade}|${c.outfit}|${monster}`;
    if (partsCache.has(key)) return partsCache.get(key);
    const parts = [
      rect(18, 57, 24, 48, 9, c.shade, INK, 4.5),
      rect(37, 103, 19, 27, 6, c.shade, INK, 4.5, { joint: 'left' }),
      rect(70, 103, 19, 27, 6, c.shade, INK, 4.5, { joint: 'right' }),
      path('M33 108V57Q33 24 62 24Q94 24 94 57V108Q94 116 85 116H75V107H54V116H42Q33 116 33 108Z', c.shade, INK, 5),
      path('M38 58Q38 29 63 29Q89 29 89 57V86Q73 99 38 86Z', c.hex, null, 0),
      ...costumeBody(c),
      ...costumeHat(c)
    ];
    if (monster) {
      parts.push(
        path('M53 49Q72 39 97 48Q105 53 104 70L102 85Q79 102 52 85L47 67Q45 55 53 49Z', '#111a28', '#f27d8c', 4),
        path('M53 52 60 66 66 52 72 66 78 52 85 66 92 52 100 65M54 84 61 73 67 88 74 74 81 90 88 74 99 83', '#f8f3df', null, 0),
        path('M53 51Q72 44 99 51', null, '#ffd6d8', 2.5),
        ellipse(88, 48, 5, 2.2, '#ff716e')
      );
    } else {
      parts.push(
        path('M55 45Q77 38 96 47Q105 53 102 65Q98 78 76 79Q56 80 50 70Q44 54 55 45Z', '#7faec9', INK, c.outfit === 'geology' ? 6 : 4.5),
        path('M57 47Q76 42 94 49Q100 52 99 58Q77 65 51 58Q51 51 57 47Z', '#ccecf4', null, 0),
        path('M60 48Q73 45 82 47', null, '#f6fcff', 4.5)
      );
      if (c.outfit === 'geology') {
        parts.push(
          path('M50 66Q57 82 78 80Q96 80 101 69', null, '#171425', 4.5),
          path('M51 68 46 65M99 70 105 67', null, '#171425', 3)
        );
      }
    }
    partsCache.set(key, parts);
    return parts;
  }

  function svgPart(p) {
    const common = `fill="${escape(p.fill || 'none')}"${p.stroke ? ` stroke="${escape(p.stroke)}" stroke-width="${p.sw}" stroke-linejoin="round" stroke-linecap="round"` : ''}`;
    if (p.type === 'path') return `<path d="${p.d}" ${common}/>`;
    if (p.type === 'rect') return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.r}" ${common}/>`;
    if (p.type === 'circle') return `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" ${common}/>`;
    return `<ellipse cx="${p.x}" cy="${p.y}" rx="${p.rx}" ry="${p.ry}" ${common}/>`;
  }

  function avatar(character, options = {}) {
    const c = resolve(character);
    const monster = typeof options === 'object' && !!options.monster;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" fill="none" aria-hidden="true"><ellipse cx="61" cy="133" rx="37" ry="5" fill="#061020" opacity=".28"/>${partsFor(c, monster).map(svgPart).join('')}</svg>`;
  }

  function paint(ctx, p) {
    ctx.fillStyle = p.fill || 'transparent';
    ctx.strokeStyle = p.stroke || 'transparent';
    ctx.lineWidth = p.sw || 0;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (p.type === 'path') {
      let compiled = pathCache.get(p.d);
      if (!compiled) { compiled = new Path2D(p.d); pathCache.set(p.d, compiled); }
      if (p.fill) ctx.fill(compiled);
      if (p.stroke && p.sw) ctx.stroke(compiled);
      return;
    }
    ctx.beginPath();
    if (p.type === 'rect') ctx.roundRect(p.x, p.y, p.w, p.h, p.r);
    else if (p.type === 'circle') ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    else ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    if (p.fill) ctx.fill();
    if (p.stroke && p.sw) ctx.stroke();
  }

  function drawCharacter(ctx, actor, options = {}) {
    if (!ctx || !actor) return;
    const c = resolve(actor.character || actor.color || actor);
    const scale = Number.isFinite(options.scale) ? options.scale : 1;
    const step = Number.isFinite(actor.step) ? actor.step : actor.moving ? (options.time || 0) * 7 : 0;
    const gait = Math.sin(step);
    const face = actor.face === -1 ? -1 : 1;
    const monster = !!options.monster;
    ctx.save();
    ctx.translate(actor.x || 0, actor.y || 0);
    ctx.scale(scale, scale);
    if (options.shadow !== false) {
      ctx.fillStyle = monster ? '#080c21b3' : '#08132269';
      ctx.beginPath(); ctx.ellipse(0, 1, monster ? 24 : 20, monster ? 8 : 6.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (options.player) {
      ctx.strokeStyle = monster ? '#fda5ac' : '#a6ffe4';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.ellipse(0, 1, 24, 8, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.save();
    ctx.scale(face * .45, .45);
    ctx.translate(-61, -130 + gait * 1.4);
    for (const p of partsFor(c, monster)) {
      if (p.joint) { ctx.save(); ctx.translate(0, (p.joint === 'left' ? gait : -gait) * 2.3); paint(ctx, p); ctx.restore(); }
      else paint(ctx, p);
    }
    ctx.restore();
    if (options.label) {
      ctx.font = '700 10px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3; ctx.strokeStyle = '#0b1529';
      const title = options.player ? 'YOU' : c.name;
      ctx.strokeText(title, 0, -59); ctx.fillStyle = options.player ? '#c3ffeb' : '#eff7ff'; ctx.fillText(title, 0, -59);
    }
    ctx.restore();
  }

  window.CrewArt = Object.freeze({ roster, avatar, drawCharacter, getCharacter: resolve });
})();
