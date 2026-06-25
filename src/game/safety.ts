import type { GameState, Player } from './types';
import { createLog } from './mock';
import { adjustRelationship, ensureRelationships, mostTrustedCandidate } from './relations';

function playerName(players: Player[], id: string): string {
  return players.find((player) => player.id === id)?.name ?? id;
}

export function eligibleSafetyRecipients(state: GameState): Player[] {
  const ownerId = state.safetyToken?.ownerPlayerId;
  if (!ownerId) return [];
  return state.players.filter((player) => player.status === 'active' && player.id !== ownerId);
}

export function grantSafetyToken(state: GameState, targetPlayerId: string): GameState {
  const token = state.safetyToken;
  if (!token || token.recipientPlayerId) return state;

  const target = eligibleSafetyRecipients(state).find((player) => player.id === targetPlayerId);
  if (!target) return state;

  const players = state.players.map((player) =>
    player.id === target.id ? { ...player, status: 'safe' as const } : player,
  );

  let relationships = ensureRelationships(state);
  relationships = adjustRelationship(relationships, target.id, token.ownerPlayerId, {
    trustDelta: 16,
    allianceDelta: 10,
    betrayalDelta: -4,
    note: '获得安全权赠送',
  });
  relationships = adjustRelationship(relationships, token.ownerPlayerId, target.id, {
    trustDelta: 6,
    allianceDelta: 8,
    note: '主动赠送安全权',
  });

  return {
    ...state,
    players,
    relationships,
    safetyToken: { ...token, recipientPlayerId: target.id },
    matchLog: [
      ...state.matchLog,
      createLog('SAFETY_GRANTED', `${playerName(players, token.ownerPlayerId)} 将安全权赠送给 ${playerName(players, target.id)}。`),
      createLog('RELATION_CHANGED', `${playerName(players, target.id)} 对 ${playerName(players, token.ownerPlayerId)} 的信任与联盟值上升。`),
    ],
  };
}

export function autoGrantSafetyToken(state: GameState): GameState {
  const ownerId = state.safetyToken?.ownerPlayerId;
  if (!ownerId || state.safetyToken?.recipientPlayerId) return state;

  const owner = state.players.find((player) => player.id === ownerId);
  if (!owner || owner.isHuman) return state;

  const candidates = eligibleSafetyRecipients(state);
  if (candidates.length === 0) return state;

  const target = mostTrustedCandidate(ensureRelationships(state), owner.id, candidates) ?? candidates[0];
  return grantSafetyToken(state, target.id);
}
