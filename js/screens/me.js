import { getSetting, setSetting } from '../db.js';
import { showToast, showOnboarding } from '../app.js';

const VOICE_STYLES = [
  { id: 'Warm Future Self', desc: 'grounded and intimate' },
  { id: 'Older Wiser Self', desc: 'calm and weathered' },
  { id: 'Cosmic Self', desc: 'dreamlike and poetic' },
  { id: 'Raw Voice Clone', desc: 'your own voice, softly transformed' }
];

const AMBIENT_OPTIONS = [
  { id: 'None', icon: '—' },
  { id: 'Rain', icon: '🌧' },
  { id: 'Soft Room Tone', icon: '◎' },
  { id: 'Distant City', icon: '🌃' },
  { id: 'Low Synth Pulse', icon: '∿' }
];

const FUTURE_DISTANCES = ['1 year', '5 years', '10 years', '25 years', 'Random'];
const TONES = ['Tender', 'Direct', 'Strange', 'Funny', 'Dreamlike', 'Brutally honest'];
const THEMES = ['Creativity', 'Relationships', 'Health', 'AI / Tech', 'Spiritual growth', 'Courage', 'Hidden patterns'];

export function renderMe() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="screen-header">
      <div class="app-title"><div class="app-title-dot"></div>Future Signal</div>
    </div>
    <div class="today-wrap" style="padding-top:0;padding-bottom:8px;">
      <div class="sec-label">// Me</div>
    </div>
    <div class="me-tabs">
      <button class="me-tab active" data-tab="voice">Voice Identity</button>
      <button class="me-tab" data-tab="settings">Signal Settings</button>
    </div>
    <div id="panel-voice" class="me-panel active"></div>
    <div id="panel-settings" class="me-panel"></div>
  `;

  // Tab switching
  el.querySelectorAll('.me-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      el.querySelectorAll('.me-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      el.querySelectorAll('.me-panel').forEach(p => p.classList.remove('active'));
      el.querySelector(`#panel-${tab.dataset.tab}`).classList.add('active');
    });
  });

  initVoicePanel(el);
  initSettingsPanel(el);
  return el;
}

