// =========================================================
// CACTUSCRAWLER — Kern-Logik
// =========================================================

// ---------- WÄHRUNGEN ----------
let water = 0;
let gold = 0;

// ---------- KAKTUS-CHARAKTERE ----------
// Jeder Kaktus hat EIGENE PWR- und Gieß-Werte + eine eigene Fähigkeit im Dungeon.
const CHARACTERS = {
  basis: {
    id: 'basis', name: 'Basis-Kaktus', img: 'assets/cactus.png',
    unlocked: true, ability: null, abilityName: 'Keine Fähigkeit',
    abilityDesc: 'Zuverlässig und ausgeglichen — keine Spezialfähigkeit.',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15
  },
  fire: {
    id: 'fire', name: 'Feuer-Kaktus', img: 'assets/fire_cactus.png',
    unlocked: false, ability: 'burn', abilityName: 'Verbrennen 🔥',
    abilityDesc: '30% Chance, dem Monster einen Brand zuzufügen (Schaden über Zeit).',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15
  },
  ice: {
    id: 'ice', name: 'Eis-Kaktus', img: 'assets/ice_cactus.png',
    unlocked: false, ability: 'freeze', abilityName: 'Frostschock ❄️',
    abilityDesc: '25% Chance auf einen Frost-Kritischen Treffer (x2 Schaden).',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15
  },
  electro: {
    id: 'electro', name: 'Elektro-Kaktus', img: 'assets/electro_cactus.png',
    unlocked: false, ability: 'chain', abilityName: 'Kettenblitz ⚡',
    abilityDesc: '20% Chance auf einen sofortigen zweiten Treffer.',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15
  }
};
let activeCharacterId = 'basis';
function getActive() { return CHARACTERS[activeCharacterId]; }

