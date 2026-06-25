import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ActionKind } from '../game/types';

const actionLabels: Record<ActionKind, string> = {
  hold: '保留数字',
  reroll: '花 1 晶石重抽',
  guess: '猜测他人数字',
};

export function ActionPanel() {
  const { state, submitHumanAction } = useGameStore();
  const targets = useMemo(() => state.players.filter((player) => player.id !== 'human' && player.status !== 'eliminated'), [state.players]);
  const [kind, setKind] = useState<ActionKind>('hold');
  const [targetPlayerId, setTargetPlayerId] = useState(targets[0]?.id ?? '');
  const [guess, setGuess] = useState(5);
  const isActionPhase = state.phase === 'action';
  const targetName = targets.find((target) => target.id === targetPlayerId)?.name ?? '未选择';

  return (
    <section className="panel action-panel">
      <div className="panel-title">行动提交</div>
      {!isActionPhase && (
        <div className="phase-hint">
          当前阶段不是行动提交。请点击顶部「推进阶段」，进入「行动提交」后再确认行动。
        </div>
      )}
      {isActionPhase && (
        <div className="phase-hint active">
          正式行动只负责结算；数字情报请通过公共聊天或私聊协商。
        </div>
      )}

      <div className="action-grid">
        {(['hold', 'reroll', 'guess'] as ActionKind[]).map((item) => (
          <button disabled={!isActionPhase} className={kind === item ? 'selected' : ''} onClick={() => setKind(item)} key={item}>{actionLabels[item]}</button>
        ))}
      </div>

      {kind === 'guess' && (
        <select disabled={!isActionPhase} value={targetPlayerId} onChange={(event) => setTargetPlayerId(event.target.value)}>
          {targets.map((target) => <option value={target.id} key={target.id}>{target.name}</option>)}
        </select>
      )}
      {kind === 'guess' && (
        <input disabled={!isActionPhase} type="number" min={1} max={9} value={guess} onChange={(event) => setGuess(Number(event.target.value))} />
      )}

      <div className="submitted-preview">
        <strong>即将提交：</strong>
        <span>{actionLabels[kind]}</span>
        {kind === 'guess' && <span>目标：{targetName}</span>}
        {kind === 'guess' && <span>猜测数字：{guess}</span>}
      </div>

      <button
        className="primary"
        disabled={!isActionPhase || (kind === 'guess' && !targetPlayerId)}
        onClick={() => submitHumanAction(kind, targetPlayerId || undefined, guess)}
      >
        {isActionPhase ? '确认行动并结算' : '等待行动阶段'}
      </button>
    </section>
  );
}
