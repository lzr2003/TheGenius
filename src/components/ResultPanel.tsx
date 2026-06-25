import { useGameStore } from '../store/gameStore';

export function ResultPanel() {
  const { state } = useGameStore();
  const latest = state.roundResults[state.roundResults.length - 1];
  const nameOf = (id: string) => state.players.find((player) => player.id === id)?.name ?? id;

  return (
    <section className="panel result-panel">
      <div className="panel-title">比赛日志与结算</div>
      {latest && (
        <div className="settlement-card">
          <p>{latest.summary}</p>
          <div>安全权：{latest.safetyPlayerId ? nameOf(latest.safetyPlayerId) : '-'}</div>
          <div>危险区：{latest.dangerPlayerId ? nameOf(latest.dangerPlayerId) : '-'}</div>
        </div>
      )}
      <div className="log-list">
        {state.matchLog.slice(-8).reverse().map((entry) => (
          <p key={entry.id}><span>{entry.type}</span>{entry.message}</p>
        ))}
      </div>
    </section>
  );
}
