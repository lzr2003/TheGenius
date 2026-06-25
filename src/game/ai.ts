import type { ActionSubmission, ChatMessage, GameState, Player, TradeOffer } from './types';
import { id, randomNumber } from './mock';

function activeTargets(state: GameState, self: Player): Player[] {
  return state.players.filter((player) => player.status !== 'eliminated' && player.id !== self.id);
}

export function decideAiAction(state: GameState, player: Player): ActionSubmission {
  const targets = activeTargets(state, player);
  const target = targets[randomNumber(0, Math.max(targets.length - 1, 0))];

  switch (player.personality) {
    case 'risky':
      return { playerId: player.id, kind: 'guess', targetPlayerId: target?.id, guessedNumber: randomNumber(1, 9) };
    case 'conservative':
      return player.secretNumber <= 2 && player.crystals > 2 ? { playerId: player.id, kind: 'reroll' } : { playerId: player.id, kind: 'hold' };
    case 'deceptive':
      return randomNumber(1, 10) > 6 ? { playerId: player.id, kind: 'guess', targetPlayerId: target?.id, guessedNumber: randomNumber(1, 9) } : { playerId: player.id, kind: 'hold' };
    case 'cooperative':
      return target && randomNumber(1, 10) > 7 ? { playerId: player.id, kind: 'swap', targetPlayerId: target.id } : { playerId: player.id, kind: 'hold' };
    case 'rational':
    default:
      if (player.secretNumber <= 3 && player.crystals > 1) return { playerId: player.id, kind: 'reroll' };
      if (player.crystals >= 4 && target && randomNumber(1, 10) > 7) {
        return { playerId: player.id, kind: 'guess', targetPlayerId: target.id, guessedNumber: randomNumber(1, 9) };
      }
      return { playerId: player.id, kind: 'hold' };
  }
}

export function createAiChat(state: GameState, player: Player): ChatMessage {
  const fakeNumber = player.personality === 'deceptive' ? randomNumber(1, 9) : player.secretNumber;
  const contentByPersonality: Record<string, string> = {
    rational: '先算资产评分，低数字重抽的收益更高。',
    deceptive: `我这轮数字大概是 ${fakeNumber}，可以交换信息。`,
    cooperative: '我愿意做公平交易，安全权可以互保。',
    risky: '不猜别人数字就没有爆发收益。',
    conservative: '我更想稳住资源，别把我拖进死亡竞赛。',
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
  const targets = activeTargets(state, player);
  const target = targets.find((candidate) => candidate.isHuman) ?? targets[0];
  if (!target || player.crystals <= 1 || randomNumber(1, 10) < 7) return undefined;

  return {
    id: id('trade'),
    fromPlayerId: player.id,
    toPlayerId: target.id,
    offeredCrystals: player.personality === 'cooperative' ? 2 : 1,
    requestedCrystals: 1,
    offeredInfo: player.personality === 'deceptive' ? '可能的假情报' : `我的数字接近 ${player.secretNumber}`,
    requestedInfo: '你的秘密数字线索',
    status: 'pending',
  };
}
