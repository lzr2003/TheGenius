export function RulePanel() {
  return (
    <section className="panel rule-panel">
      <div className="panel-title">游戏规则：秘密数字市场</div>
      <p>每名玩家拥有 1 张 1-9 的秘密数字卡和初始 5 枚晶石。</p>
      <p>秘密数字不是直接分数，而是交易、猜测和欺骗的核心信息。</p>
      <p>每轮玩家同时提交行动，行动结果产生本轮积分。</p>
      <div className="rule-formula-card">
        <span>主竞赛判定</span>
        <strong>比较本轮积分</strong>
      </div>
      <ul>
        <li>保留：本轮积分 +1。</li>
        <li>重抽：消耗 1 晶石，重新获得秘密数字。</li>
        <li>交换：双方互相选择交换时成功，双方本轮积分 +2。</li>
        <li>猜测：猜中他人数字，本轮积分 +5，并获得 1 晶石。</li>
        <li>猜错：本轮积分 -2，并失去 1 晶石。</li>
        <li>本轮积分最高者获得安全权，最低者进入危险区。</li>
      </ul>
    </section>
  );
}
