import { getAllSignals, getReflection } from '../db.js';
import { showToast } from '../app.js';

const MOOD_CLASS = {
  'creative spark': 'mt-amber', 'soft warning': 'mt-cyan',
  'future memory': 'mt-purple', 'threshold': 'mt-amber',
  'quiet knowing': 'mt-cyan', 'timeline echo': 'mt-purple',
  'signal drift': 'mt-cyan', 'deep return': 'mt-green'
};

export function renderArchive() {
  const el = document.createElement('div');

  el.innerHTML = `
    <div class="screen-header">
      <div class="app-title"><div class="app-title-dot"></div>Future Signal</div>
    </div>
    <div class="today-wrap" style="padding-top:0;padding-bottom:0;">
      <div class="sec-label">// Past Transmissions</div>
    </div>
    <div class="sig-line" style="margin: 0 24px 12px;"></div>
    <div class="filter-row" id="filter-row">
      <button class="chip chip-cyan active" data-filter="all">All</button>
      <button class="chip chip-cyan" data-filter="saved">Saved</button>
      <button class="chip chip-cyan" data-filter="voice">Voice</button>
    </div>
    <div class="archive-list" id="archive-list">
      <div style="text-align:center;padding:40px;font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.2em;color:var(--text-dim);text-transform:uppercase;">
        <div class="sig-loader" style="justify-content:center;margin-bottom:12px;"><span></span><span></span><span></span><span></span><span></span></div>
        Loading archive…
      </div>
    </div>
  `;

  let allSignals = [];
  let activeFilter = 'all';

  const filterRow = el.querySelector('#filter-row');
  filterRow.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    filterRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderList(activeFilter, allSignals, el);
  });

  loadArchive(el).then(signals => {
    allSignals = signals;
    renderList(activeFilter, signals, el);
  });

  return el;
}

async function loadArchive(el) {
  const signals = await getAllSignals();
  return signals;
}

async function renderList(filter, signals, el) {
  const list = el.querySelector('#archive-list');
  let filtered = signals;
  if (filter === 'saved') filtered = signals.filter(s => s.saved);
  if (filter === 'voice') filtered = signals.filter(s => s.audioUrl);

  if (filtered.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px 24px;font-family:var(--font-serif);font-style:italic;color:var(--text-dim);font-size:0.95rem;line-height:1.7;opacity:0.6;">
        No transmissions here yet.
      </div>`;
    return;
  }

  // Build cards
  const reflections = await getAllReflectionsMap(filtered);
  list.innerHTML = filtered.map(s => buildCard(s, reflections[s.id])).join('');

  // Bind events
  list.querySelectorAll('.archive-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.replay-btn')) return;
      openModal(card.dataset.id, signals);
    });
  });

  list.querySelectorAll('.replay-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const signal = signals.find(s => s.id === btn.dataset.id);
      if (!signal?.audioUrl) { showToast('No voice for this signal'); return; }
      const audio = new Audio(signal.audioUrl);
      audio.play().catch(() => showToast('Audio playback failed'));
    });
  });
}

async function getAllReflectionsMap(signals) {
  const map = {};
  for (const s of signals) {
    const r = await getReflection(s.id);
    if (r) map[s.id] = r;
  }
  return map;
}

function buildCard(signal, reflection) {
  const moodClass = MOOD_CLASS[signal.moodTag] || 'mt-cyan';
  const recvDate = signal.date ? formatDate(signal.date) : '—';

  return `
    <div class="archive-card" data-id="${signal.id}">
      <div class="arc-top">
        <div class="arc-dates">
          <div class="arc-received">Received ${recvDate}</div>
          <div class="arc-future">→ ${signal.futureDate || 'Future'}</div>
        </div>
        <span class="mood-tag ${moodClass}">${signal.moodTag || 'signal'}</span>
      </div>
      <div class="arc-title">${escHtml(signal.title || 'Untitled Transmission')}</div>
      <div class="arc-excerpt">${escHtml(signal.excerpt || '')}</div>
      <div class="arc-bottom">
        <button class="replay-btn" data-id="${signal.id}">
          <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
          Play Voice
        </button>
        ${reflection ? `<span class="arc-has-reflection">✦ Reflected</span>` : '<span></span>'}
      </div>
    </div>
  `;
}

function openModal(signalId, signals) {
  const signal = signals.find(s => s.id === signalId);
  if (!signal) return;

  // Build letter text
  const parts = ['Dear Present Me,', ''];
  if (signal.scene) parts.push(signal.scene);
  if (signal.message) parts.push('', signal.message);
  if (signal.insight) parts.push('', signal.insight);
  if (signal.suggestion) parts.push('', signal.suggestion);
  if (signal.question) parts.push('', signal.question);
  if (!signal.scene && signal.letter) parts.length = 0, parts.push(signal.letter);
  const letterText = parts.join('\n');

  const modal = document.createElement('div');
  modal.className = 'sig-modal';
  modal.innerHTML = `
    <div class="modal-bar">
      <div>
        <div class="sec-label" style="margin:0;">// ${formatDate(signal.date)}</div>
        <div style="font-family:var(--font-display);font-size:0.75rem;font-weight:700;color:var(--cream);letter-spacing:0.04em;margin-top:4px;">${escHtml(signal.title || '')}</div>
      </div>
      <button class="modal-close" id="modal-close">
        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal-scroll">
      <div style="margin-bottom:12px;">
        <span class="future-date-badge"><span class="future-date-dot"></span>${signal.futureDate || ''}</span>
      </div>
      <div class="letter-card" style="margin-bottom:20px;">
        <div class="letter-from-line">Transmission from future you</div>
        <div class="letter-body">${escHtml(letterText)}</div>
        <div class="letter-sign">— Future You</div>
      </div>
      ${signal.reflectionPrompt ? `
        <div class="sec-label amber">// Reflection Prompt</div>
        <div class="reflection-prompt" style="margin-bottom:16px;">
          <div class="reflection-q">"${escHtml(signal.reflectionPrompt)}"</div>
        </div>
      ` : ''}
      <div id="modal-reflection-area"></div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('open')));

  // Load reflection
  getReflection(signal.id).then(r => {
    if (r) {
      modal.querySelector('#modal-reflection-area').innerHTML = `
        <div class="sec-label">// Your Response</div>
        <div style="font-family:var(--font-serif);font-style:italic;font-size:0.95rem;color:var(--cream);line-height:1.7;padding:14px 16px;background:var(--panel);border:1px solid var(--border);border-radius:8px;">${escHtml(r.text)}</div>
      `;
    }
  });

  modal.querySelector('#modal-close').addEventListener('click', () => {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 380);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
