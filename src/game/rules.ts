import type { ActionSubmission, GameState, Player, RoundResult, RoundScore } from './types';
import { randomNumber } from './mock';

function clonePlayers(players: Player[]): Player[] {
  return players.map((player) => ({ ...player, knownInfo: { ...player.knownInfo } }));
}

function getPlayer(players: Player[], id: string): Player | undefined {
  return players.find((player) => player.id === id);
}

function applyAction(players: Player[], action: ActionSubmission): number {
  const actor = getPlayer(players, action.playerId);
  if (!actor || actor.status === 'eliminated') return 0;

  if (action.kind === 'reroll' && actor.crystals > 0) {
    actor.crystals -= 1;
    actor.secretNumber = randomNumber(1, 9);
    return -1;
  }

  if (action.kind === 'swap' && action.targetPlayerId) {
    const target = getPlayer(players, action.targetPlayerId);
    if (target && target.status !== 'eliminated') {
      const previous = actor.secretNumber;
      actor.secretNumber = target.secretNumber;
      target.secretNumber = previous;
    }
    return 0;
  }

  if (action.kind === 'guess' && action.targetPlayerId && action.guessedNumber) {
    const target = getPlayer(players, action.targetPlayerId);
    if (!target || target.status === 'eliminated') return 0;
    if (target.secretNumber === action.guessedNumber) {
      actor.crystals += 3;
      actor.knownInfo[target.id] = target.secretNumber;
      return 3;
    }
    actor.crystals = Math.max(0, actor.crystals - 1);
    return -1;
  }

  return 0;
}

export function settleSecretNumberMarket(state: GameState): { players: Player[]; result: RoundResult } {
  const players = clonePlayers(state.players).map((player) => ({ ...player, status: player.status === 'eliminated' ? 'eliminated' : 'active' as const }));
  const deltas = new Map<string, number>();

  for (const action of state.actionSubmissions) {
    const delta = applyAction(players, action);
    deltas.set(action.playerId, (deltas.get(action.playerId) ?? 0) + delta);
  }

  const scores: RoundScore[] = players
    .filter((player) => player.status !== 'eliminated')
    .map((player) => ({
      playerId: player.id,
      crystals: player.crystals,
      secretNumber: player.secretNumber,
      score: player.crystals + player.secretNumber,
      delta: deltas.get(player.id) ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  const safetyPlayerId = scores[0]?.playerId;
  const dangerPlayerId = scores[scores.length - 1]?.playerId;

  for (const player of players) {
    if (player.id === safetyPlayerId) player.status = 'safe';
    if (player.id === dangerPlayerId) player.status = 'danger';
  }

  return {
    players,
    result: {
      round: state.round,
      scores,
      safetyPlayerId,
      dangerPlayerId,
      summary: `第 ${state.round} 轮结算完成：最高资产玩家获得安全权，最低资产玩家进入危险区。`,
    },
  };
}
