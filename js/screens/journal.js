import { getAllSignals, getReflection, saveReflection } from '../db.js';
import { showToast } from '../app.js';

export function renderJournal() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="screen-header">
      <div class="app-title"><div class="app-title-dot"></div>Future Signal</div>
    </div>
    <div class="today-wrap" style="padding-top:0;padding-bottom:0;">
      <div class="sec-label">// Reflection Journal</div>
    </div>
    <div class="sig-line" style="margin: 0 24px 16px;"></div>
    <div class="journal-list" id="journal-list">
      <div style="text-align:center;padding:40px;font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.2em;color:var(--text-dim);text-transform:uppercase;">
        <div class="sig-loader" style="justify-content:center;margin-bottom:12px;"><span></span><span></span><span></span><span></span><span></span></div>
        Loading journal…
      </div>
    </div>
  `;

  loadJournal(el);
  return el;
}

async function loadJournal(el) {
  const signals = await getAllSignals();
  const list = el.querySelector('#journal-list');

  const entries = [];
  for (const s of signals) {
    const r = await getReflection(s.id);
    if (r) entries.push({ signal: s, reflection: r });
  }

  if (entries.length === 0) {
    list.innerHTML = `
      <div class="je-empty">
        Your reflections will appear here.<br><br>
        Write a response to today's signal<br>and save it to begin your journal.
      </div>`;
    return;
  }

  list.innerHTML = entries.map(({ signal, reflection }) => {
    const date = signal.date ? formatDate(signal.date) : '—';
    return `
      <div class="je-card" data-id="${signal.id}">
        <div class="je-header">
          <div class="je-date">${date}</div>
          <div class="je-future">→ ${signal.futureDate || 'Future'}</div>
        </div>
        <div class="je-title">${escHtml(signal.title || 'Untitled')}</div>
        <div class="je-reflection">${escHtml(reflection.text)}</div>
      </div>
    `;
  }).join('');

  // Tap to expand / edit
  list.querySelectorAll('.je-card').forEach(card => {
    card.addEventListener('click', () => openEntry(card.dataset.id, entries, list));
  });
}

function openEntry(id, entries, list) {
  const entry = entries.find(e => e.signal.id === id);
  if (!entry) return;

  const modal = document.createElement('div');
  modal.className = 'sig-modal';
  modal.innerHTML = `
    <div class="modal-bar">
      <div>
        <div class="sec-label" style="margin:0;">// ${formatDate(entry.signal.date)}</div>
        <div style="font-family:var(--font-display);font-size:0.72rem;font-weight:700;color:var(--cream);letter-spacing:0.04em;margin-top:4px;">${escHtml(entry.signal.title || '')}</div>
      </div>
      <button class="modal-close" id="jm-close">
        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal-scroll">
      ${entry.signal.reflectionPrompt ? `
        <div class="sec-label amber">// Reflection Prompt</div>
        <div class="reflection-prompt" style="margin-bottom:20px;">
          <div class="reflection-q">"${escHtml(entry.signal.reflectionPrompt)}"</div>
        </div>
      ` : ''}
      <div class="sec-label">// Your Response</div>
      <textarea class="journal-ta" id="je-edit-ta" rows="8">${escHtml(entry.reflection.text)}</textarea>
      <div style="margin-top:12px;">
        <button class="btn-primary" id="je-save-btn">Save Reflection</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('open')));

  modal.querySelector('#jm-close').addEventListener('click', () => {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 380);
  });

  modal.querySelector('#je-save-btn').addEventListener('click', async () => {
    const text = modal.querySelector('#je-edit-ta').value.trim();
    if (!text) return;
    await saveReflection(entry.signal.id, text);
    entry.reflection.text = text;
    // Update card in list
    const card = list.querySelector(`[data-id="${id}"]`);
    if (card) card.querySelector('.je-reflection').textContent = text;
    showToast('Reflection saved');
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
