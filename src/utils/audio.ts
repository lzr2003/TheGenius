export type SfxName =
  | 'click'
  | 'phase'
  | 'submit'
  | 'settlement'
  | 'tradeAccept'
  | 'tradeReject'
  | 'safety'
  | 'death'
  | 'eliminate'
  | 'error';

type AudioContextConstructor = new () => AudioContext;

type ToneStep = {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

const soundMap: Record<SfxName, ToneStep[]> = {
  click: [{ frequency: 520, duration: 0.045, type: 'triangle', gain: 0.035 }],
  phase: [
    { frequency: 330, duration: 0.06, type: 'sine', gain: 0.045 },
    { frequency: 494, duration: 0.07, type: 'sine', gain: 0.04 },
    { frequency: 660, duration: 0.08, type: 'triangle', gain: 0.035 },
  ],
  submit: [
    { frequency: 220, duration: 0.055, type: 'triangle', gain: 0.04 },
    { frequency: 440, duration: 0.09, type: 'triangle', gain: 0.04 },
  ],
  settlement: [
    { frequency: 392, duration: 0.07, type: 'sine', gain: 0.04 },
    { frequency: 523, duration: 0.07, type: 'sine', gain: 0.04 },
    { frequency: 784, duration: 0.12, type: 'triangle', gain: 0.035 },
  ],
  tradeAccept: [
    { frequency: 392, duration: 0.06, type: 'triangle', gain: 0.04 },
    { frequency: 587, duration: 0.1, type: 'triangle', gain: 0.04 },
  ],
  tradeReject: [
    { frequency: 220, duration: 0.08, type: 'sawtooth', gain: 0.025 },
    { frequency: 165, duration: 0.11, type: 'sawtooth', gain: 0.025 },
  ],
  safety: [
    { frequency: 523, duration: 0.07, type: 'sine', gain: 0.045 },
    { frequency: 659, duration: 0.08, type: 'sine', gain: 0.04 },
    { frequency: 988, duration: 0.14, type: 'triangle', gain: 0.035 },
  ],
  death: [
    { frequency: 130, duration: 0.07, type: 'sawtooth', gain: 0.03 },
    { frequency: 196, duration: 0.07, type: 'sawtooth', gain: 0.03 },
    { frequency: 146, duration: 0.12, type: 'triangle', gain: 0.03 },
  ],
  eliminate: [
    { frequency: 247, duration: 0.08, type: 'sawtooth', gain: 0.032 },
    { frequency: 196, duration: 0.08, type: 'sawtooth', gain: 0.032 },
    { frequency: 123, duration: 0.16, type: 'triangle', gain: 0.03 },
  ],
  error: [
    { frequency: 180, duration: 0.07, type: 'square', gain: 0.025 },
    { frequency: 150, duration: 0.08, type: 'square', gain: 0.022 },
  ],
};

let audioContext: AudioContext | undefined;
let masterGain: GainNode | undefined;
let enabled = true;

function getAudioContext(): AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!AudioCtor) return undefined;

  if (!audioContext) {
    audioContext = new AudioCtor();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.65;
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  return audioContext;
}

function playTone(context: AudioContext, step: ToneStep, startAt: number): number {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = step.type ?? 'sine';
  oscillator.frequency.setValueAtTime(step.frequency, startAt);

  const volume = step.gain ?? 0.035;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + step.duration);

  oscillator.connect(gain);
  gain.connect(masterGain ?? context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + step.duration + 0.02);
  return startAt + step.duration;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function playSfx(name: SfxName): void {
  if (!enabled) return;
  const context = getAudioContext();
  if (!context) return;

  const steps = soundMap[name];
  let cursor = context.currentTime;
  for (const step of steps) {
    cursor = playTone(context, step, cursor + 0.012);
  }
}
