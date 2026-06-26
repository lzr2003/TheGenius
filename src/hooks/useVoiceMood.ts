import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceMood = 'silent' | 'neutral' | 'excited' | 'angry' | 'tense' | 'confused' | 'sinister';
export type VoicePermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

export interface VoiceMoodSnapshot {
  mood: VoiceMood;
  emoji: string;
  label: string;
  description: string;
  energy: number;
  pitch: number;
  zcr: number;
  roughness: number;
}

const MOOD_META: Record<VoiceMood, Pick<VoiceMoodSnapshot, 'emoji' | 'label' | 'description'>> = {
  silent: {
    emoji: '🤫',
    label: '静音',
    description: '未检测到明显语音',
  },
  neutral: {
    emoji: '😐',
    label: '中性',
    description: '语音状态平稳',
  },
  excited: {
    emoji: '🤩',
    label: '兴奋',
    description: '音量和音高偏高，表现为积极高能量',
  },
  angry: {
    emoji: '😡',
    label: '生气',
    description: '音量较高且冲击感强，表现为强烈负向能量',
  },
  tense: {
    emoji: '😰',
    label: '紧张',
    description: '语音尖锐或抖动感偏强，表现为不稳定高压状态',
  },
  confused: {
    emoji: '🤔',
    label: '困惑',
    description: '能量中等且音高偏飘，表现为犹豫或疑问感',
  },
  sinister: {
    emoji: '😈',
    label: '阴险',
    description: '音量偏低且音高偏低，表现为压低声音的诡秘感',
  },
};

const DEFAULT_SNAPSHOT: VoiceMoodSnapshot = {
  mood: 'silent',
  ...MOOD_META.silent,
  energy: 0,
  pitch: 0,
  zcr: 0,
  roughness: 0,
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function computeRms(samples: Float32Array) {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

function computeZeroCrossingRate(samples: Float32Array) {
  let crossings = 0;
  for (let i = 1; i < samples.length; i += 1) {
    if ((samples[i - 1] >= 0 && samples[i] < 0) || (samples[i - 1] < 0 && samples[i] >= 0)) {
      crossings += 1;
    }
  }
  return crossings / samples.length;
}

function computeRoughness(samples: Float32Array) {
  let deltaSum = 0;
  for (let i = 1; i < samples.length; i += 1) {
    deltaSum += Math.abs(samples[i] - samples[i - 1]);
  }

  return clamp01(deltaSum / samples.length / 0.08);
}

function estimatePitch(samples: Float32Array, sampleRate: number, rms: number) {
  if (rms < 0.012) return 0;

  const minFrequency = 75;
  const maxFrequency = 420;
  const minLag = Math.floor(sampleRate / maxFrequency);
  const maxLag = Math.floor(sampleRate / minFrequency);
  const usableLength = Math.min(samples.length, 4096);

  let bestLag = 0;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let i = 0; i < usableLength - lag; i += 1) {
      correlation += samples[i] * samples[i + lag];
    }
    correlation /= usableLength - lag;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag === 0 || bestCorrelation < 0.0025) return 0;
  return sampleRate / bestLag;
}

function classifyMood(rms: number, pitch: number, zcr: number, roughness: number): VoiceMood {
  const energy = clamp01(rms / 0.12);
  const hasPitch = pitch > 0;

  if (rms < 0.012) return 'silent';

  // 高能量、强冲击、偏嘈杂，优先判为生气，避免都落入“兴奋”。
  if (energy > 0.58 && (roughness > 0.34 || zcr > 0.12)) return 'angry';

  // 高能量但相对明亮稳定，更像兴奋。
  if (energy > 0.46 && hasPitch && pitch > 175 && zcr < 0.16) return 'excited';

  // 中高能量、尖锐或不稳定，但未到生气强度，作为紧张。
  if (energy > 0.36 && (zcr > 0.11 || roughness > 0.28 || pitch > 245)) return 'tense';

  // 低声、低音高，适合游戏里的“阴险/诡秘”表情。
  if (energy < 0.34 && (!hasPitch || pitch < 145) && zcr < 0.09) return 'sinister';

  // 中等能量、音高偏高或略不稳定，作为困惑/疑问感。
  if (energy >= 0.22 && energy <= 0.48 && (pitch > 165 || roughness > 0.18 || zcr > 0.075)) return 'confused';

  return 'neutral';
}

function toSnapshot(mood: VoiceMood, rms: number, pitch: number, zcr: number, roughness: number): VoiceMoodSnapshot {
  return {
    mood,
    ...MOOD_META[mood],
    energy: clamp01(rms / 0.12),
    pitch,
    zcr,
    roughness,
  };
}

function getSmoothedMood(history: VoiceMood[]) {
  const scores = history.reduce<Record<VoiceMood, number>>(
    (acc, mood) => {
      acc[mood] += 1;
      return acc;
    },
    { silent: 0, neutral: 0, excited: 0, angry: 0, tense: 0, confused: 0, sinister: 0 },
  );

  return history.reduce<VoiceMood>((winner, mood) => (scores[mood] >= scores[winner] ? mood : winner), history[0] ?? 'silent');
}

export function useVoiceMood(updateMs = 900) {
  const [snapshot, setSnapshot] = useState<VoiceMoodSnapshot>(DEFAULT_SNAPSHOT);
  const [permissionState, setPermissionState] = useState<VoicePermissionState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const historyRef = useRef<VoiceMood[]>([]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    historyRef.current = [];

    setIsListening(false);
    setSnapshot(DEFAULT_SNAPSHOT);
  }, []);

  const analyzeOnce = useCallback(() => {
    const analyser = analyserRef.current;
    const context = audioContextRef.current;
    if (!analyser || !context) return;

    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);

    const rms = computeRms(samples);
    const zcr = computeZeroCrossingRate(samples);
    const roughness = computeRoughness(samples);
    const pitch = estimatePitch(samples, context.sampleRate, rms);
    const mood = classifyMood(rms, pitch, zcr, roughness);

    historyRef.current = [...historyRef.current.slice(-2), mood];
    const smoothedMood = getSmoothedMood(historyRef.current);

    setSnapshot(toSnapshot(smoothedMood, rms, pitch, zcr, roughness));
  }, []);

  const start = useCallback(async () => {
    setError(null);

    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor || !navigator.mediaDevices?.getUserMedia) {
      setPermissionState('unsupported');
      setError('当前环境不支持麦克风采集');
      return;
    }

    try {
      setPermissionState('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      stop();

      const audioContext = new AudioContextCtor();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.72;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      streamRef.current = stream;
      setPermissionState('granted');
      setIsListening(true);

      analyzeOnce();
      timerRef.current = window.setInterval(analyzeOnce, updateMs);
    } catch (caughtError) {
      setPermissionState('denied');
      setIsListening(false);
      setError(caughtError instanceof Error ? caughtError.message : '麦克风权限被拒绝');
    }
  }, [analyzeOnce, stop, updateMs]);

  useEffect(() => stop, [stop]);

  return {
    snapshot,
    permissionState,
    isListening,
    error,
    start,
    stop,
  };
}
