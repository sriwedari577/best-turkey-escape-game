// All sound is synthesized with WebAudio: no audio files, no network. Short
// oscillator-and-noise bursts for the gobble, the corn pickup, the knife hit
// and the escape fanfare, plus a tiny plucked autumn tune that steps along
// while a run is in play. Nothing here plays until the first key or click,
// so browsers never block it, and M toggles mute.

const TUNE = [
  [392, 0.22], [330, 0.22], [262, 0.34], [330, 0.22],
  [392, 0.22], [494, 0.34], [440, 0.22], [392, 0.44],
  [330, 0.22], [262, 0.22], [294, 0.34], [330, 0.44],
];

export function createAudio() {
  let context = null;
  let muted = false;
  let tuneStep = 0;
  let tuneTimer = 0;

  function ensureAudio() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return true;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
    } catch {
      return false;
    }
    return true;
  }

  function tone(frequency, seconds, type, volume, slideTo) {
    if (!context || muted) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + seconds + 0.02);
  }

  function noiseBurst(seconds, volume) {
    if (!context || muted) return;
    const now = context.currentTime;
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    source.buffer = buffer;
    source.connect(gain).connect(context.destination);
    source.start(now);
  }

  /** The turkey's gobble: three quick descending clucks. */
  function gobble() {
    tone(520, 0.09, 'square', 0.10, 300);
    setTimeout(() => tone(470, 0.09, 'square', 0.10, 280), 90);
    setTimeout(() => tone(420, 0.13, 'square', 0.12, 240), 180);
  }

  function pickupCorn() {
    tone(660, 0.08, 'sine', 0.12, 880);
    setTimeout(() => tone(990, 0.12, 'sine', 0.12, 1320), 70);
  }

  function jumpSound() {
    tone(300, 0.16, 'sine', 0.10, 620);
  }

  function hitSound() {
    noiseBurst(0.18, 0.22);
    tone(180, 0.22, 'sawtooth', 0.14, 70);
  }

  function spottedSound() {
    tone(880, 0.10, 'square', 0.10, 880);
    setTimeout(() => tone(1175, 0.16, 'square', 0.10, 1175), 110);
  }

  function hideSound() {
    noiseBurst(0.12, 0.08);
    tone(240, 0.12, 'sine', 0.08, 180);
  }

  function escapeFanfare() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((note, index) => {
      setTimeout(() => tone(note, 0.24, 'triangle', 0.14), index * 130);
    });
  }

  function caughtSound() {
    const notes = [392, 349, 311, 262];
    notes.forEach((note, index) => {
      setTimeout(() => tone(note, 0.26, 'sawtooth', 0.10), index * 150);
    });
  }

  /** Advance the background tune one beat when a run is playing. */
  function tickTune(dt, playing) {
    if (!context || muted || !playing) {
      tuneTimer = 0;
      return;
    }
    tuneTimer -= dt;
    if (tuneTimer > 0) return;
    const [frequency, seconds] = TUNE[tuneStep % TUNE.length];
    tuneStep += 1;
    tuneTimer = seconds;
    tone(frequency, seconds * 0.9, 'triangle', 0.05);
  }

  function toggleMute() {
    muted = !muted;
    return muted;
  }

  return {
    ensureAudio,
    gobble,
    pickupCorn,
    jumpSound,
    hitSound,
    spottedSound,
    hideSound,
    escapeFanfare,
    caughtSound,
    tickTune,
    toggleMute,
    isMuted() { return muted; },
  };
}