// ---------- MONSTER DATENBANK ----------
const MONSTER_TYPES = [
  { name: "Wüsten-Schnecke", img: "assets/snail.png", fallback: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f40c.png", hpMul: 1, goldMul: 1 },
  { name: "Sand-Skorpion", img: "assets/scorpion.png", fallback: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f982.png", hpMul: 1.4, goldMul: 1.5 },
  { name: "Stein-Golem", img: "assets/golem.png", fallback: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f5ff.png", hpMul: 2.2, goldMul: 2.5 },
  { name: "BOSS: Kaktus-Drache", img: "assets/boss.png", fallback: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f409.png", hpMul: 4.5, goldMul: 6.0 }
];

let floor = 1;
let currentMonster = MONSTER_TYPES[0];
let monsterMaxHp = 20;
let monsterHp = 20;
let monsterInstanceId = 0; // verhindert, dass alte Brand-Ticks ein neues Monster treffen

// ---------- DOM ELEMENTE ----------
const waterEl = document.getElementById('water');
const goldEl = document.getElementById('gold');
const powerEl = document.getElementById('power');
const cactusBtn = document.getElementById('cactus-clicker');

const monsterImg = document.getElementById('monster-img');
const monsterName = document.getElementById('monster-name');
const monsterBadge = document.getElementById('monster-type-badge');
const monsterHpEl = document.getElementById('monster-hp');
const monsterMaxHpEl = document.getElementById('monster-max-hp');
const monsterHpBar = document.getElementById('monster-hp-bar');
const monsterEntity = document.getElementById('monster-entity');
const rangeHint = document.getElementById('range-hint');
const dungeonZone = document.getElementById('dungeon-zone');
const arena = document.getElementById('arena');
const playerEntity = document.getElementById('player-entity');
const playerImg = document.getElementById('player-img');
const cratesLayer = document.getElementById('crates-layer');

const upgradeWaterBtn = document.getElementById('upgrade-water-btn');
const upgradePowerBtn = document.getElementById('upgrade-power-btn');

const spinSlotBtn = document.getElementById('spin-slot-btn');
const slotDisplay = document.getElementById('slot-display');
const openBoxBtn = document.getElementById('open-box-btn');
const randomEventItem = document.getElementById('random-event-item');

const soundToggleBtn = document.getElementById('sound-toggle-btn');
const activeCharNameEl = document.getElementById('active-char-name');
const activeCharAbilityEl = document.getElementById('active-char-ability');
const inventoryList = document.getElementById('inventory-list');

// ---------- CANVAS PARTIKEL-SYSTEM ----------
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

let particles = [];

class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y; this.color = color;
    this.size = Math.random() * 6 + 2;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = (Math.random() - 0.5) * 8;
    this.alpha = 1;
  }
  update() { this.x += this.speedX; this.y += this.speedY; this.alpha -= 0.03; }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p, index) => {
    p.update(); p.draw();
    if (p.alpha <= 0) particles.splice(index, 1);
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// =========================================================
// SOUND — synthetisiert per Web Audio API (keine Audiodateien nötig)
// =========================================================
let audioCtx = null;
let muted = false;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function tone(freq, dur, type = 'square', vol = 0.15, delay = 0) {
  if (muted) return;
  ensureAudio();
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

const sfx = {
  click: () => tone(520, 0.06, 'square', 0.08),
  hit: () => tone(160, 0.1, 'square', 0.15),
  ability: () => { tone(700, 0.08, 'sawtooth', 0.1); tone(950, 0.08, 'sawtooth', 0.1, 0.05); },
  death: () => { tone(300, 0.1, 'square', 0.15); tone(500, 0.12, 'square', 0.15, 0.08); tone(700, 0.16, 'square', 0.15, 0.16); },
  gold: () => { tone(660, 0.07, 'triangle', 0.12); tone(880, 0.09, 'triangle', 0.12, 0.06); },
  crate: () => { tone(400, 0.06, 'square', 0.1); tone(600, 0.08, 'square', 0.1, 0.05); },
  unlock: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.12, i * 0.09)); },
  error: () => tone(120, 0.15, 'sawtooth', 0.1),
  upgrade: () => { tone(440, 0.06, 'triangle', 0.1); tone(660, 0.08, 'triangle', 0.1, 0.05); }
};

soundToggleBtn.addEventListener('click', () => {
  muted = !muted;
  soundToggleBtn.textContent = muted ? '🔇' : '🔊';
  ensureAudio();
  saveGame();
});
// Erstes Antippen irgendwo aktiviert den AudioContext (Browser-Autoplay-Regeln)
window.addEventListener('pointerdown', ensureAudio, { once: true });

// =========================================================
// SPEICHERSTAND (localStorage)
// =========================================================
const SAVE_KEY = 'cactuscrawler_save_v1';

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      water, gold, floor, activeCharacterId, muted, characters: CHARACTERS
    }));
  } catch (e) { /* localStorage evtl. nicht verfügbar — ignorieren */ }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    water = d.water ?? 0;
    gold = d.gold ?? 0;
    floor = d.floor ?? 1;
    activeCharacterId = d.activeCharacterId || 'basis';
    muted = !!d.muted;
    if (d.characters) {
      Object.keys(d.characters).forEach(k => {
        if (CHARACTERS[k]) Object.assign(CHARACTERS[k], d.characters[k]);
      });
    }
  } catch (e) { /* korrupter Speicherstand — ignorieren */ }
}

// =========================================================
// TABS SYSTEM
// =========================================================
document.getElementById('tab-upgrades-btn').addEventListener('click', (e) => switchTab(e, 'tab-upgrades'));
document.getElementById('tab-inventory-btn').addEventListener('click', (e) => switchTab(e, 'tab-inventory'));
document.getElementById('tab-gamble-btn').addEventListener('click', (e) => switchTab(e, 'tab-gamble'));

function switchTab(e, tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  e.currentTarget.classList.add('active');
  document.getElementById(tabId).classList.add('active');
  sfx.click();
}

// =========================================================
// KLICKER (Wasser sammeln)
// =========================================================
cactusBtn.addEventListener('click', (e) => {
  const active = getActive();
  water += active.waterPerClick;
  createFloatingText(e.clientX, e.clientY, `+${active.waterPerClick} 💧`, '#66fcf1');
  spawnParticles(e.clientX, e.clientY, '#66fcf1', 8);
  sfx.click();
  updateUI();
});

