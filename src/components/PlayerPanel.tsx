import { useGameStore } from '../store/gameStore';

const personalityLabel: Record<string, string> = {
  rational: '理性型',
  deceptive: '欺骗型',
  cooperative: '合作型',
  risky: '冒险型',
  conservative: '保守型',
};

export function PlayerPanel() {
  const players = useGameStore((store) => store.state.players);

  return (
    <aside className="panel player-panel">
      <div className="panel-title">玩家席位</div>
      {players.map((player) => (
        <article className={`player-card ${player.status}`} key={player.id}>
          <div className="avatar">{player.avatar}</div>
          <div className="player-main">
            <div className="player-name">{player.name}</div>
            <div className="player-meta">{player.isHuman ? '人类玩家' : personalityLabel[player.personality ?? 'rational']}</div>
          </div>
          <div className="player-score">
            <strong>{player.crystals}</strong>
            <span>晶石</span>
          </div>
        </article>
      ))}
    </aside>
  );
}
