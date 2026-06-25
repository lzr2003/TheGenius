import { useMemo, useState } from 'react';
import { eligibleSafetyRecipients } from '../game/safety';
import { useGameStore } from '../store/gameStore';

export function SafetyPanel() {
  const { state, grantSafety } = useGameStore();
  const token = state.safetyToken;
  const owner = state.players.find((player) => player.id === token?.ownerPlayerId);
  const recipient = state.players.find((player) => player.id === token?.recipientPlayerId);
  const candidates = useMemo(() => eligibleSafetyRecipients(state), [state]);
  const [selectedId, setSelectedId] = useState(candidates[0]?.id ?? '');

  if (!token || !owner) {
    return (
      <section className="panel safety-panel">
        <div className="panel-title">安全权阶段</div>
        <p className="muted">本轮没有可赠送的安全权。</p>
      </section>
    );
  }

  const canHumanGrant = owner.isHuman && !recipient && candidates.length > 0;

  return (
    <section className="panel safety-panel">
      <div className="panel-title">安全权赠送</div>
      <div className="safety-token-card">
        <span>安全权持有者</span>
        <strong>{owner.name}</strong>
        <p>主游戏胜者已经安全，并可额外赠送一个安全权给仍处于 active 状态的玩家。</p>
      </div>

      {recipient && <p className="success-text">已赠送给：{recipient.name}</p>}
      {!recipient && !owner.isHuman && <p className="muted">AI 将在推进阶段时根据当前信任关系自动赠送。</p>}
      {!recipient && owner.isHuman && candidates.length === 0 && <p className="muted">没有可赠送对象。</p>}

      {canHumanGrant && (
        <div className="grant-row">
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {candidates.map((candidate) => (
              <option value={candidate.id} key={candidate.id}>{candidate.name}</option>
            ))}
          </select>
          <button className="primary" onClick={() => grantSafety(selectedId || candidates[0]?.id)}>赠送安全权</button>
        </div>
      )}
    </section>
  );
}
