import type { ActionSubmission, GameState, Player, RoundResult, RoundScore } from './types';
import { randomNumber } from './mock';

function clonePlayers(players: Player[]): Player[] {
  return players.map((player) => ({ ...player, knownInfo: { ...player.knownInfo } }));
}

function getPlayer(players: Player[], id: string): Player | undefined {
  return players.find((player) => player.id === id);
}

function add(map: Map<string, number>, playerId: string, value: number): void {
  map.set(playerId, (map.get(playerId) ?? 0) + value);
}

function activeActionMap(actions: ActionSubmission[]): Map<string, ActionSubmission> {
  return new Map(actions.map((action) => [action.playerId, action]));
}

function resetStatuses(players: Player[]): Player[] {
  return players.map((player) => ({
    ...player,
    status: player.status === 'eliminated' ? 'eliminated' : 'active' as const,
  }));
}

export function settleSecretNumberMarket(state: GameState): { players: Player[]; result: RoundResult; roundPoints: Record<string, number> } {
  const players = resetStatuses(clonePlayers(state.players));
  const actions = state.actionSubmissions.filter((action) => getPlayer(players, action.playerId)?.status !== 'eliminated');
  const actionsByPlayer = activeActionMap(actions);
  const points = new Map<string, number>();
  const actionBonus = new Map<string, number>();
  const riskDelta = new Map<string, number>();
  const crystalDelta = new Map<string, number>();

  for (const player of players.filter((item) => item.status !== 'eliminated')) {
    points.set(player.id, 0);
    actionBonus.set(player.id, 0);
    riskDelta.set(player.id, 0);
    crystalDelta.set(player.id, 0);
  }

  for (const action of actions) {
    const actor = getPlayer(players, action.playerId);
    if (!actor || actor.status === 'eliminated') continue;

    if (action.kind === 'hold') {
      add(points, actor.id, 1);
      add(actionBonus, actor.id, 1);
    }

    if (action.kind === 'reroll' && actor.crystals > 0) {
      actor.crystals -= 1;
      actor.secretNumber = randomNumber(1, 9);
      add(crystalDelta, actor.id, -1);
    }
  }

  const swapped = new Set<string>();
  for (const action of actions.filter((item) => item.kind === 'swap' && item.targetPlayerId)) {
    const actor = getPlayer(players, action.playerId);
    const target = action.targetPlayerId ? getPlayer(players, action.targetPlayerId) : undefined;
    const targetAction = action.targetPlayerId ? actionsByPlayer.get(action.targetPlayerId) : undefined;
    if (!actor || !target || actor.status === 'eliminated' || target.status === 'eliminated') continue;
    if (swapped.has(actor.id) || swapped.has(target.id)) continue;

    const mutual = targetAction?.kind === 'swap' && targetAction.targetPlayerId === actor.id;
    if (!mutual) continue;

    const previousSecret = actor.secretNumber;
    actor.secretNumber = target.secretNumber;
    target.secretNumber = previousSecret;
    swapped.add(actor.id);
    swapped.add(target.id);
    add(points, actor.id, 2);
    add(points, target.id, 2);
    add(actionBonus, actor.id, 2);
    add(actionBonus, target.id, 2);
  }

  for (const action of actions.filter((item) => item.kind === 'guess' && item.targetPlayerId)) {
    const actor = getPlayer(players, action.playerId);
    const target = action.targetPlayerId ? getPlayer(players, action.targetPlayerId) : undefined;
    if (!actor || !target || actor.status === 'eliminated' || target.status === 'eliminated') continue;

    if (target.secretNumber === action.guessedNumber) {
      actor.crystals += 1;
      actor.knownInfo[target.id] = target.secretNumber;
      add(points, actor.id, 5);
      add(actionBonus, actor.id, 5);
      add(crystalDelta, actor.id, 1);
    } else {
      actor.crystals = Math.max(0, actor.crystals - 1);
      add(points, actor.id, -2);
      add(riskDelta, actor.id, -2);
      add(crystalDelta, actor.id, -1);
    }
  }

  const scores: RoundScore[] = players
    .filter((player) => player.status !== 'eliminated')
    .map((player) => {
      const roundPoints = points.get(player.id) ?? 0;
      return {
        playerId: player.id,
        crystals: player.crystals,
        secretNumber: player.secretNumber,
        roundPoints,
        score: roundPoints,
        actionBonus: actionBonus.get(player.id) ?? 0,
        riskDelta: riskDelta.get(player.id) ?? 0,
        delta: crystalDelta.get(player.id) ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.roundPoints !== a.roundPoints) return b.roundPoints - a.roundPoints;
      if (b.crystals !== a.crystals) return b.crystals - a.crystals;
      return a.playerId.localeCompare(b.playerId);
    });

  const safetyPlayerId = scores[0]?.playerId;
  const dangerPlayerId = scores[scores.length - 1]?.playerId;

  for (const player of players) {
    if (player.id === safetyPlayerId) player.status = 'safe';
    if (player.id === dangerPlayerId) player.status = 'danger';
  }

  const roundPoints = Object.fromEntries(scores.map((score) => [score.playerId, score.roundPoints]));

  return {
    players,
    roundPoints,
    result: {
      round: state.round,
      scores,
      safetyPlayerId,
      dangerPlayerId,
      summary: `第 ${state.round} 轮结算完成：本轮积分最高者获得安全权，最低者进入危险区。`,
    },
  };
}
