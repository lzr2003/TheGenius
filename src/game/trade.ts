import type { GameState, Player, TradeOffer } from './types';
import { createLog } from './mock';
import { adjustRelationship, ensureRelationships } from './relations';

function clonePlayers(players: Player[]): Player[] {
  return players.map((player) => ({ ...player, knownInfo: { ...player.knownInfo } }));
}

function updateTradeStatus(trades: TradeOffer[], tradeId: string, status: TradeOffer['status']): TradeOffer[] {
  return trades.map((trade) => (trade.id === tradeId ? { ...trade, status } : trade));
}

function playerName(players: Player[], id: string): string {
  return players.find((player) => player.id === id)?.name ?? id;
}

export function acceptTradeSettlement(state: GameState, tradeId: string): GameState {
  const trade = state.tradeOffers.find((offer) => offer.id === tradeId);
  if (!trade || trade.status !== 'pending') return state;

  const players = clonePlayers(state.players);
  const from = players.find((player) => player.id === trade.fromPlayerId);
  const to = players.find((player) => player.id === trade.toPlayerId);
  if (!from || !to) return state;

  let relationships = ensureRelationships(state);

  if (from.crystals < trade.offeredCrystals || to.crystals < trade.requestedCrystals) {
    relationships = adjustRelationship(relationships, to.id, from.id, {
      trustDelta: -14,
      betrayalDelta: 10,
      note: '交易失败：对方晶石不足',
    });
    return {
      ...state,
      relationships,
      tradeOffers: updateTradeStatus(state.tradeOffers, tradeId, 'cancelled'),
      matchLog: [
        ...state.matchLog,
        createLog('TRADE_CANCELLED', `${playerName(players, from.id)} 与 ${playerName(players, to.id)} 的交易因晶石不足取消。`),
      ],
    };
  }

  from.crystals = from.crystals - trade.offeredCrystals + trade.requestedCrystals;
  to.crystals = to.crystals + trade.offeredCrystals - trade.requestedCrystals;

  if (trade.revealsOfferedSecret) {
    to.knownInfo[from.id] = from.secretNumber;
  }

  if (trade.requestsTargetSecret) {
    from.knownInfo[to.id] = to.secretNumber;
  }

  relationships = adjustRelationship(relationships, from.id, to.id, {
    trustDelta: 8,
    allianceDelta: 5,
    note: '交易履约成功',
  });
  relationships = adjustRelationship(relationships, to.id, from.id, {
    trustDelta: 10,
    allianceDelta: 5,
    note: '交易履约成功',
  });

  return {
    ...state,
    players,
    relationships,
    tradeOffers: updateTradeStatus(state.tradeOffers, tradeId, 'accepted'),
    matchLog: [
      ...state.matchLog,
      createLog('TRADE_ACCEPTED', `${playerName(players, to.id)} 接受了 ${playerName(players, from.id)} 的交易，晶石和情报已结算。`),
      createLog('RELATION_CHANGED', `${playerName(players, from.id)} 与 ${playerName(players, to.id)} 的信任和联盟值上升。`),
    ],
  };
}

export function rejectTradeSettlement(state: GameState, tradeId: string): GameState {
  const trade = state.tradeOffers.find((offer) => offer.id === tradeId);
  if (!trade || trade.status !== 'pending') return state;

  const fromName = playerName(state.players, trade.fromPlayerId);
  const toName = playerName(state.players, trade.toPlayerId);
  let relationships = ensureRelationships(state);

  relationships = adjustRelationship(relationships, trade.fromPlayerId, trade.toPlayerId, {
    trustDelta: -6,
    betrayalDelta: 2,
    note: '交易请求被拒绝',
  });
  relationships = adjustRelationship(relationships, trade.toPlayerId, trade.fromPlayerId, {
    trustDelta: -2,
    note: '拒绝交易请求',
  });

  return {
    ...state,
    relationships,
    tradeOffers: updateTradeStatus(state.tradeOffers, tradeId, 'rejected'),
    matchLog: [
      ...state.matchLog,
      createLog('TRADE_REJECTED', `${toName} 拒绝了 ${fromName} 的交易。`),
      createLog('RELATION_CHANGED', `${fromName} 对 ${toName} 的信任下降。`),
    ],
  };
}
