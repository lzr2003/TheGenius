import { useGameStore } from '../store/gameStore';

export function PrivateInfoPanel() {
  const state = useGameStore((store) => store.state);
  const human = state.players.find((player) => player.id === 'human');
  const crystals = human?.crystals ?? 0;
  const secretNumber = human?.secretNumber ?? 0;
  const roundPoints = state.roundPoints?.human ?? 0;

  return (
    <section className="panel private-info-panel">
      <div>
        <span>你的秘密数字</span>
        <strong>{secretNumber}</strong>
      </div>
      <div>
        <span>晶石</span>
        <strong>{crystals}</strong>
      </div>
      <div>
        <span>本轮积分</span>
        <strong>{roundPoints}</strong>
      </div>
    </section>
  );
}
