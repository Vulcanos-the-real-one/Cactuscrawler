// STATS
let water = 0;
let gold = 0;
let waterPerClick = 1;
let cactusPower = 1;

let waterUpgradeCost = 10;
let powerUpgradeCost = 15;

// MONSTER DATENBANK
const MONSTER_TYPES = [
  { name: "Wüsten-Schnecke", class: "monster-snail", hpMul: 1, goldMul: 1 },
  { name: "Sand-Skorpion", class: "monster-scorpion", hpMul: 1.4, goldMul: 1.5 },
  { name: "Stein-Golem", class: "monster-golem", hpMul: 2.2, goldMul: 2.5 },
  { name: "BOSS: Kaktus-Drache", class: "monster-boss", hpMul: 4.5, goldMul: 6.0 }
];

let floor = 1;
let currentMonster = MONSTER_TYPES[0];
let monsterMaxHp = 20;
let monsterHp = 20;

// DOM ELEMENTE
const waterEl = document.getElementById('water');
const goldEl = document.getElementById('gold');
const powerEl = document.getElementById('power');
const cactusBtn = document.getElementById('cactus-clicker');
const clickContainer = document.getElementById('clicker-zone');

const monsterAvatar = document.getElementById('monster-avatar');
const monsterName = document.getElementById('monster-name');
const monsterBadge = document.getElementById('monster-type-badge');
const monsterHpEl = document.getElementById('monster-hp');
const monsterMaxHpEl = document.getElementById('monster-max-hp');
const monsterHpBar = document.getElementById('monster-hp-bar');
const attackBtn = document.getElementById('attack-btn');
const dungeonZone = document.getElementById('dungeon-zone');

const upgradeWaterBtn = document.getElementById('upgrade-water-btn');
const upgradePowerBtn = document.getElementById('upgrade-power-btn');

// GAMBLE ELEMENTE
const spinSlotBtn = document.getElementById('spin-slot-btn');
const slotDisplay = document.getElementById('slot-display');
const openBoxBtn = document.getElementById('open-box-btn');
const randomEventItem = document.getElementById('random-event-item');

// TABS SYSTEM
document.getElementById('tab-upgrades-btn').addEventListener('click', (e) => switchTab(e, 'tab-upgrades'));
document.getElementById('tab-gamble-btn').addEventListener('click', (e) => switchTab(e, 'tab-gamble'));

function switchTab(e, tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// KLICKER (MIT FLOATING DAMAGE/EFFECT)
cactusBtn.addEventListener('click', (e) => {
  water += waterPerClick;
  createFloatingText(e.clientX, e.clientY, `+${waterPerClick} 💧`);
  updateUI();
});

// ANGREIFEN (MIT SHAKE & FLOATING TEXT)
attackBtn.addEventListener('click', (e) => {
  monsterHp -= cactusPower;
  
  // Effects
  dungeonZone.classList.add('shake');
  setTimeout(() => dungeonZone.classList.remove('shake'), 150);
  createFloatingText(e.clientX, e.clientY, `-${cactusPower}`, '#ff4757');

  if (monsterHp <= 0) {
    let reward = Math.floor(floor * 8 * currentMonster.goldMul);
    gold += reward;
    floor++;
    spawnMonster();
  }
  updateUI();
});

function spawnMonster() {
  // Boss jede 5 Ebenen
  if (floor % 5 === 0) {
    currentMonster = MONSTER_TYPES[3]; 
    monsterBadge.textContent = "BOSS";
    monsterBadge.style.background = "#ff0055";
  } else {
    currentMonster = MONSTER_TYPES[Math.floor(Math.random() * 3)];
    monsterBadge.textContent = "Ebene " + floor;
    monsterBadge.style.background = "#3d3d5c";
  }

  monsterAvatar.className = "monster-icon " + currentMonster.class;
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
    updateUI();
  }
});

upgradePowerBtn.addEventListener('click', () => {
  if (gold >= powerUpgradeCost) {
    gold -= powerUpgradeCost;
    cactusPower++;
    powerUpgradeCost = Math.floor(powerUpgradeCost * 1.6);
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

  let chance = Math.random();
  if (chance > 0.5) {
    let winGold = Math.floor(gold * 0.5) + 20;
    gold += winGold;
    alert(`Gewinn! Du findest ${winGold} Gold!`);
  } else {
    alert("Niete! Nur etwas Staub in der Kiste... 💨");
  }
  updateUI();
});

// ZUFALLS-EVENT (GOLDENER KAKTUS)
function triggerRandomEvent() {
  randomEventItem.classList.remove('hidden');
  setTimeout(() => randomEventItem.classList.add('hidden'), 4000);
}
setInterval(() => { if(Math.random() < 0.4) triggerRandomEvent(); }, 12000);

randomEventItem.addEventListener('click', (e) => {
  let bonus = floor * 15;
  gold += bonus;
  createFloatingText(e.clientX, e.clientY, `+${bonus} GOLD! ✨`, '#ffa502');
  randomEventItem.classList.add('hidden');
  updateUI();
});

// HELPER: FLOATING TEXT EFFECT
function createFloatingText(x, y, text, color = '#2ed573') {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.left = `${x - 20}px`;
  el.style.top = `${y - 20}px`;
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
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
