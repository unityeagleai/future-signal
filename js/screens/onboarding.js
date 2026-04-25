import { setSetting } from '../db.js';
import { DEFAULT_SETTINGS } from '../sample-data.js';

export function renderOnboarding(onComplete) {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 28px;text-align:center;">
      <div style="margin-bottom:32px;">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="36" cy="36" r="34" stroke="rgba(0,229,255,0.2)" stroke-width="1.5"/>
          <circle cx="36" cy="36" r="26" stroke="rgba(0,229,255,0.12)" stroke-width="1"/>
          <circle cx="36" cy="36" r="5" fill="#00E5FF" opacity="0.8"/>
          <line x1="36" y1="2" x2="36" y2="10" stroke="#00E5FF" stroke-width="1.5" opacity="0.6"/>
          <line x1="36" y1="62" x2="36" y2="70" stroke="#00E5FF" stroke-width="1.5" opacity="0.6"/>
          <line x1="2" y1="36" x2="10" y2="36" stroke="#00E5FF" stroke-width="1.5" opacity="0.6"/>
          <line x1="62" y1="36" x2="70" y2="36" stroke="#00E5FF" stroke-width="1.5" opacity="0.6"/>
          <line x1="36" y1="36" x2="36" y2="18" stroke="#D4A056" stroke-width="2" stroke-linecap="round" style="transform-origin:36px 36px;transform:rotate(0deg)">
            <animateTransform attributeName="transform" type="rotate" from="0 36 36" to="360 36 36" dur="8s" repeatCount="indefinite"/>
          </line>
        </svg>
      </div>
      <div class="ob-title">Future Signal</div>
      <div class="ob-sub">Daily transmissions from your future self</div>
      <p class="ob-body">
        Every morning, a letter arrives. Written by the person you are becoming. Read it. Listen to it. Respond to it. Let it become a private ritual.
      </p>
      <div class="ob-form">
        <div class="provider-tabs" id="provider-tabs">
          <button class="provider-tab active" data-provider="gemini">Gemini</button>
          <button class="provider-tab" data-provider="grok">Grok</button>
        </div>
        <div class="input-group">
          <label class="input-label" id="key-label">Gemini API Key</label>
          <input class="signal-input" id="api-key-input" type="password"
            placeholder="AIza..." autocomplete="off" autocorrect="off" spellcheck="false">
          <div class="input-note">Stored locally on your device only. Never transmitted.</div>
        </div>
        <button class="btn-primary" id="ob-submit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Begin Transmission
        </button>
        <button id="ob-demo" style="background:none;border:none;color:var(--text-dim);font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.12em;cursor:pointer;text-transform:uppercase;margin-top:4px;padding:8px;">
          Explore without API key →
        </button>
      </div>
    </div>
  `;

  let selectedProvider = 'gemini';

  // Provider tab switching
  el.querySelectorAll('.provider-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      el.querySelectorAll('.provider-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedProvider = tab.dataset.provider;
      const input = el.querySelector('#api-key-input');
      const label = el.querySelector('#key-label');
      if (selectedProvider === 'gemini') {
        input.placeholder = 'AIza...';
        label.textContent = 'Gemini API Key';
      } else {
        input.placeholder = 'xai-...';
        label.textContent = 'Grok API Key';
      }
    });
  });

  // Submit with key
  el.querySelector('#ob-submit').addEventListener('click', async () => {
    const key = el.querySelector('#api-key-input').value.trim();
    if (!key) {
      el.querySelector('#api-key-input').style.borderColor = 'rgba(255,80,80,0.5)';
      return;
    }
    await setSetting('apiKey', key);
    await setSetting('provider', selectedProvider);
    await initDefaultSettings();
    onComplete();
  });

  // Demo mode (no key)
  el.querySelector('#ob-demo').addEventListener('click', async () => {
    await initDefaultSettings();
    onComplete();
  });

  return el;
}

async function initDefaultSettings() {
  const { setSetting } = await import('../db.js');
  const { DEFAULT_SETTINGS, SAMPLE_SIGNALS } = await import('../sample-data.js');
  const { saveSignal, getSetting } = await import('../db.js');

  // Save default settings if not already set
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await getSetting(key);
    if (existing === null) await setSetting(key, value);
  }

  // Seed sample signals
  const { getAllSignals } = await import('../db.js');
  const existing = await getAllSignals();
  if (existing.length === 0) {
    for (const s of SAMPLE_SIGNALS) {
      await saveSignal(s);
    }
  }
}
