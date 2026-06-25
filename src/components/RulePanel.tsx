export function RulePanel() {
  return (
    <section className="panel rule-panel">
      <div className="panel-title">游戏规则：秘密数字市场</div>
      <p>每名玩家拥有 1 张 1-9 的秘密数字卡和初始 5 枚晶石。</p>
      <p>每轮结算时，系统会计算每名存活玩家的资产评分。</p>
      <div className="rule-formula-card">
        <span>资产评分公式</span>
        <strong>晶石 + 秘密数字</strong>
      </div>
      <ul>
        <li>最高资产评分玩家获得安全权。</li>
        <li>最低资产评分玩家进入危险区。</li>
        <li>花费 1 晶石可以重抽秘密数字。</li>
        <li>猜中他人数字获得 3 晶石，猜错失去 1 晶石。</li>
        <li>可以接受交易来交换晶石和数字情报。</li>
        <li>安全权持有者可以额外赠送安全权给一名 active 玩家。</li>
      </ul>
    </section>
  );
}
