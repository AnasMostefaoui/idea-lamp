(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const palette = window.CrewArt.roster;
const icons = {
 use:'<rect x="5" y="4" width="14" height="16" rx="3"/><path d="m9 12 2 2 4-5"/>',
 report:'<path d="M6 21V3m0 1h12l-3 4 3 4H6"/>',
 meeting:'<path d="M4 17h16M6 17v-4a6 6 0 0 1 12 0v4M9 21h6M12 3V1"/>',
 kill:'<path d="m12 3 9 5v8l-9 5-9-5V8z"/><path d="m8 9 3 3-3 3m8-6-3 3 3 3"/>',
 vent:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h10M7 12h10M7 15h10"/>',
 lights:'<path d="m14 2-9 12h6l-1 8 9-12h-6z"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 sound:'<path d="M11 4 5 9H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 talk:'<path d="M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 17-5Z"/><path d="M7 10h10M7 14h6"/>',
 map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/>',
 case:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 11h5m1 3 3 3m-2-2 2-2"/>',
 shift:'<path d="M4 8Q12 1 20 8v8q-8 7-16 0z"/><path d="m5 10 3 4 4-4 4 4 3-4M7 7h1m8 0h1"/>',
 mute:'<path d="M11 4 5 9H2v6h3l6 5zM16 9l5 6m0-6-5 6"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
function avatar(color, options={}) { return window.CrewArt.avatar(color, options); }
let world=window.WorldArt;
let {W,H,rooms,corridors,obstacles,taskDefs,vents,meetingPoint,spawnPoints}=world;
const TILE=40;let COLS=W/TILE,ROWS=H/TILE;
let floors=[...rooms,...corridors],currentDesign=null;
const pointIn=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function onFloor(x,y){return floors.some(r=>pointIn({x,y},r));}
function canStand(x,y,r=15){
 if(![[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]].every(p=>onFloor(...p)))return false;
 return !obstacles.some(o=>x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h);
}
function clearLine(a,b,r=3){let d=distance(a,b),n=Math.ceil(d/12);for(let i=0;i<=n;i++){let t=n?i/n:0;if(!canStand(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,r))return false;}return true;}
const walkCells=[];const walkable=new Set();
function rebuildNavigation(){walkCells.length=0;walkable.clear();for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){let p={x:x*TILE+20,y:y*TILE+20,id:y*COLS+x};if(canStand(p.x,p.y,17)){walkCells.push(p);walkable.add(p.id);}}}
rebuildNavigation();
function nearestCell(p){let best=null,d=Infinity;for(const c of walkCells){const dd=distance(c,p);if(dd<d&&clearLine(p,c,12)){best=c;d=dd;}}if(!best)for(const c of walkCells){const dd=distance(c,p);if(dd<d){best=c;d=dd;}}return best;}
function findPath(from,to){
 const a=nearestCell(from),b=nearestCell(to);if(!a||!b)return[];
 const prev=new Int32Array(COLS*ROWS);prev.fill(-1);prev[a.id]=a.id;const queue=[a.id];let head=0;
 while(head<queue.length){const id=queue[head++];if(id===b.id)break;for(const next of [id-1,id+1,id-COLS,id+COLS]){if(walkable.has(next)&&prev[next]===-1&&((Math.abs(next-id)!==1)||Math.floor(next/COLS)===Math.floor(id/COLS))){prev[next]=id;queue.push(next);}}}
 if(prev[b.id]===-1)return[];const path=[];let id=b.id;while(id!==a.id){path.push({x:(id%COLS)*TILE+20,y:Math.floor(id/COLS)*TILE+20});id=prev[id];}path.push({x:a.x,y:a.y});return path.reverse();
}
const roomAt=p=>rooms.find(r=>pointIn(p,r))?.name||'Connecting hallway';
let selectedColor=palette.findIndex(c=>c.name==='Green'), game=null, roundId=0, sound=false,audioCtx=null;
let view={w:900,h:700,dpr:1},camera={x:0,y:0,zoom:1},lastFrame=0,uiTick=0,toastUntil=0,visualTime=0;
const keys=new Set();let joystick={pointer:null,x:0,y:0};let tapStart=null;
let demoActors=palette.map((color,i)=>({id:i,color,...spawnPoints[i],face:i%2?1:-1,step:0,alive:true,monsterTimer:0}));
const stars=Array.from({length:90},(_,i)=>({x:(Math.sin(i*18.71)*.5+.5),y:(Math.cos(i*42.61)*.5+.5),size:i%7===0?1.4:.7,phase:i}));
function setWorld(nextWorld,design=null){
 world=nextWorld;({W,H,rooms,corridors,obstacles,taskDefs,vents,meetingPoint,spawnPoints}=world);COLS=W/TILE;ROWS=H/TILE;floors=[...rooms,...corridors];rebuildNavigation();
 currentDesign=design?JSON.parse(JSON.stringify(design)):null;
 demoActors=palette.map((color,i)=>({id:i,color,...spawnPoints[i],face:i%2?1:-1,step:0,alive:true,monsterTimer:0}));
 const name=currentDesign?(String(currentDesign.name||'My Skeld').trim().slice(0,24)||'My Skeld'):'The Skeld';if(currentDesign)currentDesign.name=name;$('activeShipName').textContent=currentDesign?name:'The show’s Skeld';$('resetShip').hidden=!currentDesign;$('episodeShip').textContent='EPISODE 01 · '+name.toUpperCase();$('footerShip').textContent=name.toUpperCase();
}
function applyShip(design){const result=window.BuildWorld.compile(design);if(!result.ok)return false;setWorld(result.world,result.world.design||design);try{localStorage.setItem('crew-chaos-ship-choice','custom');}catch{}return true;}
function openShipBuilder(){if(game)return;window.ShipBuilder.open({design:currentDesign||window.ShipBuilder.load()||window.BuildWorld.defaults(),onApply:design=>{if(applyShip(design))toast('Your ship is ready. Choose a mode to play.');},onPlay:design=>{if(applyShip(design))startGame('crew');},onClose:()=>$('buildShipBtn').focus()});}
function openFinale(){if(window.FinaleGame?.isOpen())return;toLobby();window.FinaleGame.open({onExit:()=>{toLobby();$('playFinale').focus();}});}
function escapeText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function allActors(){return game?[game.player,...game.bots]:demoActors;}
function actorById(id){return allActors().find(a=>a.id===id);}
const KILL_DURATION=120;
function isKillMode(){return game?.variant==='kill';}
function killCount(){return game.bots.filter(a=>!a.alive).length;}
function huntTime(){const seconds=Math.ceil(Math.max(0,KILL_DURATION-game.elapsed));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
function nameOf(a){return a.id===0?`${a.color.name} (you)`:a.color.name;}
function tone(freq=600,duration=.09,type='sine',volume=.05){if(!sound)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}catch{}}
function toast(text,danger=false){$('toast').textContent=text;$('toast').className='toast visible'+(danger?' danger':'');toastUntil=performance.now()+3400;}
function log(text){if(!game)return;game.logs.unshift(text);game.logs=game.logs.slice(0,3);$('eventLog').innerHTML=game.logs.map(s=>`<p>${s}</p>`).join('');}
function resetInput(){keys.clear();joystick.x=joystick.y=0;joystick.pointer=null;$('stick').style.transform='translate(0,0)';if(game)game.player.path=[];}
function resize(){const rect=canvas.getBoundingClientRect();view={w:rect.width,h:rect.height,dpr:Math.min(window.devicePixelRatio||1,2)};canvas.width=Math.round(view.w*view.dpr);canvas.height=Math.round(view.h*view.dpr);}
new ResizeObserver(resize).observe(canvas);
const characterLines={
 Red:'Crew, save the ship. Then we can save dinner.',Purple:'Tell me what you saw, not what you guessed.',Blue:'Everyone breathe. Preferably inside the ship.',Green:'I volunteered! Wait—what did I volunteer for?',White:'Does this ship have a complaint button?',Cyan:'My crystal says… we need the power back.',Black:'A rock would be easier to interview.',Lime:'The lights again? I just fixed those!',Yellow:'Nobody gets seconds until the ship is safe.',Brown:'I can guard the pizza. Very carefully.',Orange:'One disaster at a time, please.'
};
function renderColorSelection(){
 const chosen=palette[selectedColor];
 $('colors').innerHTML=palette.map((c,i)=>`<button class="cast-choice" style="--suit:${c.hex}" aria-label="Play as ${c.name}, ${c.title}" aria-pressed="${i===selectedColor}" data-color="${i}">${avatar(c)}<span>${c.name}</span></button>`).join('');
 $('heroCrew').innerHTML=avatar(chosen);$('selectedName').textContent=chosen.name.toUpperCase();$('selectedName').style.color=chosen.hex;$('selectedRole').textContent=chosen.title;$('selectedQuote').textContent='“'+characterLines[chosen.name]+'”';
 $('crewOptionIcon').innerHTML=avatar(chosen);$('impOptionIcon').innerHTML=avatar(chosen,{monster:true});$('killOptionIcon').innerHTML=avatar(chosen,{monster:true});$('finaleOptionIcon').innerHTML=avatar(palette.find(c=>c.name==='Green'),{monster:true});
 $('colors').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const scroll=$('colors').scrollLeft;selectedColor=Number(b.dataset.color);renderColorSelection();$('colors').scrollLeft=scroll;renderCrew();tone(500);}));
}
function renderCrew(){const actors=game?allActors():[palette[selectedColor],...palette.filter((_,i)=>i!==selectedColor)].map((color,i)=>({id:i,color,alive:true}));$('crewList').innerHTML=actors.map(a=>`<div class="crew-member ${a.alive?'':'out'}" title="${a.color.title}">${avatar(a.color)}<span>${a.color.name}<small>${a.id===0?'YOU · ':''}${a.color.title.replace('Captain of The Skeld','Captain').replace('Chief of Security','Security').replace('Unpaid Intern','Intern').replace('Ship Cook #','Cook ').replace('Contest Winner','Guest')}</small></span></div>`).join('');$('crewManifestCount').textContent=String(actors.filter(a=>a.alive).length).padStart(2,'0');}
function caseMatches(){if(!game||game.role!=='crew'||game.case.collected.length<2)return[];return game.case.clueSets[0].filter(id=>game.case.clueSets[1].includes(id));}
function cluePortraits(ids){return ids.map(id=>{const a=actorById(id);return `<div class="clue-portrait">${avatar(a.color)}<span>${a.color.name}</span></div>`;}).join('');}
function renderCase(){
 if(isKillMode()){$('clueCount').textContent=huntTime()+' LEFT';$('caseBadge').textContent='0';$('caseSummary').textContent='Chase every crewmate. KILL recharges in 3 seconds. Vents cross the ship; SHIFT gives you a speed boost. The clock pauses with the map.';return;}
 const count=game?.role==='crew'?game.case.collected.length:0;$('clueCount').textContent=`${count} / 2`;$('caseBadge').textContent=count;
 if(!game){$('caseSummary').textContent='Restore the systems to recover clues.';return;}
 if(game.role==='imp'){$('caseSummary').textContent='Stay out of sight. A witness can expose your disguise.';return;}
 const matches=caseMatches();if(matches.length===1){$('caseSummary').innerHTML=`Both traces match <strong style="color:${actorById(matches[0]).color.hex}">${actorById(matches[0]).color.name}</strong>. Call a meeting in the cafeteria.`;}
 else if(count){const set=game.case.clueSets[game.case.collected[0]];$('caseSummary').innerHTML=`One system trace recovered.<div class="clue-mini-portraits">${set.map(id=>avatar(actorById(id).color)).join('')}</div>Find the second trace to narrow it down.`;}
 else $('caseSummary').textContent='Fix the reactor and wiring to recover two traces from the blackout.';
}
function renderTasks(){
 $('taskHeading').textContent=isKillMode()?'KILL MODE PLAYBOOK':game?(game.role==='crew'?'EPISODE OBJECTIVES':'IMPOSTOR PLAYBOOK'):'YOUR EPISODE';
 if(!game){$('taskList').innerHTML=[['01','Join the pizza party','Choose one of the 11 characters.'],['02','Investigate the blackout','Explore, talk, and find clues.'],['03','Call out the impostor','Your vote decides the ending.']].map(([i,t,d])=>`<div class="brief-item"><span class="brief-number">${i}</span><p>${t}<br><small>${d}</small></p></div>`).join('');return;}
 if(isKillMode()){$('taskList').innerHTML=[['01','Catch all 10 crewmates','Get close and tap KILL, or press E.'],['02','Beat the 2-minute clock','Kills recharge every 3 seconds.'],['03','Race around your ship','Use VENT and SHIFT to catch runners.']].map(([i,t,d])=>`<div class="brief-item"><span class="brief-number">${i}</span><p>${t}<br><small>${d}</small></p></div>`).join('');return;}
 if(game.role==='crew'){
 $('taskList').innerHTML=game.tasks.map((t,i)=>`<button class="mission-item ${t.done?'completed':''}" data-route="${t.id}" ${t.done?'disabled':''}><span class="brief-number">${t.done?'✓':String(i+1).padStart(2,'0')}</span><p>${t.name}<br><small>${t.room} · tap for directions</small></p></button>`).join('')+`<button class="mission-item ${caseMatches().length?'finale':''}" data-route="meeting"><span class="brief-number">04</span><p>Find the impostor<br><small>Cafeteria · emergency meeting</small></p></button>`;
 $('taskList').querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{if(game.mode==='playing')guideTo(b.dataset.route);});
 }else $('taskList').innerHTML=[['01','Blend in with the crew','Talk and move between rooms.'],['02','Sabotage and shapeshift','Lights + monster form = a quick escape.'],['03','Avoid witnesses','Reduce the crew to one.']].map(([i,t,d])=>`<div class="brief-item"><span class="brief-number">${i}</span><p>${t}<br><small>${d}</small></p></div>`).join('');
}
function startGame(role,variant='episode'){
 const kill=variant==='kill';if(kill)role='imp';
 roundId++;const colors=[palette[selectedColor],...shuffle(palette.filter((_,i)=>i!==selectedColor))];
 const impIndex=role==='imp'?0:1+Math.floor(Math.random()*(colors.length-1));
 const actors=colors.map((color,i)=>({id:i,color,...spawnPoints[i],role:i===impIndex?'imp':'crew',alive:true,face:i<7?1:-1,step:0,path:[],wait:kill ? .1+Math.random()*.7 : 5+i*.2,think:0,cooldown:i===0?(kill?1:8):38,stuck:0,invulnerable:i===0?100:0,monsterTimer:0,fleeing:0}));
 const innocentIds=shuffle(actors.filter(a=>a.id!==impIndex&&a.id!==0).map(a=>a.id));
 game={id:roundId,mode:'playing',role,variant:kill?'kill':'episode',player:actors[0],bots:actors.slice(1),tasks:taskDefs.map(t=>({...t,done:false})),bodies:[],elapsed:0,crewWork:0,lights:0,lightsCooldown:0,ventCooldown:0,shiftCooldown:0,emergencyLeft:2,meetingCooldown:0,logs:[],pendingReport:null,meeting:null,blackoutTriggered:kill,autoRoute:null,talked:[],case:{culpritId:impIndex,capturedAt:null,clueSets:[shuffle([impIndex,...innocentIds.slice(0,3)]),shuffle([impIndex,...innocentIds.slice(3,6)])],collected:[]}};
 $('lobby').hidden=true;$('modalBackdrop').hidden=true;for(const id of ['hud','location','objective','controls','pauseBtn','mapBtn','caseBtn','episodeTag','openingLine'])$(id).hidden=false;
 $('rolePill').textContent=kill?'KILL MODE':role==='crew'?'CREWMATE':'IMPOSTOR';$('rolePill').className='role-pill'+(role==='imp'?' impostor':'');$('useBtn').className='action use'+(role==='imp'?' kill':'');$('useIcon').innerHTML=icon(role==='crew'?'use':'kill');
 for(const id of ['reportBtn','talkBtn','caseBtn'])$(id).hidden=kill;$('crewLabel').textContent=kill?'LEFT':'ABOARD';
 $('abilityIcon').innerHTML=icon(role==='crew'?'meeting':'vent');$('abilityLabel').textContent=role==='crew'?'MEETING':'VENT';$('abilityKey').textContent=role==='crew'?'Q':'V';$('sabotageBtn').hidden=role!=='imp';$('shiftBtn').hidden=role!=='imp';
 $('progressLabel').textContent=kill?'KILLS':role==='crew'?'SHIP SYSTEMS':'CREW TASKS';$('progressFill').style.background=role==='crew'?'var(--mint)':'var(--red)';
 $('openingLine').innerHTML=role==='crew'?'<strong>CAPTAIN RED</strong><span>“A pizza party where absolutely everything will be fine.”</span>':'<strong>YOUR SECRET</strong><span>Smile for the crew. They don’t know what’s hiding inside.</span>';
 resetInput();renderCrew();renderTasks();renderCase();updateHUD();log(kill?'The hunt is on! Catch all 10 crewmates before the 2-minute clock runs out.':`You’re ${actors[0].color.name}, ${actors[0].color.title}. Welcome to the pizza party.`);tone(role==='crew'?660:220,.2);
}
function toLobby(){game=null;roundId++;resetInput();$('lobby').hidden=false;$('modalBackdrop').hidden=true;for(const id of ['hud','location','objective','controls','pauseBtn','lightsWarning','mapBtn','caseBtn','episodeTag','openingLine'])$(id).hidden=true;$('toast').className='toast';$('eventLog').innerHTML='<p>The pizza party is about to begin.</p>';$('shipStatus').textContent='ALL SYSTEMS NOMINAL';renderCrew();renderTasks();renderCase();}
function guideTo(destination){if(!game)return;let target,label;if(destination.startsWith('room:')){const room=rooms[Number(destination.slice(5))];if(!room)return;target=walkCells.filter(p=>pointIn(p,room)).sort((a,b)=>distance(a,{x:room.x+room.w/2,y:room.y+room.h/2})-distance(b,{x:room.x+room.w/2,y:room.y+room.h/2}))[0];label=room.name;}else{if(isKillMode())return;target=destination==='meeting'?meetingPoint:game.tasks.find(t=>t.id===destination);label=target?.room;}if(!target)return;if(game.mode!=='playing')hideModal();game.player.path=findPath(game.player,target);game.autoRoute=destination;toast(destination==='meeting'?'Heading to the cafeteria meeting button.':`Heading to ${label}. You can steer any time.`);}
function showMap(){if(!game||!['playing','paused'].includes(game.mode))return;game.mode='map';
 const kill=isKillMode(),markers=kill?game.bots.filter(a=>a.alive).map(a=>`<circle cx="${a.x}" cy="${a.y}" r="17" fill="${a.color.hex}" stroke="#e4f6ff" stroke-width="4"/>`).join(''):game.tasks.map(t=>`<circle cx="${t.x}" cy="${t.y}" r="23" fill="${t.done?'#5fe0b3':'#ffcb70'}"/><text x="${t.x}" y="${t.y+10}" text-anchor="middle" font-size="32" font-weight="bold" fill="#14394b">${t.done?'✓':'!'}</text>`).join('')+`<circle cx="${meetingPoint.x}" cy="${meetingPoint.y}" r="20" fill="#f87d8b"/>`;
 const map=`<svg class="map-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of your ship rooms">${corridors.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#263f55"/>`).join('')}${rooms.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="22" fill="#284a5b" stroke="#7894a5" stroke-width="8"/><text x="${r.x+r.w/2}" y="${r.y+60}" text-anchor="middle" fill="#dcebf1" font-family="sans-serif" font-size="27">${r.name}</text>`).join('')}${markers}<circle cx="${game.player.x}" cy="${game.player.y}" r="25" fill="${game.player.color.hex}" stroke="white" stroke-width="8"/><text x="${game.player.x}" y="${game.player.y-40}" text-anchor="middle" fill="white" font-family="sans-serif" font-size="30">YOU</text></svg>`;
 const destinations=kill?rooms.map((r,i)=>`<button data-go="room:${i}"><span>${r.name}</span><strong>GO →</strong></button>`).join(''):game.tasks.map(t=>`<button data-go="${t.id}" ${t.done?'disabled':''}><span>${t.name}</span><strong>${t.done?'DONE':t.room+' →'}</strong></button>`).join('')+'<button data-go="meeting"><span>Emergency meeting</span><strong>Cafeteria →</strong></button>';
 showModal(`<span class="eyebrow">${escapeText(currentDesign?.name||'THE SKELD')}</span><h2 id="modalTitle">Where to?</h2>${map}<p class="map-hint">${kill?'Colored dots are the remaining crew. The clock is paused. ':''}Pick a destination and your character will walk there.</p><div class="map-destinations">${destinations}</div><div class="modal-actions"><button class="secondary" id="closeMap">Back to the ship</button></div>`);$('modal').querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>guideTo(b.dataset.go));$('closeMap').onclick=hideModal;
}
function showEvidence(){if(!game||isKillMode()||!['playing','paused'].includes(game.mode))return;game.mode='evidence';
 const crew=game.role==='crew',matches=caseMatches();
 const cards=crew?[0,1].map(i=>game.case.collected.includes(i)?`<section class="clue-card"><strong>TRACE ${i+1} · ${i===0?'REACTOR PANEL':'ELECTRICAL LOCK'}</strong><p>${i===0?'The damaged power panel matches one of these crew badges.':'The blackout wiring trace matches one of these badges.'}</p><div class="clue-portraits">${cluePortraits(game.case.clueSets[i])}</div></section>`:`<section class="clue-card locked-clue"><strong>TRACE ${i+1} · NOT FOUND</strong><p>${i===0?'Restore power in Reactor.':'Repair the wiring in Electrical.'}</p></section>`).join(''):'<section class="clue-card"><strong>KEEP YOUR DISGUISE</strong><p>Witnesses can expose an elimination, vent use, or your monster form. Cut the lights before making a risky move.</p></section>';
 showModal(`<span class="eyebrow">${crew?'PURPLE’S CASE BOARD':'IMPOSTOR NOTES'}</span><h2 id="modalTitle">${crew?'Follow the clues.':'Keep it sneaky.'}</h2><div class="evidence-rows">${cards}</div>${matches.length===1?`<div class="deduction">Only <strong>${actorById(matches[0]).color.name}</strong> matches both traces.<br>Bring the evidence to a cafeteria meeting.</div>`:''}<div class="modal-actions"><button class="primary" id="closeEvidence">Back to the ship</button>${matches.length?'<button class="secondary" id="caseMeeting">Go to meeting</button>':''}</div>`);$('closeEvidence').onclick=hideModal;if($('caseMeeting'))$('caseMeeting').onclick=()=>guideTo('meeting');
}
function nearbyCrew(){return game.bots.filter(a=>a.alive&&visibleTo(game.player,a,115)).sort((a,b)=>distance(game.player,a)-distance(game.player,b))[0];}
function talkAction(){if(!game||isKillMode()||game.mode!=='playing')return;const who=nearbyCrew();if(!who)return;game.mode='talk';if(!game.talked.includes(who.id))game.talked.push(who.id);let hint='Explore the ship. Tap the map if you need directions.';
 if(game.role==='crew')hint=caseMatches().length?'Both recovered traces point to the same badge. Check your evidence board.':game.case.collected.length?'One clue is only half the story. Restore the other system.':'The reactor panel and electrical lock recorded traces of the blackout.';
 showModal(`<span class="eyebrow">TALK TO THE CREW</span><h2 id="modalTitle" class="invisible-note">Talking to ${who.color.name}</h2><div class="dialogue-person">${avatar(who.color)}<div><span>THE SKELD CREW</span><strong style="color:${who.color.hex}">${who.color.name}</strong><span>${who.color.title}</span></div></div><div class="dialogue-line">“${characterLines[who.color.name]}”</div><p class="dialogue-hint">${hint}</p><div class="modal-actions"><button class="primary" id="closeTalk">Back to the ship</button><button class="secondary" id="talkMap">Show the map</button></div>`);$('closeTalk').onclick=hideModal;$('talkMap').onclick=()=>{hideModal();showMap();};tone(470,.08);
}
function shiftAction(){if(!game||game.mode!=='playing'||game.role!=='imp'||game.shiftCooldown>0)return;game.player.monsterTimer=6;game.shiftCooldown=26;toast(isKillMode()?'Monster form! Speed boost for 6 seconds.':'Monster form! Move fast. Don’t let them see you.',true);tone(120,.3,'triangle');log(isKillMode()?'Monster speed boost! Catch the runners.':'Your disguise splits open for 6 seconds.');}
function awardTask(task){if(task.done)return;task.done=true;const clue=task.id==='reactor'?0:task.id==='electrical'?1:null;if(clue!==null&&!game.case.collected.includes(clue))game.case.collected.push(clue);if(game.tasks.every(t=>t.done))game.emergencyLeft=Math.max(1,game.emergencyLeft);renderTasks();renderCase();updateHUD();log(clue===null?'Navigation restored. The ship is ready for the final meeting.':`Recovered trace ${clue+1} from ${task.room}.`);}

