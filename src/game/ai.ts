import type { ActionSubmission, ChatMessage, GameState, Player, TradeOffer } from './types';
import { id, randomNumber } from './mock';
import { ensureRelationships, mostTrustedCandidate } from './relations';

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
  const informedTargets = knownTargets(player, targets);
  const informedTarget = informedTargets[0];
  const randomTarget = targets[randomNumber(0, Math.max(targets.length - 1, 0))];
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
      return informedTarget && randomNumber(1, 10) > 6 ? { playerId: player.id, kind: 'guess', targetPlayerId: informedTarget.id, guessedNumber: knownSecret(player, informedTarget) } : { playerId: player.id, kind: 'hold' };
    case 'rational':
    default:
      if (informedTarget) return { playerId: player.id, kind: 'guess', targetPlayerId: informedTarget.id, guessedNumber: knownSecret(player, informedTarget) };
      if (player.crystals >= 3 && randomNumber(1, 10) > 8) return { playerId: player.id, kind: 'reroll' };
      return { playerId: player.id, kind: 'hold' };
  }
}

export function createAiChat(state: GameState, player: Player): ChatMessage {
  const human = state.players.find((candidate) => candidate.isHuman && candidate.status !== 'eliminated');
  const shouldPrivate = Boolean(human) && ['cooperative', 'deceptive', 'rational'].includes(player.personality ?? 'rational') && randomNumber(1, 10) > 5;
  const claimedNumber = player.personality === 'deceptive' ? randomNumber(1, 9) : player.secretNumber;

  if (shouldPrivate && human) {
    return {
      id: id('chat'),
      playerId: player.id,
      toPlayerId: human.id,
      channel: 'private',
      content: player.personality === 'deceptive' ? `私下告诉你，我的数字是 ${claimedNumber}。你信不信由你。` : `私聊交换情报：我声称我的数字是 ${claimedNumber}。`,
      claimedSecretNumber: claimedNumber,
      round: state.round,
      phase: state.phase,
      createdAt: new Date().toISOString(),
    };
  }

  const contentByPersonality: Record<string, string> = {
    rational: '主竞赛看的是本轮积分，数字情报只能靠交流判断真假。',
    deceptive: '想知道我的数字可以私聊，但我不保证每句话都是真的。',
    cooperative: '我愿意私聊交换数字情报，互相信任才有价值。',
    risky: '只要拿到一个可信数字，我就会直接猜。',
    conservative: '我更想稳住晶石，公开场合不会说太多。',
  };

  return {
    id: id('chat'),
    playerId: player.id,
    channel: 'public',
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
    offeredInfo: '晶石交易可以附带数字情报；真正的真假仍需要通过私聊和行为判断。',
    requestedInfo: '希望你私聊告诉我你的数字。',
    revealsOfferedSecret: player.personality !== 'deceptive',
    requestsTargetSecret: true,
    status: 'pending',
  };
}
