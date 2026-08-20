// AUDIO SYNTHESIZER (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  if (type === 'fire') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'ice') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.stop(audioCtx.currentTime + 0.2);
  } else if (type === 'electro') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.05);
    osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.stop(audioCtx.currentTime + 0.25);
  } else {
    // Normaler Klick Sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.stop(audioCtx.currentTime + 0.05);
  }

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
}

// STATS & STATE
let water = 0;
let gold = 0;
let waterPerClick = 1;
let cactusPower = 1;

let waterUpgradeCost = 10;
let powerUpgradeCost = 15;

let activeCactus = 'normal';

const CACTI_TYPES = {
  normal: { img: "assets/cactus.png", fallback: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f335.png" },
  fire: { img: "assets/fire_cactus.png", fallback: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f335.png" },
  ice: { img: "assets/ice_cactus.png", fallback: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f335.png" },
  electro: { img: "assets/electro_cactus.png", fallback: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f335.png" }
};

// MONSTER DATENBANK
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

// DOM ELEMENTE
const startGameBtn = document.getElementById('start-game-btn');
const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');

const waterEl = document.getElementById('water');
const goldEl = document.getElementById('gold');
const powerEl = document.getElementById('power');
const cactusBtn = document.getElementById('cactus-clicker');
const abilityBtn = document.getElementById('ability-btn');

const monsterImg = document.getElementById('monster-img');
const monsterName = document.getElementById('monster-name');
const monsterBadge = document.getElementById('monster-type-badge');
const monsterHpEl = document.getElementById('monster-hp');
const monsterMaxHpEl = document.getElementById('monster-max-hp');
const monsterHpBar = document.getElementById('monster-hp-bar');
const attackBtn = document.getElementById('attack-btn');
const dungeonZone = document.getElementById('dungeon-zone');

const upgradeWaterBtn = document.getElementById('upgrade-water-btn');
const upgradePowerBtn = document.getElementById('upgrade-power-btn');

const spinSlotBtn = document.getElementById('spin-slot-btn');
const slotDisplay = document.getElementById('slot-display');
const openBoxBtn = document.getElementById('open-box-btn');
const randomEventItem = document.getElementById('random-event-item');

// HAUPTMENÜ START
startGameBtn.addEventListener('click', () => {
  mainMenu.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  playSound('click');
});

// CANVAS PARTIKEL-SYSTEM
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 6 + 2;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = (Math.random() - 0.5) * 8;
    this.alpha = 1;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= 0.03;
  }
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
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p, index) => {
    p.update();
    p.draw();
    if (p.alpha <= 0) particles.splice(index, 1);
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// TABS SYSTEM
document.getElementById('tab-upgrades-btn').addEventListener('click', (e) => switchTab(e, 'tab-upgrades'));
document.getElementById('tab-cacti-btn').addEventListener('click', (e) => switchTab(e, 'tab-cacti'));
document.getElementById('tab-gamble-btn').addEventListener('click', (e) => switchTab(e, 'tab-gamble'));

function switchTab(e, tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// ELEMENTAR KAKTEEN AUSWAHL
document.querySelectorAll('.cactus-select-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.cactus-select-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeCactus = e.target.dataset.cactus;
    
    cactusBtn.src = CACTI_TYPES[activeCactus].img;
    cactusBtn.onerror = () => cactusBtn.src = CACTI_TYPES[activeCactus].fallback;
    playSound('click');
  });
});

// KLICKER
cactusBtn.addEventListener('click', (e) => {
  water += waterPerClick;
  playSound('click');
  createFloatingText(e.clientX, e.clientY, `+${waterPerClick} 💧`, '#66fcf1');
  spawnParticles(e.clientX, e.clientY, '#66fcf1', 8);
  updateUI();
});

// FÄHIGKEITEN
abilityBtn.addEventListener('click', (e) => {
  playSound(activeCactus);
  if (activeCactus === 'fire') {
    const dmg = cactusPower * 3;
    monsterHp = Math.max(0, monsterHp - dmg);
    createFloatingText(e.clientX, e.clientY, `🔥 Feuerball -${dmg}!`, '#ef4444');
    spawnParticles(e.clientX, e.clientY, '#ef4444', 15);
  } else if (activeCactus === 'ice') {
    water += 15;
    createFloatingText(e.clientX, e.clientY, `❄️ Frostblitz +15 💧!`, '#38bdf8');
    spawnParticles(e.clientX, e.clientY, '#38bdf8', 15);
  } else if (activeCactus === 'electro') {
    gold += 10;
    createFloatingText(e.clientX, e.clientY, `⚡ Schockwelle +10 🪙!`, '#eab308');
    spawnParticles(e.clientX, e.clientY, '#eab308', 15);
  } else {
    water += 5;
    createFloatingText(e.clientX, e.clientY, `🌵 Kaktus-Power +5 💧!`, '#22c55e');
    spawnParticles(e.clientX, e.clientY, '#22c55e', 10);
  }
  updateUI();
});

// ANGREIFEN
attackBtn.addEventListener('click', (e) => {
  monsterHp -= cactusPower;
  playSound('click');
  
  dungeonZone.classList.add('shake');
  setTimeout(() => dungeonZone.classList.remove('shake'), 120);

  createFloatingText(e.clientX, e.clientY, `-${cactusPower}`, '#ff4757');
  spawnParticles(e.clientX, e.clientY, '#ff4757', 12);

  if (monsterHp <= 0) {
    let reward = Math.floor(floor * 8 * currentMonster.goldMul);
    gold += reward;
    floor++;
    createFloatingText(e.clientX, e.clientY - 30, `+${reward} GOLD! 🪙`, '#f1c40f');
    spawnParticles(e.clientX, e.clientY, '#f1c40f', 25);
    spawnMonster();
  }
  updateUI();
});

function spawnMonster() {
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
}

// UPGRADES
upgradeWaterBtn.addEventListener('click', () => {
  if (water >= waterUpgradeCost) {
    water -= waterUpgradeCost;
    waterPerClick++;
    waterUpgradeCost = Math.floor(waterUpgradeCost * 1.5);
    playSound('click');
    updateUI();
  }
});

upgradePowerBtn.addEventListener('click', () => {
  if (gold >= powerUpgradeCost) {
    gold -= powerUpgradeCost;
    cactusPower++;
    powerUpgradeCost = Math.floor(powerUpgradeCost * 1.6);
    playSound('click');
    updateUI();
  }
});

// GAMBLING: SLOTS
spinSlotBtn.addEventListener('click', () => {
  if (gold < 50) return;
  gold -= 50;

  const icons = ['🌵', '💎', '💀', '7️⃣'];
  const r1 = icons[Math.floor(Math.random() * icons.length)];
  const r2 = icons[Math.floor(Math.random() * icons.length)];
  const r3 = icons[Math.floor(Math.random() * icons.length)];

  slotDisplay.textContent = `${r1} | ${r2} | ${r3}`;

  if (r1 === r2 && r2 === r3) {
    gold += 500;
    alert("JACKPOT! +500 Gold! 🎉");
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    gold += 75;
    alert("Kleiner Gewinn! +75 Gold! 🪙");
  }
  updateUI();
});

// GAMBLING: MYSTERY BOX
openBoxBtn.addEventListener('click', () => {
  if (water < 100) return;
  water -= 100;

  if (Math.random() > 0.5) {
    let winGold = Math.floor(gold * 0.5) + 20;
    gold += winGold;
    alert(`Gewinn! Du findest ${winGold} Gold!`);
  } else {
    alert("Niete! Nur etwas Staub in der Kiste... 💨");
  }
  updateUI();
});

// ZUFALLS-EVENT
function triggerRandomEvent() {
  randomEventItem.classList.remove('hidden');
  setTimeout(() => randomEventItem.classList.add('hidden'), 4000);
}
setInterval(() => { if(Math.random() < 0.4) triggerRandomEvent(); }, 12000);

randomEventItem.addEventListener('click', (e) => {
  let bonus = floor * 15;
  gold += bonus;
  createFloatingText(e.clientX, e.clientY, `+${bonus} GOLD! ✨`, '#f1c40f');
  spawnParticles(e.clientX, e.clientY, '#f1c40f', 20);
  randomEventItem.classList.add('hidden');
  updateUI();
});

// FLOATING TEXT
function createFloatingText(x, y, text, color = '#66fcf1') {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.left = `${x - 20}px`;
  el.style.top = `${y - 20}px`;
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

// UI UPDATE
function updateUI() {
  waterEl.textContent = water;
  goldEl.textContent = gold;
  powerEl.textContent = cactusPower;

  document.getElementById('cost-water').textContent = waterUpgradeCost;
  document.getElementById('cost-power').textContent = powerUpgradeCost;

  upgradeWaterBtn.disabled = water < waterUpgradeCost;
  upgradePowerBtn.disabled = gold < powerUpgradeCost;
  spinSlotBtn.disabled = gold < 50;
  openBoxBtn.disabled = water < 100;

  document.getElementById('floor').textContent = floor;
  monsterHpEl.textContent = monsterHp;
  monsterMaxHpEl.textContent = monsterMaxHp;

  let hpPercent = Math.max(0, (monsterHp / monsterMaxHp) * 100);
  monsterHpBar.style.width = hpPercent + '%';
}

updateUI();