function showModal(html){resetInput();$('modal').innerHTML=html;$('modalBackdrop').hidden=false;$('modal').focus();}
function hideModal(){ $('modalBackdrop').hidden=true;resetInput();if(game)game.mode='playing';}
function pauseGame(){if(!game||game.mode!=='playing')return;game.mode='paused';showModal('<span class="eyebrow">TAKE YOUR TIME</span><h2 id="modalTitle">Shift paused.</h2><p>The ship will be right here when you’re ready.</p><div class="modal-actions"><button class="primary" id="resumeGame">Keep playing</button><button class="secondary" id="leaveGame">Back to lobby</button></div>');$('resumeGame').onclick=hideModal;$('leaveGame').onclick=toLobby;}
function showHelp(){if(game&&!['playing','paused'].includes(game.mode))return;const previous=game?.mode||'lobby';if(game)game.mode='help';showModal('<span class="eyebrow">PLAY THE EPISODE</span><h2 id="modalTitle">A quick crew briefing</h2><div class="help-grid"><div><strong style="color:var(--mint)">THE MYSTERY</strong><p>Fix three systems. Two of them reveal badge traces. Find the character in both traces, then call a meeting in Cafeteria and vote.</p></div><div><strong style="color:var(--red)">THE IMPOSTOR</strong><p>Blend in, cut the lights, and use vents. SHIFT reveals your monster form for 6 seconds. Avoid witnesses and leave just one crewmate.</p></div></div><p>Drag the joystick or tap the floor to move. Use the map for automatic directions. TALK to characters. Puzzles, conversations, and meetings pause the action.</p><p><strong>BUILD A SHIP:</strong> From the lobby, choose rooms, tap hallways to connect them, add decorations, then play your episode aboard it.</p><p><strong>THE SHOW FINALE:</strong> Choose DEFEAT GREEN in the lobby. Team up as Red and Purple with a salt-water soaker, then eject the alien eggs.</p><p class="help-keys">WASD / arrows · E use · T talk · R report<br>Q meeting · V vent · F lights · X shapeshift<br>M map · C clues · Esc pause</p><div class="modal-actions"><button class="primary" id="closeHelp">Let’s play!</button></div>');$('closeHelp').onclick=()=>{if(game)hideModal();else $('modalBackdrop').hidden=true;};}