// =========================================================
// DUNGEON — BEWEGUNG (WASD + Joystick)
// =========================================================
const player = { x: 20, y: 70, speed: 150, facingLeft: false };
let monsterRatio = { x: 0.75, y: 0.45 }; // Position des Monsters relativ zur Arena
const ATTACK_RANGE = 70;
const ATTACK_COOLDOWN = 450;
let lastAttackTime = 0;

const keys = { w: false, a: false, s: false, d: false };
const keyMap = {
  w: 'w', ArrowUp: 'w',
  a: 'a', ArrowLeft: 'a',
  s: 's', ArrowDown: 's',
  d: 'd', ArrowRight: 'd'
};
window.addEventListener('keydown', (e) => {
  const k = keyMap[e.key];
  if (k) { keys[k] = true; }
});
window.addEventListener('keyup', (e) => {
  const k = keyMap[e.key];
  if (k) { keys[k] = false; }
});

// Joystick (Touch/Maus, primär mobil)
const joystickBase = document.getElementById('joystick-base');
const joystickKnob = document.getElementById('joystick-knob');
const joystick = { active: false, x: 0, y: 0, radius: 40 };
let joystickCenter = { x: 0, y: 0 };

joystickBase.addEventListener('pointerdown', (e) => {
  joystick.active = true;
  joystickBase.setPointerCapture(e.pointerId);
  const rect = joystickBase.getBoundingClientRect();
  joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  updateJoystick(e);
});
joystickBase.addEventListener('pointermove', (e) => { if (joystick.active) updateJoystick(e); });
function resetJoystick(e) {
  joystick.active = false;
  joystick.x = 0; joystick.y = 0;
  joystickKnob.style.transform = 'translate(0px, 0px)';
}
joystickBase.addEventListener('pointerup', resetJoystick);
joystickBase.addEventListener('pointercancel', resetJoystick);

function updateJoystick(e) {
  let dx = e.clientX - joystickCenter.x;
  let dy = e.clientY - joystickCenter.y;
  const dist = Math.min(Math.hypot(dx, dy), joystick.radius);
  const angle = Math.atan2(dy, dx);
  dx = Math.cos(angle) * dist;
  dy = Math.sin(angle) * dist;
  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  joystick.x = dx / joystick.radius;
  joystick.y = dy / joystick.radius;
}

// Spiel-Loop
let lastFrameTime = performance.now();
function gameLoop(now) {
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  let vx = 0, vy = 0;
  if (keys.a) vx -= 1;
  if (keys.d) vx += 1;
  if (keys.w) vy -= 1;
  if (keys.s) vy += 1;

  if (vx === 0 && vy === 0 && joystick.active) {
    vx = joystick.x; vy = joystick.y;
  } else {
    const len = Math.hypot(vx, vy);
    if (len > 0) { vx /= len; vy /= len; }
  }

  if (vx !== 0 || vy !== 0) {
    const arenaRect = arena.getBoundingClientRect();
    const maxX = arenaRect.width - 56;
    const maxY = arenaRect.height - 56;
    player.x = Math.max(0, Math.min(maxX, player.x + vx * player.speed * dt));
    player.y = Math.max(0, Math.min(maxY, player.y + vy * player.speed * dt));
    if (vx < -0.1) player.facingLeft = true;
    else if (vx > 0.1) player.facingLeft = false;
  }

  playerEntity.style.transform = `translate(${player.x}px, ${player.y}px)`;
  playerEntity.classList.toggle('flip', player.facingLeft);

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function getMonsterPixelPos() {
  const arenaRect = arena.getBoundingClientRect();
  return {
    x: monsterRatio.x * (arenaRect.width - 56),
    y: monsterRatio.y * (arenaRect.height - 56)
  };
}

function positionMonster() {
  const pos = getMonsterPixelPos();
  monsterEntity.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}
window.addEventListener('resize', positionMonster);

// =========================================================
// KAMPF — Klick/Tap auf Monster, nur in Reichweite & mit Cooldown
// =========================================================
monsterEntity.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  tryAttack();
});

