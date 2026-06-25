import type { ActionSubmission, GamePhase, GameState, Player } from './types';
import { createAiChat, createAiTrade, decideAiAction } from './ai';
import { createDeathMatch, playDeathMatchRound } from './deathmatch';
import { createLog } from './mock';
import { settleSecretNumberMarket } from './rules';
import { autoGrantSafetyToken } from './safety';

const phaseOrder: GamePhase[] = [
  'rule',
  'discussion',
  'trade',
  'action',
  'settlement',
  'safety',
  'deathmatch_select',
  'deathmatch',
  'elimination',
];

function activePlayers(players: Player[]): Player[] {
  return players.filter((player) => player.status !== 'eliminated');
}

function fillAiActions(state: GameState): ActionSubmission[] {
  const existing = new Set(state.actionSubmissions.map((action) => action.playerId));
  const aiActions = state.players
    .filter((player) => !player.isHuman && player.status !== 'eliminated' && !existing.has(player.id))
    .map((player) => decideAiAction(state, player));
  return [...state.actionSubmissions, ...aiActions];
}

export function advanceGamePhase(state: GameState): GameState {
  if (state.phase === 'finished') return state;

  if (activePlayers(state.players).length <= 1) {
    return { ...state, phase: 'finished', matchLog: [...state.matchLog, createLog('GAME_FINISHED', '比赛结束，最后存活玩家获胜。')] };
  }

  if (state.phase === 'discussion') {
    const aiMessages = state.players.filter((player) => !player.isHuman && player.status !== 'eliminated').slice(0, 3).map((player) => createAiChat(state, player));
    return { ...state, phase: 'trade', chatMessages: [...state.chatMessages, ...aiMessages], matchLog: [...state.matchLog, createLog('PHASE_CHANGED', '进入秘密交易阶段。')] };
  }

  if (state.phase === 'trade') {
    const aiTrades = state.players.map((player) => createAiTrade(state, player)).filter((offer): offer is NonNullable<typeof offer> => Boolean(offer));
    return { ...state, phase: 'action', tradeOffers: [...state.tradeOffers, ...aiTrades], matchLog: [...state.matchLog, createLog('PHASE_CHANGED', '进入行动提交阶段。')] };
  }

  if (state.phase === 'action') {
    return { ...state, phase: 'settlement', actionSubmissions: fillAiActions(state), matchLog: [...state.matchLog, createLog('PHASE_CHANGED', '所有 AI 已提交行动，进入结算。')] };
  }

  if (state.phase === 'settlement') {
    const settled = settleSecretNumberMarket(state);
    return {
      ...state,
      phase: 'safety',
      players: settled.players,
      safetyToken: settled.result.safetyPlayerId ? { ownerPlayerId: settled.result.safetyPlayerId, grantedAtRound: state.round } : undefined,
      roundResults: [...state.roundResults, settled.result],
      matchLog: [...state.matchLog, createLog('ROUND_SETTLED', settled.result.summary)],
    };
  }

  if (state.phase === 'safety') {
    const afterAutoGrant = autoGrantSafetyToken(state);
    return {
      ...afterAutoGrant,
      phase: 'deathmatch_select',
      matchLog: [...afterAutoGrant.matchLog, createLog('PHASE_CHANGED', '安全权阶段结束，进入死亡竞赛选择。')],
    };
  }

  if (state.phase === 'deathmatch_select') {
    const deathMatch = createDeathMatch(state.players);
    return { ...state, phase: 'deathmatch', deathMatch, matchLog: [...state.matchLog, createLog('DEATHMATCH_STARTED', '死亡竞赛开始：心理猜数。')] };
  }

  if (state.phase === 'deathmatch') {
    const deathMatch = state.deathMatch ? playDeathMatchRound(state.deathMatch) : undefined;
    return { ...state, phase: deathMatch?.winnerId ? 'elimination' : 'deathmatch', deathMatch, matchLog: [...state.matchLog, createLog('DEATHMATCH_ROUND_RESULT', '死亡竞赛完成一小局。')] };
  }

  if (state.phase === 'elimination') {
    const loserId = state.deathMatch?.loserId;
    const players = state.players.map((player) => player.id === loserId ? { ...player, status: 'eliminated' as const, crystals: 0 } : { ...player, status: player.status === 'eliminated' ? 'eliminated' as const : 'active' as const });
    return { ...state, round: state.round + 1, phase: 'rule', players, safetyToken: undefined, actionSubmissions: [], tradeOffers: [], deathMatch: undefined, matchLog: [...state.matchLog, createLog('PLAYER_ELIMINATED', '死亡竞赛失败者已淘汰，进入下一轮。')] };
  }

  const index = phaseOrder.indexOf(state.phase);
  const nextPhase = phaseOrder[index + 1] ?? 'rule';
  return { ...state, phase: nextPhase, matchLog: [...state.matchLog, createLog('PHASE_CHANGED', `进入阶段：${nextPhase}`)] };
}
