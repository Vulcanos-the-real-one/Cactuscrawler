// SPIELSTAND / STATS
let water = 0;
let gold = 0;
let waterPerClick = 1;
let cactusPower = 1;

let waterUpgradeCost = 10;
let powerUpgradeCost = 15;

// MONSTER STATS
let floor = 1;
let monsterMaxHp = 20;
let monsterHp = 20;

// DOM ELEMENTE
const waterEl = document.getElementById('water');
const goldEl = document.getElementById('gold');
const powerEl = document.getElementById('power');
const cactusBtn = document.getElementById('cactus-clicker');

const upgradeWaterBtn = document.getElementById('upgrade-water-btn');
const upgradePowerBtn = document.getElementById('upgrade-power-btn');
const costWaterEl = document.getElementById('cost-water');
const costPowerEl = document.getElementById('cost-power');

const floorEl = document.getElementById('floor');
const monsterHpEl = document.getElementById('monster-hp');
const monsterMaxHpEl = document.getElementById('monster-max-hp');
const monsterHpBar = document.getElementById('monster-hp-bar');
const attackBtn = document.getElementById('attack-btn');

// KAKTUS KLICKEN (WASSER ERMITTELN)
cactusBtn.addEventListener('click', () => {
  water += waterPerClick;
  updateUI();
});

// UPGRADE: WASSER PRO KLICK
upgradeWaterBtn.addEventListener('click', () => {
  if (water >= waterUpgradeCost) {
    water -= waterUpgradeCost;
    waterPerClick += 1;
    waterUpgradeCost = Math.floor(waterUpgradeCost * 1.5);
    updateUI();
  }
});

// UPGRADE: KAKTUS POWER (MIT GOLD)
upgradePowerBtn.addEventListener('click', () => {
  if (gold >= powerUpgradeCost) {
    gold -= powerUpgradeCost;
    cactusPower += 1;
    powerUpgradeCost = Math.floor(powerUpgradeCost * 1.6);
    updateUI();
  }
});

// MONSTER ANGREIFEN
attackBtn.addEventListener('click', () => {
  monsterHp -= cactusPower;
  
  if (monsterHp <= 0) {
    // Monster besiegt
    let goldReward = floor * 5;
    gold += goldReward;
    floor += 1;
    
    // Neues Monster skaliert hoch
    monsterMaxHp = Math.floor(20 * Math.pow(1.3, floor - 1));
    monsterHp = monsterMaxHp;
  }
  
  updateUI();
});

// UI AKTUALISIEREN
function updateUI() {
  waterEl.textContent = water;
  goldEl.textContent = gold;
  powerEl.textContent = cactusPower;
  
  costWaterEl.textContent = waterUpgradeCost;
  costPowerEl.textContent = powerUpgradeCost;
  
  upgradeWaterBtn.disabled = water < waterUpgradeCost;
  upgradePowerBtn.disabled = gold < powerUpgradeCost;
  
  floorEl.textContent = floor;
  monsterHpEl.textContent = monsterHp;
  monsterMaxHpEl.textContent = monsterMaxHp;
  
  let hpPercent = Math.max(0, (monsterHp / monsterMaxHp) * 100);
  monsterHpBar.style.width = hpPercent + '%';
}

updateUI();
