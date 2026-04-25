// Future Signal — App Entry Point & Router
import { openDB, getSetting, setSetting } from './db.js';
import { renderOnboarding } from './screens/onboarding.js';
import { renderToday } from './screens/today.js';
import { renderArchive } from './screens/archive.js';
import { renderJournal } from './screens/journal.js';
import { renderMe } from './screens/me.js';

const SCREENS = { today: renderToday, archive: renderArchive, journal: renderJournal, me: renderMe };
let currentScreen = null;

async function init() {
  await openDB();
  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  // Check for API key
  const apiKey = await getSetting('apiKey');
  if (!apiKey) {
    showOnboarding();
  } else {
    showNav();
    navigate('today');
  }
  setupNav();
}

function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.screen));
  });
}

export function navigate(screenName) {
  if (currentScreen === screenName) return;
  const container = document.getElementById('screen-container');
  // Exit current
  const old = container.querySelector('.screen.active');
  if (old) {
    old.classList.remove('active');
    old.classList.add('exit');
    setTimeout(() => old.remove(), 300);
  }
  // Update nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === screenName));
  // Render new
  const renderer = SCREENS[screenName];
  if (!renderer) return;
  const el = renderer();
  el.classList.add('screen');
  el.id = `screen-${screenName}`;
  container.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('active')));
  currentScreen = screenName;
}

export function showOnboarding() {
  const container = document.getElementById('screen-container');
  document.getElementById('bottom-nav').classList.add('hidden');
  container.innerHTML = '';
  const el = renderOnboarding(() => {
    showNav();
    navigate('today');
  });
  el.id = 'screen-onboarding';
  el.classList.add('screen', 'active');
  el.style.paddingBottom = '0';
  container.appendChild(el);
  currentScreen = null;
}

export function showNav() {
  document.getElementById('bottom-nav').classList.remove('hidden');
}

export function showToast(msg, duration = 2200) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

init();