async function initVoicePanel(el) {
  const panel = el.querySelector('#panel-voice');
  const selectedVoice = await getSetting('voiceStyle') || 'Warm Future Self';
  const selectedAmbient = await getSetting('ambientBg') || 'None';

  panel.innerHTML = `
    <div class="sec-label" style="margin-bottom:12px;">Choose how future you sounds</div>
    <div class="voice-preview-card">
      <button class="voice-preview-play" id="preview-play">
        <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
      </button>
      <div class="mini-wave">
        ${Array.from({length:7},()=>`<div class="mini-wave-bar"></div>`).join('')}
      </div>
      <div style="font-family:var(--font-mono);font-size:0.55rem;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;white-space:nowrap;">Preview voice</div>
    </div>
    <div class="voice-style-list" id="voice-style-list">
      ${VOICE_STYLES.map(v => `
        <div class="voice-style-card ${v.id === selectedVoice ? 'selected' : ''}" data-voice="${v.id}">
          <div class="vs-info">
            <div class="vs-name">${v.id}</div>
            <div class="vs-desc">${v.desc}</div>
          </div>
          <div class="vs-dot"></div>
        </div>
      `).join('')}
    </div>
    <div class="ambient-label">Ambient Background</div>
    <div class="ambient-row" id="ambient-row">
      ${AMBIENT_OPTIONS.map(a => `
        <button class="amb-btn ${a.id === selectedAmbient ? 'active' : ''}" data-ambient="${a.id}">
          <span class="amb-icon">${a.icon}</span>
          ${a.id}
        </button>
      `).join('')}
    </div>
  `;

  // Voice style selection
  panel.querySelector('#voice-style-list').addEventListener('click', async (e) => {
    const card = e.target.closest('.voice-style-card');
    if (!card) return;
    panel.querySelectorAll('.voice-style-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    await setSetting('voiceStyle', card.dataset.voice);
    showToast('Voice updated');
  });

  // Ambient selection
  panel.querySelector('#ambient-row').addEventListener('click', async (e) => {
    const btn = e.target.closest('.amb-btn');
    if (!btn) return;
    panel.querySelectorAll('.amb-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    await setSetting('ambientBg', btn.dataset.ambient);
    showToast('Ambient: ' + btn.dataset.ambient);
  });

  panel.querySelector('#preview-play').addEventListener('click', () => {
    showToast('Preview requires API key + voice generation');
  });
}

async function initSettingsPanel(el) {
  const panel = el.querySelector('#panel-settings');

  const distance = await getSetting('futureDistance') || '10 years';
  const tone = await getSetting('tone') || 'Tender';
  const themes = await getSetting('themes') || ['Creativity', 'AI / Tech'];
  const voiceEnabled = await getSetting('voiceEnabled') !== false;
  const rememberRef = await getSetting('rememberReflections') !== false;
  const apiKey = await getSetting('apiKey');
  const provider = await getSetting('provider') || 'gemini';

  panel.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Future Distance</div>
      <div class="chip-grid" id="distance-chips">
        ${FUTURE_DISTANCES.map(d => `
          <button class="chip chip-amber ${d === distance ? 'active' : ''}" data-distance="${d}">${d}</button>
        `).join('')}
      </div>
    </div>
    <div class="settings-divider"></div>
    <div class="settings-section">
      <div class="settings-section-title">Tone</div>
      <div class="chip-grid" id="tone-chips">
        ${TONES.map(t => `
          <button class="chip chip-cyan ${t === tone ? 'active' : ''}" data-tone="${t}">${t}</button>
        `).join('')}
      </div>
    </div>
    <div class="settings-divider"></div>
    <div class="settings-section">
      <div class="settings-section-title">Focus Themes (multi-select)</div>
      <div class="chip-grid" id="theme-chips">
        ${THEMES.map(th => `
          <button class="chip chip-cyan ${themes.includes(th) ? 'active' : ''}" data-theme="${th}">${th}</button>
        `).join('')}
      </div>
    </div>
    <div class="settings-divider"></div>
    <div class="settings-section">
      <div class="settings-section-title">Delivery</div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-label">Daily Voice Message</div>
          <div class="toggle-sublabel">Auto-generate TTS each day</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="voice-toggle" ${voiceEnabled ? 'checked' : ''}>
          <div class="toggle-track"><div class="toggle-thumb"></div></div>
        </label>
      </div>
      <div class="thin-divider"></div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-label">Remember Reflections</div>
          <div class="toggle-sublabel">Save journal responses automatically</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="reflect-toggle" ${rememberRef ? 'checked' : ''}>
          <div class="toggle-track"><div class="toggle-thumb"></div></div>
        </label>
      </div>
    </div>
    <div class="settings-divider"></div>
    <div class="settings-section">
      <div class="settings-section-title">API Connection</div>
      ${apiKey ? `
        <div class="api-key-row">
          <div class="api-key-val">${provider.toUpperCase()} · ${maskKey(apiKey)}</div>
          <button class="api-change-btn" id="change-key-btn">Change</button>
        </div>
      ` : `
        <div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-dim);letter-spacing:0.1em;margin-bottom:12px;">No API key connected</div>
        <button class="btn-ghost" id="add-key-btn" style="width:100%;">Add API Key</button>
      `}
    </div>
  `;

  // Distance chips
  panel.querySelector('#distance-chips').addEventListener('click', async (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    panel.querySelectorAll('#distance-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    await setSetting('futureDistance', chip.dataset.distance);
  });

  // Tone chips (single select)
  panel.querySelector('#tone-chips').addEventListener('click', async (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    panel.querySelectorAll('#tone-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    await setSetting('tone', chip.dataset.tone);
  });

  // Theme chips (multi-select)
  panel.querySelector('#theme-chips').addEventListener('click', async (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chip.classList.toggle('active');
    const selected = [...panel.querySelectorAll('#theme-chips .chip.active')].map(c => c.dataset.theme);
    await setSetting('themes', selected);
  });

  // Toggles
  panel.querySelector('#voice-toggle').addEventListener('change', async (e) => {
    await setSetting('voiceEnabled', e.target.checked);
  });
  panel.querySelector('#reflect-toggle').addEventListener('change', async (e) => {
    await setSetting('rememberReflections', e.target.checked);
  });

  // API key buttons
  const changeBtn = panel.querySelector('#change-key-btn');
  const addBtn = panel.querySelector('#add-key-btn');
  if (changeBtn) changeBtn.addEventListener('click', () => showOnboarding());
  if (addBtn) addBtn.addEventListener('click', () => showOnboarding());
}

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 6) + '••••••••' + key.slice(-4);
}
