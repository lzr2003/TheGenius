import { useVoiceMood } from '../hooks/useVoiceMood';

function formatPitch(pitch: number) {
  return pitch > 0 ? `${Math.round(pitch)}Hz` : '—';
}

export function VoiceEmotionPanel() {
  const { snapshot, permissionState, isListening, error, start, stop } = useVoiceMood();

  const statusText = permissionState === 'requesting' ? '请求权限中' : isListening ? '监听中' : '未开启';
  const buttonText = isListening ? '停止' : '开启';
  const canStart = permissionState !== 'requesting' && permissionState !== 'unsupported';

  return (
    <div className={`voice-emotion-panel ${isListening ? 'listening' : ''}`}>
      <div className="voice-emotion-face" aria-hidden="true">{snapshot.emoji}</div>
      <div className="voice-emotion-main">
        <div className="voice-emotion-title-row">
          <span className="voice-emotion-kicker">语音表情</span>
          <strong>{snapshot.label}</strong>
          <em>{statusText}</em>
        </div>
        <p>{error ?? snapshot.description}</p>
        <div className="voice-emotion-metrics" aria-label="语音状态指标">
          <span>能量 {Math.round(snapshot.energy * 100)}%</span>
          <span>音高 {formatPitch(snapshot.pitch)}</span>
          <span>ZCR {snapshot.zcr.toFixed(3)}</span>
        </div>
        <div className="voice-meter" aria-hidden="true">
          <div className="voice-meter-fill" style={{ width: `${Math.round(snapshot.energy * 100)}%` }} />
        </div>
      </div>
      <button className="voice-emotion-button" type="button" onClick={isListening ? stop : start} disabled={!canStart}>
        {buttonText}
      </button>
    </div>
  );
}