function nearbyTask(){if(!game.blackoutTriggered)return;return game.tasks.find(t=>!t.done&&distance(game.player,t)<88&&clearLine(game.player,t,3));}
function nearbyBody(){return game.bodies.find(b=>!b.reported&&distance(game.player,b)<110&&clearLine(game.player,b,2));}
function nearbyVent(){return vents.findIndex(v=>distance(game.player,v)<70);}
function nearbyVictim(){return game.bots.filter(a=>a.alive&&a.role==='crew'&&distance(game.player,a)<65&&clearLine(game.player,a,4)).sort((a,b)=>distance(game.player,a)-distance(game.player,b))[0];}
function updateHUD(){if(!game)return;const active=game.mode==='playing',crew=game.role==='crew',kill=isKillMode(),n=game.tasks.filter(t=>t.done).length,kills=kill?killCount():0;
 $('progressValue').textContent=kill?`${kills} / 10`:crew?`${n} / 3`:`${Math.floor(game.crewWork*100)}%`;$('progressFill').style.width=(kill?kills/10:crew?n/3:game.crewWork)*100+'%';$('aliveCount').textContent=kill?game.bots.length-kills:allActors().filter(a=>a.alive).length;$('locationName').textContent=roomAt(game.player).toUpperCase();
 $('useLabel').textContent=crew?'USE':game.player.cooldown>0?`${Math.ceil(game.player.cooldown)}s`:kill?'KILL':'ELIMINATE';$('useBtn').disabled=!active||(crew?!nearbyTask():game.player.cooldown>0||!nearbyVictim());$('talkBtn').disabled=kill||!active||!nearbyCrew();
 $('reportBtn').disabled=kill||!active||!nearbyBody();$('abilityBtn').disabled=!active||(crew?game.meetingCooldown>0||(game.emergencyLeft===0&&!game.tasks.every(t=>t.done))||distance(game.player,meetingPoint)>95:game.ventCooldown>0||nearbyVent()<0);
 $('abilityLabel').textContent=crew?(game.meetingCooldown>0?`${Math.ceil(game.meetingCooldown)}s`:'MEETING'):game.ventCooldown>0?`${Math.ceil(game.ventCooldown)}s`:'VENT';
 $('sabotageBtn').disabled=!active||game.lightsCooldown>0;$('sabotageLabel').textContent=game.lightsCooldown>0?`${Math.ceil(game.lightsCooldown)}s`:'LIGHTS';$('shiftBtn').disabled=!active||game.shiftCooldown>0;$('shiftLabel').textContent=game.player.monsterTimer>0?`${Math.ceil(game.player.monsterTimer)}s`:game.shiftCooldown>0?`${Math.ceil(game.shiftCooldown)}s`:'SHIFT';
 $('lightsWarning').hidden=game.lights<=0;$('lightsTimer').textContent=Math.ceil(game.lights)+'s';$('openingLine').hidden=kill||game.elapsed>3||game.mode!=='playing';
 $('episodeTag').textContent=kill?`KILL MODE · ${huntTime()} LEFT`:!game.blackoutTriggered?'ACT 1 · PIZZA PARTY':crew&&n===3?'ACT 3 · THE FINAL MEETING':crew?'ACT 2 · FIND THE IMPOSTOR':'ACT 2 · BLEND IN';
 const next=game.tasks.find(t=>!t.done);$('objective').textContent=kill?`Catch all 10 · ${game.bots.length-kills} left · get close and tap KILL` :!game.blackoutTriggered?'Meet your crew. Enjoy the pizza…':crew?(next?`Next: ${next.name} · ${next.room} · tap the map`:'All systems ready. Return to Cafeteria and vote.'):'Blend in. Sabotage. Avoid witnesses.';
 $('shipStatus').textContent=kill?'THE HUNT IS ON':game.lights>0?'BLACKOUT IN PROGRESS':n===3?'SYSTEMS RESTORED':'INVESTIGATION IN PROGRESS';if(kill)$('clueCount').textContent=huntTime()+' LEFT';
}