function tryAttack() {
  const mPos = getMonsterPixelPos();
  const dist = Math.hypot((player.x - mPos.x), (player.y - mPos.y));

  if (dist > ATTACK_RANGE) {
    rangeHint.classList.remove('hidden');
    sfx.error();
    setTimeout(() => rangeHint.classList.add('hidden'), 700);
    return;
  }

  const now = performance.now();
  if (now - lastAttackTime < ATTACK_COOLDOWN) return; // Spam bringt nichts — Cooldown gewinnt
  lastAttackTime = now;

  performAttack();
}

function performAttack() {
  const active = getActive();
  const rect = monsterEntity.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const myMonsterId = monsterInstanceId;

  let damage = active.cactusPower;
  let labels = [];

  if (active.ability === 'freeze' && Math.random() < 0.25) {
    damage *= 2;
    labels.push('❄️ Frost-Krit!');
    sfx.ability();
  }
  if (active.ability === 'burn' && Math.random() < 0.30) {
    labels.push('🔥 Verbrannt!');
    sfx.ability();
    burnDot(myMonsterId, Math.max(1, Math.ceil(active.cactusPower * 0.4)));
  }
  if (active.ability === 'chain' && Math.random() < 0.20) {
    labels.push('⚡ Kettenblitz!');
    sfx.ability();
    setTimeout(() => {
      if (monsterInstanceId === myMonsterId) dealDamage(active.cactusPower, cx, cy);
    }, 150);
  }

  dealDamage(damage, cx, cy);
  labels.forEach((label, i) => {
    setTimeout(() => createFloatingText(cx, cy - 40, label, '#f1c40f'), i * 120);
  });

  dungeonZone.classList.add('shake');
  monsterEntity.classList.add('hit-flash');
  setTimeout(() => { dungeonZone.classList.remove('shake'); monsterEntity.classList.remove('hit-flash'); }, 120);
  sfx.hit();
}

function burnDot(targetMonsterId, tickDamage) {
  let ticks = 0;
  const interval = setInterval(() => {
    ticks++;
    if (monsterInstanceId !== targetMonsterId || monsterHp <= 0 || ticks > 3) {
      clearInterval(interval);
      return;
    }
    const rect = monsterEntity.getBoundingClientRect();
    dealDamage(tickDamage, rect.left + rect.width / 2, rect.top + rect.height / 2, true);
  }, 500);
}

function dealDamage(amount, x, y, isDot = false) {
  if (monsterHp <= 0) return;
  monsterHp -= amount;
  createFloatingText(x, y, `-${amount}`, isDot ? '#ff9f43' : '#ff4757');
  spawnParticles(x, y, isDot ? '#ff9f43' : '#ff4757', isDot ? 6 : 12);

  if (monsterHp <= 0) {
    monsterHp = 0;
    let reward = Math.floor(floor * 8 * currentMonster.goldMul);
    gold += reward;
    floor++;
    createFloatingText(x, y - 30, `+${reward} GOLD! 🪙`, '#f1c40f');
    spawnParticles(x, y, '#f1c40f', 25);
    sfx.death();
    if (Math.random() < 0.6) trySpawnCrate();
    spawnMonster();
  }
  updateUI();
}

function spawnMonster() {
  monsterInstanceId++;
  if (floor % 5 === 0) {
    currentMonster = MONSTER_TYPES[3];
    monsterBadge.textContent = "BOSS";
  } else {
    currentMonster = MONSTER_TYPES[Math.floor(Math.random() * 3)];
    monsterBadge.textContent = "Ebene " + floor;
  }

  monsterImg.src = currentMonster.img;
  monsterImg.onerror = () => monsterImg.src = currentMonster.fallback;
  monsterName.textContent = currentMonster.name;

  monsterMaxHp = Math.floor(20 * Math.pow(1.28, floor - 1) * currentMonster.hpMul);
  monsterHp = monsterMaxHp;

  monsterRatio = { x: 0.55 + Math.random() * 0.3, y: 0.25 + Math.random() * 0.5 };
  positionMonster();
}

