import { getSetting, saveSignal, getSignalByDate, updateSignal, saveReflection, getReflection, todayKey, getAllSignals } from '../db.js';
import { generateLetter, generateTTS } from '../api.js';
import { SAMPLE_SIGNALS } from '../sample-data.js';
import { showToast, navigate } from '../app.js';

let audioEl = null;
let currentSignalId = null;

export function renderToday() {
  const el = document.createElement('div');
  el.id = 'screen-today';

  el.innerHTML = `
    <div class="today-wrap">
      <div class="today-top-row">
        <div class="app-title"><div class="app-title-dot"></div>Future Signal</div>
        <button class="generate-btn-sm" id="gen-btn">
          <svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          New Signal
        </button>
      </div>
      <div class="sec-label">// Today's Signal</div>
    </div>
    <div class="sig-line" style="margin: 0 24px 20px;"></div>
    <div id="today-content" style="padding: 0 24px;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:280px;gap:16px;" id="today-loading">
        <div class="sig-loader"><span></span><span></span><span></span><span></span><span></span></div>
        <div style="font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.2em;color:var(--cyan);opacity:0.6;text-transform:uppercase;">Loading signal...</div>
      </div>
    </div>
  `;

  loadToday(el);
  return el;
}

async function loadToday(el) {
  const dateKey = todayKey();
  let signal = await getSignalByDate(dateKey);

  if (!signal) {
    // Use most recent sample as today's signal on first load
    const all = await getAllSignals();
    if (all.length > 0) {
      // Clone the sample as today's signal
      const sample = { ...SAMPLE_SIGNALS[0] };
      sample.id = `signal_today_${dateKey}`;
      sample.date = dateKey;
      sample.createdAt = new Date().toISOString();
      await saveSignal(sample);
      signal = sample;
    }
  }

  if (signal) {
    renderSignal(el, signal);
  } else {
    renderEmpty(el);
  }

  // Set up generate button
  el.querySelector('#gen-btn').addEventListener('click', () => generateNewSignal(el));
}

function renderSignal(el, signal) {
  currentSignalId = signal.id;
  const content = el.querySelector('#today-content');
  const fullLetter = buildLetterText(signal);

  content.innerHTML = `
    <div style="margin-bottom:12px;">
      <span class="future-date-badge"><span class="future-date-dot"></span>${signal.futureDate || 'Unknown Date'}</span>
    </div>
    <div class="transmission-title">${signal.title || 'Transmission'}</div>

    <div class="letter-card">
      <div class="letter-from-line">Transmission from future you</div>
      <div class="letter-body">${escHtml(fullLetter)}</div>
      <div class="letter-sign">— Future You</div>
    </div>

    <div class="audio-player" id="audio-player-wrap">
      <div class="audio-player-header">
        <div class="sec-label" style="margin-bottom:0;padding-bottom:0;">Voice Message from Future You</div>
      </div>
      <div class="audio-waveform-row">
        <div class="waveform-bars" id="waveform-bars">
          ${Array.from({length:20},(_,i)=>`<div class="wbar" id="wbar-${i}"></div>`).join('')}
        </div>
      </div>
      <div class="audio-controls-row">
        <button class="play-btn" id="play-btn" ${!signal.audioUrl ? 'style="opacity:0.4;cursor:not-allowed;"' : ''}>
          <svg class="play-icon" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
          <svg class="pause-icon" viewBox="0 0 24 24" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </button>
        <div class="audio-info">
          <div class="audio-info-title">Play transmission</div>
          <div class="audio-progress-wrap" id="audio-prog-wrap">
            <div class="audio-progress-fill" id="audio-prog-fill"></div>
          </div>
          <div class="audio-time" id="audio-time">--:--</div>
        </div>
        <button class="gen-tts-btn" id="gen-tts-btn" ${!signal.audioUrl ? '' : 'style="display:none"'}>
          ${signal.audioUrl ? 'Regenerate' : 'Generate Voice'}
        </button>
      </div>
    </div>

    <div class="reflection-wrap">
      <div class="sec-label amber">// Reflect</div>
      <div class="reflection-prompt">
        <div class="reflection-q">"${escHtml(signal.reflectionPrompt || signal.question || 'What part of this felt strangely true?')}"</div>
      </div>
      <textarea class="journal-ta" id="reflection-input" placeholder="Write your response here…" rows="4"></textarea>
    </div>
    <div class="action-row">
      <button class="btn-primary" id="save-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17,21 17,13 7,13"/><polyline points="7,3 7,8 15,8"/></svg>
        Save Signal
      </button>
      <button class="btn-ghost" id="archive-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="4" rx="1"/><path d="M4 7v13h16V7"/></svg>
        Archive
      </button>
    </div>
    <div id="save-msg" style="display:none;text-align:center;padding:8px;font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.12em;color:var(--amber);text-transform:uppercase;">
      ✦ Signal saved
    </div>
    <audio id="audio-el" style="display:none"></audio>
  `;

  // Load existing reflection
  (async () => {
    const refl = await getReflection(signal.id);
    if (refl) content.querySelector('#reflection-input').value = refl.text;
  })();

  setupAudioPlayer(content, signal);
  setupButtons(content, signal);
}

