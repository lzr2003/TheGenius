import { useGameStore } from '../store/gameStore';

export function DeathMatchPanel() {
  const { state, advancePhase } = useGameStore();
  const match = state.deathMatch;
  const nameOf = (id: string) => state.players.find((player) => player.id === id)?.name ?? id;

  if (!match) return <section className="panel"><div className="panel-title">死亡竞赛尚未开始</div></section>;

  return (
    <section className="panel death-panel">
      <div className="panel-title">死亡竞赛：心理猜数</div>
      <div className="duel-board">
        <div><span>{nameOf(match.challengerId)}</span><strong>{match.challengerScore}</strong></div>
        <div className="versus">VS</div>
        <div><span>{nameOf(match.opponentId)}</span><strong>{match.opponentScore}</strong></div>
      </div>
      <button className="primary" onClick={advancePhase}>{match.winnerId ? '进入淘汰结算' : '进行下一小局'}</button>
      <div className="death-history">
        {match.history.map((round) => (
          <p key={round.round}>第 {round.round} 局：{round.challengerPick} - {round.opponentPick}，{round.note}</p>
        ))}
      </div>
    </section>
  );
}
