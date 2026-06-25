import { useGameStore } from '../store/gameStore';

export function RulePanel() {
  const human = useGameStore((store) => store.state.players.find((player) => player.id === 'human'));

  return (
    <section className="panel rule-panel">
      <div className="panel-title">主游戏：秘密数字市场</div>
      <div className="rule-grid">
        <div>
          <span>你的秘密数字</span>
          <strong>{human?.secretNumber}</strong>
        </div>
        <div>
          <span>你的资产评分</span>
          <strong>{(human?.crystals ?? 0) + (human?.secretNumber ?? 0)}</strong>
        </div>
      </div>
      <p>每名玩家拥有 1 张 1-9 的秘密数字卡和 5 枚晶石。资产评分 = 晶石 + 秘密数字。最高者获得安全权，最低者进入危险区。</p>
      <ul>
        <li>花费 1 晶石可以重抽秘密数字。</li>
        <li>猜中他人数字获得 3 晶石，猜错失去 1 晶石。</li>
        <li>可与其他玩家交换数字卡，交易信息或晶石。</li>
      </ul>
    </section>
  );
}