function buildLetterText(signal) {
  if (signal.scene || signal.message) {
    const parts = ['Dear Present Me,', ''];
    if (signal.scene) parts.push(signal.scene);
    if (signal.message) parts.push('', signal.message);
    if (signal.insight) parts.push('', signal.insight);
    if (signal.suggestion) parts.push('', signal.suggestion);
    if (signal.question) parts.push('', signal.question);
    return parts.join('\n');
  }
  return signal.letter || '';
}

function setupAudioPlayer(content, signal) {
  const playBtn = content.querySelector('#play-btn');
  const audioEl = content.querySelector('#audio-el');
  const progressFill = content.querySelector('#audio-prog-fill');
  const audioTime = content.querySelector('#audio-time');
  const wbars = content.querySelectorAll('.wbar');

  if (signal.audioUrl) {
    audioEl.src = signal.audioUrl;
  }

  playBtn.addEventListener('click', () => {
    if (!signal.audioUrl) return;
    if (audioEl.paused) {
      audioEl.play();
    } else {
      audioEl.pause();
    }
  });

  audioEl.addEventListener('play', () => {
    playBtn.classList.add('playing');
    wbars.forEach(b => b.classList.add('playing'));
  });
  audioEl.addEventListener('pause', () => {
    playBtn.classList.remove('playing');
    wbars.forEach(b => b.classList.remove('playing'));
  });
  audioEl.addEventListener('ended', () => {
    playBtn.classList.remove('playing');
    wbars.forEach(b => b.classList.remove('playing'));
    progressFill.style.width = '0%';
  });
  audioEl.addEventListener('timeupdate', () => {
    if (audioEl.duration) {
      const pct = (audioEl.currentTime / audioEl.duration) * 100;
      progressFill.style.width = pct + '%';
      audioTime.textContent = formatTime(audioEl.currentTime) + ' / ' + formatTime(audioEl.duration);
    }
  });

  content.querySelector('#audio-prog-wrap').addEventListener('click', (e) => {
    if (!audioEl.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioEl.currentTime = pct * audioEl.duration;
  });

  // TTS generate button
  const ttsBt = content.querySelector('#gen-tts-btn');
  if (ttsBt) {
    ttsBt.addEventListener('click', async () => {
      const apiKey = await getSetting('apiKey');
      const provider = await getSetting('provider') || 'gemini';
      if (!apiKey) { showToast('Add API key in Settings first'); return; }
      const voiceStyle = await getSetting('voiceStyle') || 'Warm Future Self';
      ttsBt.textContent = 'Generating…';
      ttsBt.disabled = true;
      try {
        const url = await generateTTS(apiKey, provider, signal, voiceStyle);
        signal.audioUrl = url;
        await updateSignal(signal.id, { audioUrl: url });
        audioEl.src = url;
        playBtn.style.opacity = '1';
        playBtn.style.cursor = 'pointer';
        ttsBt.style.display = 'none';
        showToast('Voice generated');
      } catch (e) {
        showToast('TTS error: ' + e.message, 3500);
        ttsBt.textContent = 'Retry Voice';
        ttsBt.disabled = false;
      }
    });
  }
}

function setupButtons(content, signal) {
  content.querySelector('#save-btn').addEventListener('click', async () => {
    const text = content.querySelector('#reflection-input').value.trim();
    if (text) await saveReflection(signal.id, text);
    await updateSignal(signal.id, { saved: true });
    const msg = content.querySelector('#save-msg');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 2000);
    showToast('Signal saved');
  });

  content.querySelector('#archive-btn').addEventListener('click', () => navigate('archive'));
}

async function generateNewSignal(el) {
  const apiKey = await getSetting('apiKey');
  const provider = await getSetting('provider') || 'gemini';
  if (!apiKey) { showToast('Add API key in Me → Settings first'); return; }

  const btn = el.querySelector('#gen-btn');
  btn.innerHTML = `<div class="sig-loader" style="transform:scale(0.7)"><span></span><span></span><span></span></div>`;
  btn.disabled = true;

  try {
    const settings = {
      futureDistance: await getSetting('futureDistance') || '10 years',
      tone: await getSetting('tone') || 'Tender',
      themes: await getSetting('themes') || ['Creativity']
    };
    const data = await generateLetter(apiKey, provider, settings);
    const signal = {
      id: `signal_${Date.now()}`,
      date: todayKey(),
      createdAt: new Date().toISOString(),
      saved: false,
      futureDate: data.futureDate,
      title: data.title,
      scene: data.scene,
      message: data.message,
      insight: data.insight,
      suggestion: data.suggestion,
      question: data.question,
      reflectionPrompt: data.reflectionPrompt,
      moodTag: data.moodTag,
      excerpt: data.excerpt,
      audioUrl: null
    };
    await saveSignal(signal);
    renderSignal(el, signal);
    showToast('New transmission received');
  } catch (e) {
    showToast('Generation failed: ' + e.message, 3500);
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> New Signal`;
    btn.disabled = false;
  }
}

function renderEmpty(el) {
  el.querySelector('#today-content').innerHTML = `
    <div style="text-align:center;padding:60px 0;font-family:var(--font-serif);font-style:italic;color:var(--text-dim);line-height:1.7;font-size:0.96rem;">
      No signal received yet.<br>Tap "New Signal" to generate your first transmission.
    </div>
  `;
}

function formatTime(s) {
  if (!s || isNaN(s)) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
