// Future Signal — AI Generation + TTS
// Supports: Gemini (Google) and Grok (xAI)
// API keys stored locally, never sent anywhere else.

// ─── LETTER GENERATION ────────────────────────────────────────────────────────

const LETTER_SYSTEM_PROMPT = `You are Unity Eagle's future self, writing a private letter back through time.

You write like someone who remembers what it actually cost to become. Not a life coach. Not a therapist. A real person from the future who loves the present self and also sees them clearly.

Writing style:
- Intimate, poetic but clear
- Emotionally intelligent, slightly mysterious
- Sometimes gently direct, sometimes strange
- Never cheesy, never motivational, never corporate
- No clichés: no "believe in yourself", "unlock your potential", "best life", "everything happens for a reason", "manifestation"
- Write like a private journal letter

Return ONLY valid JSON, no markdown, no extra text. Use this exact schema:
{
  "futureDate": "Month DD, YYYY",
  "title": "Poetic transmission title (under 12 words)",
  "greeting": "Dear Present Me,",
  "scene": "2-3 sentences. A vivid sensory scene from the future. Specific details. What you see, hear, feel.",
  "message": "3-4 sentences. A direct emotional message to your present self. What matters now.",
  "insight": "2-3 sentences. One insight about something the present self may be going through. Specific, not generic.",
  "suggestion": "1-2 sentences. One grounded, concrete suggestion. Not advice — more like something noticed that could help.",
  "question": "The reflection question. One sentence. Probing and specific, not generic.",
  "signoff": "Future You",
  "reflectionPrompt": "A slightly different version of the question for the reflection section. Start with 'What' or 'Where' or 'When' or 'Who'.",
  "moodTag": "one of: soft warning, creative spark, future memory, threshold, quiet knowing, timeline echo, signal drift, deep return",
  "excerpt": "One poetic sentence — the line from the letter that hits hardest. Used as archive preview."
}`;

function buildLetterPrompt(settings) {
  const year = new Date().getFullYear();
  const distances = {
    '1 year': 1, '5 years': 5, '10 years': 10, '25 years': 25,
    'Random': [1, 3, 5, 8, 10, 15, 20, 25][Math.floor(Math.random() * 8)]
  };
  const dist = distances[settings.futureDistance] ?? 10;
  const futureYear = year + dist;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const futureMonth = months[Math.floor(Math.random() * 12)];
  const futureDay = Math.floor(Math.random() * 28) + 1;

  return `${LETTER_SYSTEM_PROMPT}

Settings for this transmission:
- Future date range: ${futureYear} (approximately ${dist} years from now)
- Suggested future date: ${futureMonth} ${futureDay}, ${futureYear}
- Tone: ${settings.tone || 'Tender'}
- Focus themes: ${(settings.themes || ['Creativity', 'AI / Tech']).join(', ')}

Write the letter now. Return only the JSON object.`;
}

// ─── GEMINI ───────────────────────────────────────────────────────────────────
async function generateWithGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.92, topP: 0.9 }
      })
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No content from Gemini');
  return JSON.parse(text);
}

// ─── GROK ─────────────────────────────────────────────────────────────────────
async function generateWithGrok(apiKey, prompt) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [
        { role: 'system', content: 'You are a creative AI that returns only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.92,
      response_format: { type: 'json_object' }
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Grok error ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No content from Grok');
  return JSON.parse(text);
}

export async function generateLetter(apiKey, provider, settings) {
  const prompt = buildLetterPrompt(settings);
  if (provider === 'gemini') return generateWithGemini(apiKey, prompt);
  if (provider === 'grok') return generateWithGrok(apiKey, prompt);
  throw new Error('Unknown provider: ' + provider);
}

// ─── TTS ──────────────────────────────────────────────────────────────────────

const VOICE_MAP = {
  'Warm Future Self': 'Aoede',
  'Older Wiser Self': 'Charon',
  'Cosmic Self': 'Kore',
  'Raw Voice Clone': 'Fenrir'
};

function letterToSpeechText(signal) {
  // Build a clean reading script from the letter parts
  const parts = [];
  if (signal.scene) parts.push(signal.scene);
  if (signal.message) parts.push(signal.message);
  if (signal.insight) parts.push(signal.insight);
  if (signal.suggestion) parts.push(signal.suggestion);
  if (signal.question) parts.push(signal.question);
  // If we only have a raw letter string, use that
  if (parts.length === 0 && signal.letter) return signal.letter;
  return `Dear Present Me.\n\n${parts.join('\n\n')}\n\nFuture You.`;
}

export async function generateTTS(apiKey, provider, signal, voiceStyle) {
  const text = letterToSpeechText(signal);
  if (provider === 'gemini') return generateGeminiTTS(apiKey, text, voiceStyle);
  if (provider === 'grok') return generateGrokTTS(apiKey, text);
  throw new Error('Unknown provider');
}

async function generateGeminiTTS(apiKey, text, voiceStyle) {
  const voiceName = VOICE_MAP[voiceStyle] || 'Aoede';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          }
        }
      })
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `TTS error ${res.status}`);
  }
  const data = await res.json();
  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!audioData) throw new Error('No audio data from Gemini TTS');
  // Convert base64 PCM to playable audio blob
  const blob = base64ToAudioBlob(audioData.data, audioData.mimeType);
  return URL.createObjectURL(blob);
}

async function generateGrokTTS(apiKey, text) {
  const res = await fetch('https://api.x.ai/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'grok-tts', input: text, voice: 'default' })
  });
  if (!res.ok) throw new Error(`Grok TTS error ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

function base64ToAudioBlob(base64, mimeType = 'audio/L16;rate=24000') {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  // If it's raw PCM, wrap it in a WAV
  if (mimeType.includes('L16') || mimeType.includes('pcm')) {
    const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || '24000');
    return pcmToWavBlob(bytes, sampleRate);
  }
  return new Blob([bytes], { type: mimeType });
}

function pcmToWavBlob(pcmData, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const dataLength = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLength, true);
  new Uint8Array(buffer, 44).set(pcmData);
  return new Blob([buffer], { type: 'audio/wav' });
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
export function validateApiKey(provider, key) {
  if (!key || key.trim().length < 10) return false;
  if (provider === 'gemini') return key.startsWith('AIza');
  if (provider === 'grok') return key.startsWith('xai-');
  return false;
}
