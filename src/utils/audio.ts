// Web Audio API helper for soothing pentatonic tones on hover/tap
let audioCtx: AudioContext | null = null;

// Soothing C-major pentatonic scale frequencies (C4 to A5)
const PENTATONIC_SCALE = [
  261.63, // C4 (Rating 1)
  293.66, // D4 (Rating 2)
  329.63, // E4 (Rating 3)
  392.00, // G4 (Rating 4)
  440.00, // A4 (Rating 5)
  523.25, // C5 (Rating 6)
  587.33, // D5 (Rating 7)
  659.25, // E5 (Rating 8)
  783.99, // G5 (Rating 9)
  880.00  // A5 (Rating 10)
];

export function playPentatonicTone(rating: number | null) {
  if (rating === null || rating < 1) return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const index = Math.min(9, Math.max(0, Math.round(rating) - 1));
    const freq = PENTATONIC_SCALE[index];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Use sine wave for ultra-soft, bell-like soothing acoustic sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Soft attack & exponential decay envelope
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.02); // very soft volume
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35); // gentle release

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Ignore audio context autoplay restrictions gracefully
  }
}