function move(a,dx,dy){const old={x:a.x,y:a.y};if(canStand(a.x+dx,a.y))a.x+=dx;if(canStand(a.x,a.y+dy))a.y+=dy;if(Math.abs(dx)>.1)a.face=dx>0?1:-1;const moved=distance(old,a);if(moved>.05)a.step+=moved*.13;return moved;}
function followPath(a,speed,dt){if(!a.path.length)return false;let p=a.path[0],d=distance(a,p);if(d<5){a.path.shift();return true;}const step=Math.min(d,speed*dt),moved=move(a,(p.x-a.x)/d*step,(p.y-a.y)/d*step);a.stuck=moved<.05?a.stuck+dt:0;if(a.stuck>1){a.path=[];a.stuck=0;}return true;}
function roam(a){const favorite={Red:'Navigation',Purple:'Cafeteria',Blue:'Medbay',Green:'Cafeteria',White:'Cafeteria',Cyan:'Cargo Bay',Black:'Cargo Bay',Lime:Math.random()<.5?'Electrical':'Reactor',Yellow:'Cafeteria',Brown:'Cafeteria',Orange:'Cafeteria'};const room=(Math.random()<.45?rooms.find(r=>r.name===favorite[a.color.name]):null)||rooms[Math.floor(Math.random()*rooms.length)];const pts=walkCells.filter(p=>pointIn(p,{x:room.x+35,y:room.y+65,w:room.w-70,h:room.h-100}));const target=pts[Math.floor(Math.random()*pts.length)];a.path=findPath(a,target);a.wait=2+Math.random()*3;}
function flee(a){
 const currentDistance=distance(a,game.player);
 const candidates=shuffle(walkCells.filter(p=>distance(p,game.player)>currentDistance+80&&distance(p,a)>100&&distance(p,a)<620));
 candidates.sort((p,q)=>(distance(q,game.player)-distance(q,a)*.25)-(distance(p,game.player)-distance(p,a)*.25));
 for(const target of candidates.slice(0,8)){const path=findPath(a,target);if(path.length>1){a.path=path;a.wait=0;a.fleeing=1.5;return;}}
 if(!a.path.length)roam(a);
}
function sightLine(a,b){const d=distance(a,b),n=Math.ceil(d/12);for(let i=0;i<=n;i++){const t=n?i/n:0;if(!onFloor(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;}
function visibleTo(observer,target,range){return distance(observer,target)<range&&sightLine(observer,target);}

function eliminate(killer,victim){if(!game||game.mode!=='playing'||!victim.alive||!killer.alive)return;
 const kill=isKillMode(),sight=game.lights>0?95:225;const witnesses=kill?[]:allActors().filter(a=>a.alive&&a.role==='crew'&&a.id!==victim.id&&visibleTo(a,victim,sight)).map(a=>a.id);
 victim.alive=false;victim.path=[];killer.cooldown=killer.id===0?(kill?3:11):34;killer.monsterTimer=Math.max(killer.monsterTimer,1.6);
 const body={x:victim.x,y:victim.y,color:victim.color,victimId:victim.id,killerId:killer.id,witnesses,room:roomAt(victim),reported:false};game.bodies.push(body);
 if(witnesses.includes(0)) {log(`You saw ${killer.color.name} eliminate ${victim.color.name} in ${body.room}.`);toast(`${killer.color.name} did it! Report the body.`,true);tone(220,.18,'triangle');}
 if(killer.id===0){const remaining=game.bots.filter(a=>a.alive).length;log(kill?`${victim.color.name} is out. ${remaining} crewmates left.`:`${victim.color.name} is out. ${witnesses.length?'Someone saw you!':'No witnesses.'}`);toast(kill?`+1! ${remaining} crewmates left.`:witnesses.length?'Someone saw you!':'Stay cool. Keep moving.',!!witnesses.length);tone(160,.16,'triangle');}
 const botWitness=witnesses.find(id=>id!==0);if(botWitness!==undefined)game.pendingReport={timer:1.8,reporterId:botWitness,body};
 renderCrew();if(victim.id===0){endRound(false,'The impostor found you.',`${killer.color.name} was the impostor. Stay near other crewmates next time.`);return;}checkWin();
}
function checkWin(){if(!game||game.mode==='ended')return true;const actors=allActors().filter(a=>a.alive);const crew=actors.filter(a=>a.role==='crew').length,imps=actors.filter(a=>a.role==='imp').length;
 if(isKillMode()){if(crew===0){endRound(true,'You caught all 10!',`Ship cleared with ${huntTime()} left on the clock.`);return true;}if(game.elapsed>=KILL_DURATION){endRound(false,'Time’s up!',`You caught ${killCount()} of 10 crewmates. Use the map, vents, and SHIFT to chase down the rest next round.`);return true;}return false;}
 if(imps===0){endRound(game.role==='crew','The impostor was ejected.','The crew is safe. Excellent detective work!');return true;}
 if(crew<=imps){endRound(game.role==='imp','The impostor took over.',game.role==='imp'?'You outsmarted the crew and claimed the ship.':'The impostor gained control of the ship. Try another shift!');return true;}
 if(game.role==='imp'&&game.crewWork>=1){endRound(false,'The crew finished their tasks.','They fixed the ship before you could take over. Try again!');return true;}return false;
}
function endRound(won,title,detail){const role=game.role,variant=game.variant,kill=isKillMode();game.mode='ended';resetInput();const surviving=allActors().filter(a=>a.alive);showModal(`<span class="eyebrow">${kill?'KILL MODE COMPLETE':'EPISODE COMPLETE'}</span><h2 id="modalTitle" class="result-word ${won?'':'loss'}">${won?'VICTORY':kill?'TIME’S UP':'DEFEAT'}</h2><div class="modal-hero">${avatar(game.player.color,{monster:role==='imp'})}</div><strong>${title}</strong><p>${won&&role==='crew'?'The crew can finally get back to the pizza. You solved the mystery!':detail}</p><div class="end-crew-strip">${surviving.map(a=>avatar(a.color)).join('')}</div><div class="episode-ended">${kill?`${killCount()} / 10 CAUGHT · ${huntTime()} LEFT`:'A NEW EPISODE MEANS A NEW IMPOSTOR'}</div><div class="modal-actions ${won&&role==='crew'?'with-finale':''}">${won&&role==='crew'?'<button class="primary finale-next" id="finaleNext">Continue: Defeat Green</button>':''}<button class="${won&&role==='crew'?'secondary':'primary'}" id="playAgain">${kill?'Replay Kill Mode':'Another episode'}</button><button class="secondary" id="changeRole">Change character</button></div>`);if($('finaleNext'))$('finaleNext').onclick=openFinale;$('playAgain').onclick=()=>startGame(role,variant);$('changeRole').onclick=toLobby;tone(won?880:180,.25,'triangle');log(kill?(won?'Kill Mode complete. You caught the whole crew!':'The clock ran out. Ready for another chase?'):won?'Episode complete. Save a slice for the hero.':'The impostor got the last laugh. Try a new episode.');updateHUD();}

function useAction(){if(!game||game.mode!=='playing')return;if(game.role==='crew'){const t=nearbyTask();if(t)openTask(t);}else if(game.player.cooldown<=0){const target=nearbyVictim();if(target)eliminate(game.player,target);}updateHUD();}
function reportAction(){if(!game||isKillMode()||game.mode!=='playing')return;const body=nearbyBody();if(body)startMeeting(0,body);}
function abilityAction(){if(!game||game.mode!=='playing')return;if(game.role==='crew'){if(game.meetingCooldown<=0&&(game.emergencyLeft>0||game.tasks.every(t=>t.done))&&distance(game.player,meetingPoint)<95){game.emergencyLeft=Math.max(0,game.emergencyLeft-1);startMeeting(0,null);}}else{const i=nearbyVent();if(i<0||game.ventCooldown>0)return;const witnesses=isKillMode()?[]:game.bots.filter(a=>a.alive&&visibleTo(a,game.player,game.lights>0?95:220));const v=vents[(i+1)%vents.length];game.player.x=v.x;game.player.y=v.y;game.player.path=[];game.autoRoute=null;game.ventCooldown=5;tone(280,.14);toast(`Vented to ${v.room}.`);if(witnesses.length){game.pendingReport={timer:2.2,reporterId:witnesses[0].id,body:null,ventEvidence:{witness:witnesses[0].id,suspect:0,kind:'vent'}};toast(`${witnesses[0].color.name} saw you use a vent!`,true);}}updateHUD();}

function sabotageAction(){if(!game||game.mode!=='playing'||game.role!=='imp'||game.lightsCooldown>0)return;game.lights=9;game.lightsCooldown=28;toast('Lights out. The crew can’t see as far.');log('You cut the lights. They will reset in 9 seconds.');tone(95,.3,'triangle');updateHUD();}
function update(dt){if(!game||game.mode!=='playing')return;game.elapsed+=dt;const kill=isKillMode();if(kill){game.pendingReport=null;if(checkWin())return;}for(const key of ['lights','lightsCooldown','ventCooldown','shiftCooldown','meetingCooldown'])game[key]=Math.max(0,game[key]-dt);game.player.cooldown=Math.max(0,game.player.cooldown-dt);
 for(const a of allActors())a.monsterTimer=Math.max(0,a.monsterTimer-dt);
 if(!game.blackoutTriggered&&game.elapsed>=3){game.blackoutTriggered=true;game.case.capturedAt=game.elapsed;game.lights=4;toast('BLACKOUT! Someone sabotaged the party.',true);log('The blackout left two traces. Repair the reactor and electrical systems.');tone(110,.35,'triangle');}
 if(!kill&&game.role==='imp'&&game.blackoutTriggered){game.crewWork=Math.min(1,game.crewWork+dt/240);if(checkWin())return;}
 let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joystick.x,dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joystick.y;const len=Math.hypot(dx,dy),speed=game.player.monsterTimer>0?235:195;
 if(len>.06){game.player.path=[];game.autoRoute=null;if(len>1){dx/=len;dy/=len;}move(game.player,dx*speed*dt,dy*speed*dt);}else followPath(game.player,speed,dt);
 if(game.autoRoute&&!game.player.path.length){const dest=game.autoRoute;game.autoRoute=null;toast(dest.startsWith('room:')?'You’re here. Look for the crew, or choose another room on the map.':dest==='meeting'?'You’re here. Tap MEETING to gather the crew.':'You’re here. Tap USE at the glowing console.');}
 for(const bot of game.bots){if(!bot.alive)continue;bot.cooldown=Math.max(0,bot.cooldown-dt);bot.think-=dt;
  if(kill){bot.fleeing=Math.max(0,bot.fleeing-dt);if(bot.think<=0&&visibleTo(bot,game.player,game.lights>0?145:310)){bot.think=.8+Math.random()*.3;flee(bot);}if(bot.path.length)followPath(bot,bot.fleeing>0?105:90,dt);else{bot.wait-=dt;if(bot.wait<=0){roam(bot);bot.wait=.25+Math.random()*.75;}}continue;}
  if(bot.role==='imp'&&bot.cooldown<5&&bot.think<=0){bot.think=1.3;const targets=allActors().filter(a=>a.alive&&a.role==='crew'&&(a.id!==0||game.elapsed>game.player.invulnerable));targets.sort((a,b)=>distance(bot,a)-distance(bot,b));if(targets.length){bot.targetId=targets[0].id;bot.path=findPath(bot,targets[0]);}}
  if(bot.role==='imp'&&bot.cooldown<=0){const target=actorById(bot.targetId);if(target?.alive&&distance(bot,target)<49&&clearLine(bot,target,4)&&(target.id!==0||game.elapsed>game.player.invulnerable)){const witnesses=game.bots.filter(a=>a.alive&&a.role==='crew'&&a.id!==target.id&&visibleTo(a,target,180));if(witnesses.length===0){eliminate(bot,target);if(game.mode!=='playing')return;bot.path=[];}}}
  if(bot.path.length)followPath(bot,bot.role==='imp'&&bot.cooldown<5?112:76,dt);else{bot.wait-=dt;if(bot.wait<=0&&game.blackoutTriggered)roam(bot);}
  if(bot.role==='crew'&&!game.pendingReport){if(game.role==='imp'&&game.player.monsterTimer>0&&visibleTo(bot,game.player,game.lights>0?90:225)){game.pendingReport={timer:1.7,reporterId:bot.id,body:null,ventEvidence:{witness:bot.id,suspect:0,kind:'monster'}};toast(`${bot.color.name} saw your monster form!`,true);}else{const body=game.bodies.find(b=>!b.reported&&visibleTo(bot,b,game.lights>0?60:100));if(body)game.pendingReport={timer:1.6,reporterId:bot.id,body};}}
 }
 if(game.pendingReport){const p=game.pendingReport;p.timer-=dt;if(!actorById(p.reporterId)?.alive)game.pendingReport=null;else if(p.timer<=0){game.pendingReport=null;startMeeting(p.reporterId,p.body,p.ventEvidence);}}
}

function startMeeting(reporterId,body,ventEvidence){if(!game||isKillMode()||game.mode!=='playing')return;ventEvidence ||= game.pendingReport?.ventEvidence;if(ventEvidence&&!actorById(ventEvidence.witness)?.alive)ventEvidence=null;game.mode='meeting';game.pendingReport=null;game.autoRoute=null;tone(330,.25,'square',.018);
 const evidence=[];for(const b of game.bodies){for(const id of b.witnesses)if(actorById(id)?.alive)evidence.push({witness:id,suspect:b.killerId,victim:b.victimId,kind:'kill'});b.reported=true;}if(ventEvidence)evidence.push(ventEvidence);
 const unique=evidence.filter((e,i,a)=>a.findIndex(x=>x.witness===e.witness&&x.suspect===e.suspect)===i);game.meeting={evidence:unique,selection:undefined};
 const reporter=actorById(reporterId),subtitle=body?`${reporterId===0?'You':reporter.color.name} reported ${actorById(body.victimId).color.name} in ${body.room}.`:ventEvidence?`${reporter.color.name} saw something suspicious.`:`${reporterId===0?'You':reporter.color.name} called the crew together.`;
 const matches=caseMatches();const statements=unique.slice(0,3).map(e=>`<p><strong>${e.witness===0?'You':actorById(e.witness).color.name}:</strong> I saw ${actorById(e.suspect).color.name} ${e.kind==='vent'?'use a vent!':e.kind==='monster'?'turn into a monster!':`eliminate ${actorById(e.victim).color.name}!`}</p>`).join('')||(matches.length===1?`<p><strong>Your evidence:</strong> ${actorById(matches[0]).color.name} is the only character whose badge matches both blackout traces.</p>`:'<p>No eyewitness evidence yet. Check your clues, or skip if you’re unsure.</p>');
 showModal(`<span class="eyebrow" style="color:var(--red)">${body?'BODY REPORTED':'EMERGENCY MEETING'}</span><h2 id="modalTitle">Who’s hiding something?</h2><p>${subtitle}</p><div class="meeting-evidence">${statements}</div><div class="vote-grid">${allActors().filter(a=>a.alive).map(a=>`<button class="vote-card ${matches.includes(a.id)?'case-match':''}" data-vote="${a.id}" ${a.id===0?'disabled':''}>${avatar(a.color)}<span><strong>${a.color.name}${a.id===0?' (you)':''}</strong><small>${a.color.title}</small></span></button>`).join('')}<button class="vote-card skip-card" data-vote="skip"><strong>Skip this vote</strong></button></div><div class="modal-actions"><button class="primary" id="castVote" disabled>Confirm vote</button></div>`);
 $('modal').querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>{game.meeting.selection=b.dataset.vote==='skip'?null:Number(b.dataset.vote);$('modal').querySelectorAll('[data-vote]').forEach(x=>x.classList.toggle('selected',x===b));$('castVote').disabled=false;tone(450);});$('castVote').onclick=resolveVote;updateHUD();
}

function resolveVote(){if(!game||game.mode!=='meeting'||game.meeting.selection===undefined)return;game.mode='meeting-result';const chosen=game.meeting.selection;const proof=game.meeting.evidence.find(e=>actorById(e.suspect)?.alive)?.suspect ?? (caseMatches().includes(chosen)?chosen:undefined);
 const votes=new Map();const add=id=>votes.set(id,(votes.get(id)||0)+1);add(chosen);
 for(const bot of game.bots.filter(a=>a.alive)){let vote=null;if(proof!==undefined&&bot.role==='crew')vote=proof;else if(chosen!==null&&chosen!==bot.id&&(bot.role==='imp'?actorById(chosen)?.role!=='imp':Math.random()<.8))vote=chosen;add(vote);}
 const sorted=[...votes.entries()].sort((a,b)=>b[1]-a[1]);let ejected=null;if(sorted.length&&sorted[0][0]!==null&&(sorted.length===1||sorted[0][1]>sorted[1][1]))ejected=actorById(sorted[0][0]);
 if(ejected)ejected.alive=false;renderCrew();const tally=sorted.map(([id,n])=>`<span>${id===null?'Skip':actorById(id).color.name}: <strong>${n}</strong></span>`).join('');
 if(ejected?.id===0){endRound(false,'The crew voted you out.','Someone noticed your sneaky behavior. Cut the lights and avoid witnesses next time.');return;}if(checkWin())return;
 const title=ejected?`${ejected.color.name} was ejected.`:'No one was ejected.';const detail=ejected?`${ejected.color.name} was ${ejected.role==='imp'?'the impostor':'a crewmate'}.`:'The vote was tied or the crew chose to skip.';log(title+' '+detail);
 showModal(`<span class="eyebrow">VOTING COMPLETE</span><h2 id="modalTitle">${title}</h2>${ejected?`<div class="modal-hero">${avatar(ejected.color)}</div>`:''}<p>${detail}</p><div class="vote-tally">${tally}</div><div class="modal-actions"><button class="primary" id="backToShip">Back to the ship</button></div>`);$('backToShip').onclick=resumeAfterMeeting;
}
function resumeAfterMeeting(){game.bodies=[];game.pendingReport=null;game.lights=0;game.meetingCooldown=8;allActors().filter(a=>a.alive).forEach((a,i)=>{Object.assign(a,spawnPoints[i]);a.path=[];a.think=0;a.wait=1+i*.2;a.cooldown=Math.max(a.cooldown,14);a.monsterTimer=0;});game.player.invulnerable=game.elapsed+24;hideModal();updateHUD();}

function openTask(task){if(task.done||game.mode!=='playing'||!game.blackoutTriggered)return;game.mode='task';const token=game.id;const finish=()=>{if(game.id!==token||task.done||game.mode!=='task')return;awardTask(task);game.mode='task-result';tone(880,.2,'triangle');const clue=task.id==='reactor'?0:task.id==='electrical'?1:null,done=game.tasks.every(t=>t.done),matches=caseMatches();
 showModal(`<span class="eyebrow">SYSTEM RESTORED</span><h2 id="modalTitle">${task.name} ✓</h2>${clue!==null?`<p class="clue-reward">BLACKOUT TRACE ${clue+1} RECOVERED</p><div class="clue-portraits">${cluePortraits(game.case.clueSets[clue])}</div><p>This system trace matches one of these crew badges.</p>`:`<div class="modal-hero">${avatar(game.player.color)}</div><p>The ship’s navigation is back online.</p>`}${matches.length===1?`<div class="deduction">Only <strong>${actorById(matches[0]).color.name}</strong> appears in both traces.</div>`:''}<p>${done?'All systems ready. Gather the crew and cast your vote.':`${game.tasks.filter(t=>!t.done).length} systems still need your help.`}</p><div class="modal-actions"><button class="primary" id="taskDone">Back to the ship</button><button class="secondary" id="taskNext">${done?'Go to meeting':'Next destination'}</button></div>`);$('taskDone').onclick=hideModal;$('taskNext').onclick=()=>guideTo(done?'meeting':game.tasks.find(t=>!t.done).id);};

 const base=(subtitle,body)=>`<button class="modal-close" id="closeTask" aria-label="Close task">×</button><span class="eyebrow">${task.room.toUpperCase()}</span><h2 id="modalTitle">${task.name}</h2><p>${subtitle}</p>${body}<div class="task-hint" id="taskHint" aria-live="polite"></div>`;
 if(task.kind==='wires'){
  const colors=['#ff7b87','#ffd071','#6ee0cf','#b29bff'],right=shuffle([0,1,2,3]);let selected=null,matched=[];
  const btn=(n,side)=>`<button class="wire" style="--wire:${colors[n]}" data-side="${side}" data-number="${n}" aria-label="${side} wire ${n+1}">${n+1}</button>`;
  showModal(base('Tap a wire on the left, then its matching number on the right.',`<div class="wire-board" id="wireBoard"><svg class="wire-lines" id="wireLines"></svg><div class="wire-column">${[0,1,2,3].map(n=>btn(n,'left')).join('')}</div><div class="wire-column">${right.map(n=>btn(n,'right')).join('')}</div></div>`));
  const drawLines=()=>{const box=$('wireBoard').getBoundingClientRect();$('wireLines').setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);$('wireLines').innerHTML=matched.map(n=>{const a=$('wireBoard').querySelector(`[data-side="left"][data-number="${n}"]`).getBoundingClientRect(),b=$('wireBoard').querySelector(`[data-side="right"][data-number="${n}"]`).getBoundingClientRect();return `<path d="M${a.right-box.left-4},${a.top-box.top+a.height/2} C${box.width/2},${a.top-box.top+a.height/2} ${box.width/2},${b.top-box.top+b.height/2} ${b.left-box.left+4},${b.top-box.top+b.height/2}" stroke="${colors[n]}" stroke-width="4" fill="none"/>`;}).join('');};
  $('wireBoard').querySelectorAll('button').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.number);if(matched.includes(n))return;if(b.dataset.side==='left'){selected=n;$('wireBoard').querySelectorAll('[data-side="left"]').forEach(x=>x.classList.toggle('selected',x===b));$('taskHint').textContent=`Now tap ${n+1} on the right.`;tone(350+n*80);}else if(selected===n){matched.push(n);$('wireBoard').querySelectorAll(`[data-number="${n}"]`).forEach(x=>{x.classList.add('connected');x.classList.remove('selected');x.disabled=true;});selected=null;drawLines();$('taskHint').textContent=`${matched.length} of 4 wires connected.`;tone(660);if(matched.length===4)finish();}else{$('taskHint').textContent=selected===null?'Choose a wire on the left first.':'Match the same number. Try again!';tone(180);}});
 }else if(task.kind==='power'){
  const seq=shuffle([1,2,3,4]);let step=0;
  showModal(base('Tap the numbered switches in this order.',`<div class="power-sequence">${seq.map((n,i)=>`<span class="sequence-number" id="seq${i}">${n}</span>`).join('')}</div><div class="power-buttons">${[1,2,3,4].map(n=>`<button class="power-button" data-power="${n}">${n}</button>`).join('')}</div>`));$('taskHint').textContent=`Start with ${seq[0]}.`;
  $('modal').querySelectorAll('[data-power]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.power)===seq[step]){$('seq'+step).classList.add('done');step++;tone(400+step*120);if(step===4)finish();else $('taskHint').textContent=`Great! Now tap ${seq[step]}.`;}else{step=0;$('modal').querySelectorAll('.sequence-number').forEach(x=>x.classList.remove('done'));$('taskHint').textContent=`Almost! Start again with ${seq[0]}.`;tone(170);}});
 }else{
  const points=[{x:15,y:72},{x:32,y:28},{x:52,y:60},{x:70,y:23},{x:87,y:64}];let step=0;
  showModal(base('Plot a course through the stars. Tap 1, 2, 3, 4, then 5.',`<div class="course-board"><svg class="course-lines" id="courseLines" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>${points.map((p,i)=>`<button class="course-star" data-star="${i}" style="left:${p.x}%;top:${p.y}%">${i+1}</button>`).join('')}</div>`));$('taskHint').textContent='Start with star 1.';
  $('modal').querySelectorAll('[data-star]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.star)===step){b.classList.add('done');b.disabled=true;step++;tone(350+step*120);$('courseLines').innerHTML=points.slice(1,step).map((p,i)=>`<line x1="${points[i].x}" y1="${points[i].y}" x2="${p.x}" y2="${p.y}" stroke="#5ee6c1" stroke-width="1"/>`).join('');$('taskHint').textContent=`Now tap star ${step+1}.`;if(step===5)finish();}else{$('taskHint').textContent=`You’re looking for star ${step+1}.`;tone(200);}});
 }
 $('closeTask').onclick=hideModal;updateHUD();
}
// The ship is drawn with small vector shapes, so it stays sharp at every screen size.
function rr(x,y,w,h,r,fill,stroke,line=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
function label(text,x,y,size=11,color='#8ea4c1',align='center'){ctx.font=`700 ${size}px "Trebuchet MS",sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,x,y);}
function drawShip(){world.draw(ctx,{time:visualTime,game,player:game?.player});}
function drawActor(a,isPlayer=false){
 if(a.monsterTimer>0&&world.drawMonsterShadow)world.drawMonsterShadow(ctx,a,visualTime);
 window.CrewArt.drawCharacter(ctx,a,{player:isPlayer,time:visualTime,monster:a.monsterTimer>0,scale:1.1,label:false});
 label(isPlayer?`${a.color.name.toUpperCase()} · YOU`:a.color.name,a.x,a.y-66,10,isPlayer?'#bdffdc':'#eff6ff');
 if(game?.mode==='playing'&&!isKillMode()&&a.id!==0&&distance(game.player,a)<115&&sightLine(game.player,a)){ctx.fillStyle='#d0eee7';ctx.beginPath();ctx.arc(a.x+27,a.y-37,10,0,Math.PI*2);ctx.fill();label('…',a.x+27,a.y-39,12,'#203d51');}
}

function drawBody(b){ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle='#050a1599';ctx.beginPath();ctx.ellipse(0,9,27,8,0,0,Math.PI*2);ctx.fill();rr(-25,-6,18,22,6,b.color.shade,'#081323',3);rr(-13,-13,35,29,8,b.color.hex,'#081323',3);rr(-4,-20,8,13,3,'#cfdfec','#081323',2);rr(-8,-23,16,7,4,'#e1ecf5','#081323',2);label(isKillMode()?'OUT':'REPORT',0,30,8,'#ffa4a9');ctx.restore();}
function draw(){ctx.setTransform(view.dpr,0,0,view.dpr,0,0);ctx.clearRect(0,0,view.w,view.h);ctx.fillStyle='#080f1e';ctx.fillRect(0,0,view.w,view.h);
 for(const s of stars){ctx.globalAlpha=.2+(Math.sin(visualTime*.6+s.phase)+1)*.18;ctx.fillStyle='#b4d9ff';ctx.beginPath();ctx.arc(s.x*view.w,s.y*view.h,s.size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 let zoom;if(!game){zoom=Math.min(view.w/W,view.h/H)*1.08;camera={zoom,x:(W*zoom-view.w)/2,y:(H*zoom-view.h)/2};}else{zoom=view.w<550?.88:Math.min(1.12,Math.max(.7,Math.min(view.w/1000,view.h/650)));const bound=(v,total,viewport,margin)=>total<viewport?(total-viewport)/2:clamp(v,-margin,total-viewport+margin);camera={zoom,x:bound(game.player.x*zoom-view.w/2,W*zoom,view.w,55),y:bound(game.player.y*zoom-view.h*.48,H*zoom,view.h,85)};}
 ctx.save();ctx.translate(-camera.x,-camera.y);ctx.scale(zoom,zoom);if(!game)ctx.globalAlpha=.7;drawShip();
 if(game){const visibleRange=game.lights>0&&game.role==='crew'?160:560;for(const b of game.bodies)if(!b.reported&&visibleTo(game.player,b,visibleRange))drawBody(b);
 const actors=allActors().filter(a=>a.alive&&(a.id===0||visibleTo(game.player,a,visibleRange))).sort((a,b)=>a.y-b.y);for(const a of actors)drawActor(a,a.id===0);
 if(game.player.path.length){const p=game.player.path[game.player.path.length-1];ctx.strokeStyle='#91e9d499';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,11+Math.sin(visualTime*5)*2,0,Math.PI*2);ctx.stroke();}
 }else for(const a of demoActors)drawActor(a);
 ctx.restore();
 if(game){const px=game.player.x*zoom-camera.x,py=game.player.y*zoom-camera.y,radius=(game.lights>0&&game.role==='crew'?155:540)*zoom;const g=ctx.createRadialGradient(px,py,radius*.3,px,py,radius);g.addColorStop(0,'#050b1700');g.addColorStop(.75,'#050b1740');g.addColorStop(1,game.lights>0&&game.role==='crew'?'#050b17eb':'#050b1799');ctx.fillStyle=g;ctx.fillRect(0,0,view.w,view.h);
 const vignette=ctx.createLinearGradient(0,0,0,view.h);vignette.addColorStop(0,'#050d1b88');vignette.addColorStop(.2,'#050d1b00');vignette.addColorStop(.7,'#050d1b00');vignette.addColorStop(1,'#050d1bcc');ctx.fillStyle=vignette;ctx.fillRect(0,0,view.w,view.h);
 }
}
function frame(now){if(window.FinaleGame?.isOpen()){lastFrame=now;requestAnimationFrame(frame);return;}const dt=Math.min((now-lastFrame)/1000||0,.04);lastFrame=now;visualTime+=dt;if(!document.hidden)update(dt);uiTick+=dt;if(uiTick>.1){updateHUD();uiTick=0;}if(toastUntil&&now>toastUntil){$('toast').className='toast';toastUntil=0;}draw();requestAnimationFrame(frame);}
// Multi-touch ownership keeps movement separate from the action buttons.
function moveStick(e){const box=$('joystick').getBoundingClientRect();let x=e.clientX-box.left-box.width/2,y=e.clientY-box.top-box.height/2;const max=box.width*.29,d=Math.hypot(x,y);if(d>max){x=x/d*max;y=y/d*max;}joystick.x=x/max;joystick.y=y/max;$('stick').style.transform=`translate(${x}px,${y}px)`;}
$('joystick').addEventListener('pointerdown',e=>{if(!game||game.mode!=='playing'||joystick.pointer!==null)return;e.preventDefault();joystick.pointer=e.pointerId;$('joystick').setPointerCapture(e.pointerId);moveStick(e);});
$('joystick').addEventListener('pointermove',e=>{if(e.pointerId===joystick.pointer)moveStick(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('joystick').addEventListener(event,e=>{if(e.pointerId===joystick.pointer){joystick.pointer=null;joystick.x=joystick.y=0;$('stick').style.transform='translate(0,0)';}});
canvas.addEventListener('pointerdown',e=>{tapStart={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{if(!game||game.mode!=='playing'||!tapStart)return;const start=tapStart;tapStart=null;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>15)return;const box=canvas.getBoundingClientRect();const p={x:(e.clientX-box.left+camera.x)/camera.zoom,y:(e.clientY-box.top+camera.y)/camera.zoom};if(canStand(p.x,p.y))game.player.path=findPath(game.player,p);});canvas.addEventListener('pointercancel',()=>tapStart=null);
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(document.querySelector('.ship-builder-overlay,.finale-overlay'))return;if(k==='tab'&&!$('modalBackdrop').hidden){const els=[...$('modal').querySelectorAll('button:not(:disabled),[tabindex="0"]')];if(els.length){if(e.shiftKey&&(document.activeElement===els[0]||document.activeElement===$('modal'))){e.preventDefault();els.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0].focus();}}return;}
 if(k==='escape'){if(game?.mode==='playing')pauseGame();else if(['paused','task','task-result','talk','map','evidence'].includes(game?.mode))hideModal();else if(game?.mode==='help')$('closeHelp')?.click();else if(!game)$('modalBackdrop').hidden=true;return;}
 if(!game||game.mode!=='playing')return;if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='e'||k===' '||k==='k'&&isKillMode())useAction();if(k==='r')reportAction();if(k==='q'&&game.role==='crew'||k==='v'&&game.role==='imp')abilityAction();if(k==='f')sabotageAction();if(k==='t')talkAction();if(k==='x')shiftAction();if(k==='m')showMap();if(k==='c')showEvidence();});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{resetInput();if(game?.mode==='playing')pauseGame();});document.addEventListener('visibilitychange',()=>{resetInput();if(document.hidden&&game?.mode==='playing')pauseGame();lastFrame=performance.now();});
$('playFinale').onclick=openFinale;$('buildShipBtn').onclick=openShipBuilder;$('resetShip').onclick=()=>{setWorld(window.WorldArt);try{localStorage.setItem('crew-chaos-ship-choice','show');}catch{}toast('Back aboard the show’s Skeld.');};
$('playCrew').onclick=()=>startGame('crew');$('playImp').onclick=()=>startGame('imp');$('playKill').onclick=()=>startGame('imp','kill');$('useBtn').onclick=useAction;$('reportBtn').onclick=reportAction;$('abilityBtn').onclick=abilityAction;$('sabotageBtn').onclick=sabotageAction;$('talkBtn').onclick=talkAction;$('shiftBtn').onclick=shiftAction;$('mapBtn').onclick=showMap;$('caseBtn').onclick=showEvidence;$('pauseBtn').onclick=pauseGame;$('brand').onclick=()=>{if(game)pauseGame();};$('helpBtn').onclick=showHelp;$('soundBtn').onclick=()=>{sound=!sound;$('soundBtn').innerHTML=icon(sound?'sound':'mute');$('soundBtn').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');$('soundBtn').dataset.on=String(sound);tone(700);};
$('talkIcon').innerHTML=icon('talk');$('shiftIcon').innerHTML=icon('shift');$('mapBtn').innerHTML=icon('map');$('caseIcon').innerHTML=icon('case');$('reportIcon').innerHTML=icon('report');$('sabotageIcon').innerHTML=icon('lights');$('pauseBtn').innerHTML=icon('pause');$('soundBtn').innerHTML=icon('mute');let preferShow=false;try{preferShow=localStorage.getItem('crew-chaos-ship-choice')==='show';}catch{}const savedShip=preferShow?null:window.ShipBuilder?.load();if(!savedShip||!applyShip(savedShip))setWorld(window.WorldArt);renderColorSelection();renderCrew();renderTasks();renderCase();resize();requestAnimationFrame(frame);
})();
