import { useGameStore } from '../store/gameStore';

export function PrivateInfoPanel() {
  const human = useGameStore((store) => store.state.players.find((player) => player.id === 'human'));
  const crystals = human?.crystals ?? 0;
  const secretNumber = human?.secretNumber ?? 0;
  const assetScore = crystals + secretNumber;

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
        <span>资产评分</span>
        <strong>{assetScore}</strong>
      </div>
      <p>资产评分 = 晶石 + 秘密数字。本轮最高获得安全权，最低进入危险区。</p>
    </section>
  );
}
