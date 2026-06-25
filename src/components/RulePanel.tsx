export function RulePanel() {
  return (
    <section className="panel rule-panel">
      <div className="panel-title">游戏规则：秘密数字市场</div>
      <p>本游戏默认面向多人联机；AI 仅用于单机兼容和测试。</p>
      <p>每名玩家拥有 1 张 1-9 的秘密数字卡和初始 5 枚晶石。</p>
      <p>秘密数字不会通过正式行动交换，只能通过公共发言或私聊声称、透露或欺骗。</p>
      <div className="rule-formula-card">
        <span>主竞赛判定</span>
        <strong>比较本轮积分</strong>
      </div>
      <ul>
        <li>保留：本轮积分 +1。</li>
        <li>重抽：消耗 1 晶石，重新获得秘密数字。</li>
        <li>猜测：猜中他人数字，本轮积分 +5，并获得 1 晶石。</li>
        <li>猜错：本轮积分 -2，并失去 1 晶石。</li>
        <li>数字情报通过私聊交换，内容可能是真话也可能是谎话。</li>
        <li>本轮积分最高者获得安全权，最低者进入危险区。</li>
      </ul>
    </section>
  );
}
