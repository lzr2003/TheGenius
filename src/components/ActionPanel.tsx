import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ActionKind } from '../game/types';

export function ActionPanel() {
  const { state, submitHumanAction } = useGameStore();
  const targets = useMemo(() => state.players.filter((player) => player.id !== 'human' && player.status !== 'eliminated'), [state.players]);
  const [kind, setKind] = useState<ActionKind>('hold');
  const [targetPlayerId, setTargetPlayerId] = useState(targets[0]?.id);
  const [guess, setGuess] = useState(5);

  return (
    <section className="panel action-panel">
      <div className="panel-title">行动提交</div>
      <div className="action-grid">
        {(['hold', 'reroll', 'swap', 'guess'] as ActionKind[]).map((item) => (
          <button className={kind === item ? 'selected' : ''} onClick={() => setKind(item)} key={item}>{item}</button>
        ))}
      </div>
      {(kind === 'swap' || kind === 'guess') && (
        <select value={targetPlayerId} onChange={(event) => setTargetPlayerId(event.target.value)}>
          {targets.map((target) => <option value={target.id} key={target.id}>{target.name}</option>)}
        </select>
      )}
      {kind === 'guess' && (
        <input type="number" min={1} max={9} value={guess} onChange={(event) => setGuess(Number(event.target.value))} />
      )}
      <button className="primary" onClick={() => submitHumanAction(kind, targetPlayerId, guess)}>确认行动</button>
    </section>
  );
}