// =========================================================
// UPGRADES — wirken auf den AKTIVEN Kaktus
// =========================================================
upgradeWaterBtn.addEventListener('click', () => {
  const active = getActive();
  if (water >= active.waterUpgradeCost) {
    water -= active.waterUpgradeCost;
    active.waterPerClick++;
    active.waterUpgradeCost = Math.floor(active.waterUpgradeCost * 1.5);
    sfx.upgrade();
    updateUI();
    saveGame();
  }
});

upgradePowerBtn.addEventListener('click', () => {
  const active = getActive();
  if (gold >= active.powerUpgradeCost) {
    gold -= active.powerUpgradeCost;
    active.cactusPower++;
    active.powerUpgradeCost = Math.floor(active.powerUpgradeCost * 1.6);
    sfx.upgrade();
    updateUI();
    saveGame();
  }
});

// =========================================================
// INVENTAR — Kakteen ausrüsten (immer nur 1 aktiv)
// =========================================================
function renderInventory() {
  inventoryList.innerHTML = '';
  Object.values(CHARACTERS).forEach(c => {
    const isEquipped = c.id === activeCharacterId;
    const card = document.createElement('div');
    card.className = 'inv-card' + (c.unlocked ? '' : ' locked') + (isEquipped ? ' equipped' : '');

    const img = document.createElement('img');
    img.className = 'inv-img';
    img.src = c.unlocked ? c.img : c.img;
    img.style.filter = c.unlocked ? '' : 'brightness(0)';
    img.alt = c.name;

    const info = document.createElement('div');
    info.className = 'inv-info';
    info.innerHTML = `
      <div class="inv-name">${c.unlocked ? c.name : '??? Kaktus'}</div>
      <div class="inv-ability">${c.unlocked ? c.abilityDesc : 'Finde diesen Kaktus in einer Dungeon-Kiste 📦!'}</div>
      ${c.unlocked ? `<div class="inv-stats">PWR ${c.cactusPower} · 💧 ${c.waterPerClick}/Klick</div>` : ''}
    `;

    const btn = document.createElement('button');
    btn.className = 'btn-action inv-equip-btn';
    btn.disabled = !c.unlocked || isEquipped;
    btn.textContent = isEquipped ? 'Ausgerüstet' : (c.unlocked ? 'Ausrüsten' : '🔒');
    btn.addEventListener('click', () => equipCharacter(c.id));

    card.append(img, info, btn);
    inventoryList.appendChild(card);
  });
}

function equipCharacter(id) {
  const c = CHARACTERS[id];
  if (!c || !c.unlocked || id === activeCharacterId) return;
  activeCharacterId = id;
  playerImg.src = c.img;
  sfx.click();
  updateUI();
  saveGame();
}

// =========================================================
// DUNGEON-KISTEN
// =========================================================
function trySpawnCrate() {
  if (cratesLayer.children.length >= 2) return;
  const arenaRect = arena.getBoundingClientRect();
  const x = 10 + Math.random() * (arenaRect.width - 44);
  const y = 10 + Math.random() * (arenaRect.height - 44);

  const crate = document.createElement('div');
  crate.className = 'crate';
  crate.textContent = '📦';
  crate.style.transform = `translate(${x}px, ${y}px)`;
  crate.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    openCrate(crate);
  });
  cratesLayer.appendChild(crate);
}
setInterval(() => { if (Math.random() < 0.5) trySpawnCrate(); }, 9000);

function openCrate(crateEl) {
  const rect = crateEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  crateEl.remove();

  const locked = Object.values(CHARACTERS).filter(c => !c.unlocked);
  if (locked.length > 0 && Math.random() < 0.45) {
    const pick = locked[Math.floor(Math.random() * locked.length)];
    pick.unlocked = true;
    createFloatingText(cx, cy, `NEU: ${pick.name}! 🎉`, '#66fcf1');
    spawnParticles(cx, cy, '#66fcf1', 25);
    sfx.unlock();
  } else {
    const goldWin = Math.floor(15 + floor * 4 * Math.random());
    const waterWin = Math.floor(10 + floor * 3 * Math.random());
    gold += goldWin;
    water += waterWin;
    createFloatingText(cx, cy, `+${goldWin} 🪙 +${waterWin} 💧`, '#f1c40f');
    spawnParticles(cx, cy, '#f1c40f', 15);
    sfx.crate();
  }
  updateUI();
  saveGame();
}

