import type { ActionSubmission, ChatMessage, GameState, Player, TradeOffer } from './types';
import { id, randomNumber } from './mock';
import { ensureRelationships, mostTrustedCandidate, trustOf } from './relations';

function activeTargets(state: GameState, self: Player): Player[] {
  return state.players.filter((player) => player.status !== 'eliminated' && player.id !== self.id);
}

function knownSecret(player: Player, target: Player | undefined): number | undefined {
  if (!target) return undefined;
  return player.knownInfo[target.id];
}

function knownTargets(player: Player, targets: Player[]): Player[] {
  return targets.filter((target) => typeof player.knownInfo[target.id] === 'number');
}

export function decideAiAction(state: GameState, player: Player): ActionSubmission {
  const targets = activeTargets(state, player);
  const relationships = ensureRelationships(state);
  const trustedTarget = mostTrustedCandidate(relationships, player.id, targets);
  const informedTargets = knownTargets(player, targets);
  const informedTarget = informedTargets[0];
  const randomTarget = targets[randomNumber(0, Math.max(targets.length - 1, 0))];
  const cooperativeTarget = trustedTarget ?? randomTarget;
  const guessTarget = informedTarget ?? randomTarget;
  const guessedNumber = knownSecret(player, guessTarget) ?? randomNumber(1, 9);

  switch (player.personality) {
    case 'risky':
      return { playerId: player.id, kind: 'guess', targetPlayerId: guessTarget?.id, guessedNumber };
    case 'conservative':
      return player.crystals > 4 && randomNumber(1, 10) > 8 ? { playerId: player.id, kind: 'reroll' } : { playerId: player.id, kind: 'hold' };
    case 'deceptive':
      return randomNumber(1, 10) > 5 ? { playerId: player.id, kind: 'guess', targetPlayerId: guessTarget?.id, guessedNumber } : { playerId: player.id, kind: 'hold' };
    case 'cooperative':
      return cooperativeTarget && trustOf(relationships, player.id, cooperativeTarget.id) >= 55 && randomNumber(1, 10) > 6 ? { playerId: player.id, kind: 'swap', targetPlayerId: cooperativeTarget.id } : { playerId: player.id, kind: 'hold' };
    case 'rational':
    default:
      if (informedTarget) return { playerId: player.id, kind: 'guess', targetPlayerId: informedTarget.id, guessedNumber: knownSecret(player, informedTarget) };
      if (player.crystals >= 3 && randomNumber(1, 10) > 8) return { playerId: player.id, kind: 'reroll' };
      return { playerId: player.id, kind: 'hold' };
  }
}

export function createAiChat(state: GameState, player: Player): ChatMessage {
  const fakeNumber = player.personality === 'deceptive' ? randomNumber(1, 9) : player.secretNumber;
  const contentByPersonality: Record<string, string> = {
    rational: '主竞赛看的是本轮积分，别把晶石直接当分数。',
    deceptive: `我这轮数字大概是 ${fakeNumber}，可以交换信息。`,
    cooperative: '我愿意做公平交易，互选交换才有收益。',
    risky: '猜中一次就能拉开本轮积分。',
    conservative: '我更想稳住晶石，别把我拖进死亡竞赛。',
  };

  return {
    id: id('chat'),
    playerId: player.id,
    content: contentByPersonality[player.personality ?? 'rational'],
    round: state.round,
    phase: state.phase,
    createdAt: new Date().toISOString(),
  };
}

export function createAiTrade(state: GameState, player: Player): TradeOffer | undefined {
  const targets = activeTargets(state, player).filter((target) => target.status !== 'safe');
  const relationships = ensureRelationships(state);
  const human = targets.find((candidate) => candidate.isHuman);
  const trusted = mostTrustedCandidate(relationships, player.id, targets);
  const target = player.personality === 'cooperative' ? trusted ?? human : human ?? trusted;

  if (!target || player.crystals <= 1 || randomNumber(1, 10) < 7) return undefined;

  return {
    id: id('trade'),
    fromPlayerId: player.id,
    toPlayerId: target.id,
    offeredCrystals: player.personality === 'cooperative' ? 2 : 1,
    requestedCrystals: 1,
    offeredInfo: player.personality === 'deceptive' ? '我给你一个高价值数字线索，但你需要自己判断真假。' : '我愿意公开我的秘密数字。',
    requestedInfo: '请公开你的秘密数字。',
    revealsOfferedSecret: true,
    requestsTargetSecret: true,
    status: 'pending',
  };
}
