import { useGameStore } from '../store/gameStore';

export function TradePanel() {
  const { state, acceptTrade, rejectTrade } = useGameStore();
  const trades = state.tradeOffers.slice(-5).reverse();
  const nameOf = (id: string) => state.players.find((player) => player.id === id)?.name ?? id;

  return (
    <section className="panel trade-panel">
      <div className="panel-title">晶石交易</div>
      {trades.length === 0 && <p className="muted">当前没有交易请求。多人联机中交易应由玩家协商；单机兼容时 AI 会主动提出交易。</p>}
      {trades.map((trade) => (
        <article className="trade-card" key={trade.id}>
          <div>{nameOf(trade.fromPlayerId)} → {nameOf(trade.toPlayerId)}</div>
          <p>提供 {trade.offeredCrystals} 晶石，索要 {trade.requestedCrystals} 晶石</p>
          <p>{trade.offeredInfo ?? '无公开情报'} / {trade.requestedInfo ?? '无请求情报'}</p>
          <p className="muted">晶石交易是资源交换；数字情报主要通过私聊发送，可能真实也可能虚假。</p>
          <strong>{trade.status}</strong>
          {trade.status === 'pending' && trade.toPlayerId === 'human' && (
            <div className="inline-actions">
              <button onClick={() => acceptTrade(trade.id)}>接受</button>
              <button onClick={() => rejectTrade(trade.id)}>拒绝</button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