// =========================================================
// GAMBLING: SLOTS
// =========================================================
spinSlotBtn.addEventListener('click', () => {
  if (gold < 50) return;
  gold -= 50;

  const icons = ['🌵', '💎', '💀', '7️⃣'];
  const r1 = icons[Math.floor(Math.random() * icons.length)];
  const r2 = icons[Math.floor(Math.random() * icons.length)];
  const r3 = icons[Math.floor(Math.random() * icons.length)];

  slotDisplay.textContent = `${r1} | ${r2} | ${r3}`;
  sfx.click();

  if (r1 === r2 && r2 === r3) {
    gold += 500;
    sfx.unlock();
    alert("JACKPOT! +500 Gold! 🎉");
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    gold += 75;
    sfx.gold();
    alert("Kleiner Gewinn! +75 Gold! 🪙");
  }
  updateUI();
  saveGame();
});

// =========================================================
// GAMBLING: MYSTERY BOX
// =========================================================
openBoxBtn.addEventListener('click', () => {
  if (water < 100) return;
  water -= 100;

  if (Math.random() > 0.5) {
    let winGold = Math.floor(gold * 0.5) + 20;
    gold += winGold;
    sfx.gold();
    alert(`Gewinn! Du findest ${winGold} Gold!`);
  } else {
    sfx.error();
    alert("Niete! Nur etwas Staub in der Kiste... 💨");
  }
  updateUI();
  saveGame();
});

// =========================================================
// ZUFALLS-EVENT
// =========================================================
function triggerRandomEvent() {
  randomEventItem.classList.remove('hidden');
  setTimeout(() => randomEventItem.classList.add('hidden'), 4000);
}
setInterval(() => { if (Math.random() < 0.4) triggerRandomEvent(); }, 12000);

randomEventItem.addEventListener('click', (e) => {
  let bonus = floor * 15;
  gold += bonus;
  createFloatingText(e.clientX, e.clientY, `+${bonus} GOLD! ✨`, '#f1c40f');
  spawnParticles(e.clientX, e.clientY, '#f1c40f', 20);
  randomEventItem.classList.add('hidden');
  sfx.gold();
  updateUI();
  saveGame();
});

// =========================================================
// FLOATING TEXT
// =========================================================
function createFloatingText(x, y, text, color = '#66fcf1') {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.left = `${x - 20}px`;
  el.style.top = `${y - 20}px`;
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

// =========================================================
// UI UPDATE
// =========================================================
function updateUI() {
  const active = getActive();

  waterEl.textContent = water;
  goldEl.textContent = gold;
  powerEl.textContent = active.cactusPower;

  document.getElementById('cost-water').textContent = active.waterUpgradeCost;
  document.getElementById('cost-power').textContent = active.powerUpgradeCost;

  upgradeWaterBtn.disabled = water < active.waterUpgradeCost;
  upgradePowerBtn.disabled = gold < active.powerUpgradeCost;
  spinSlotBtn.disabled = gold < 50;
  openBoxBtn.disabled = water < 100;

  activeCharNameEl.textContent = active.name;
  activeCharAbilityEl.textContent = active.abilityName;

  document.getElementById('floor').textContent = floor;
  monsterHpEl.textContent = monsterHp;
  monsterMaxHpEl.textContent = monsterMaxHp;

  let hpPercent = Math.max(0, (monsterHp / monsterMaxHp) * 100);
  monsterHpBar.style.width = hpPercent + '%';

  soundToggleBtn.textContent = muted ? '🔇' : '🔊';

  renderInventory();
}

// =========================================================
// INITIALISIERUNG
// =========================================================
loadGame();
playerImg.src = getActive().img;
positionMonster();
updateUI();

setInterval(saveGame, 10000);
window.addEventListener('beforeunload', saveGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
