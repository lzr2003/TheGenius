import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceMood = 'silent' | 'neutral' | 'excited' | 'tense' | 'lowEnergy';
export type VoicePermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

export interface VoiceMoodSnapshot {
  mood: VoiceMood;
  emoji: string;
  label: string;
  description: string;
  energy: number;
  pitch: number;
  zcr: number;
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
    description: '音量和音高偏高',
  },
  tense: {
    emoji: '😠',
    label: '紧张',
    description: '语音冲击感偏强',
  },
  lowEnergy: {
    emoji: '😴',
    label: '低能量',
    description: '音量和音高偏低',
  },
};

const DEFAULT_SNAPSHOT: VoiceMoodSnapshot = {
  mood: 'silent',
  ...MOOD_META.silent,
  energy: 0,
  pitch: 0,
  zcr: 0,
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

function classifyMood(rms: number, pitch: number, zcr: number): VoiceMood {
  const energy = clamp01(rms / 0.12);

  if (rms < 0.012) return 'silent';
  if (energy > 0.48 && pitch > 185 && zcr < 0.16) return 'excited';
  if (energy > 0.42 && (zcr > 0.105 || pitch > 235)) return 'tense';
  if (energy < 0.22 && pitch > 0 && pitch < 155) return 'lowEnergy';

  return 'neutral';
}

function toSnapshot(mood: VoiceMood, rms: number, pitch: number, zcr: number): VoiceMoodSnapshot {
  return {
    mood,
    ...MOOD_META[mood],
    energy: clamp01(rms / 0.12),
    pitch,
    zcr,
  };
}

function getSmoothedMood(history: VoiceMood[]) {
  const scores = history.reduce<Record<VoiceMood, number>>(
    (acc, mood) => {
      acc[mood] += 1;
      return acc;
    },
    { silent: 0, neutral: 0, excited: 0, tense: 0, lowEnergy: 0 },
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
    const pitch = estimatePitch(samples, context.sampleRate, rms);
    const mood = classifyMood(rms, pitch, zcr);

    historyRef.current = [...historyRef.current.slice(-2), mood];
    const smoothedMood = getSmoothedMood(historyRef.current);

    setSnapshot(toSnapshot(smoothedMood, rms, pitch, zcr));
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
