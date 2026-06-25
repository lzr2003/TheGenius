import type { GameState, Player, PlayerRelation } from './types';

type RelationDelta = {
  trustDelta?: number;
  betrayalDelta?: number;
  allianceDelta?: number;
  note?: string;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function createRelation(fromPlayerId: string, toPlayerId: string): PlayerRelation {
  return {
    fromPlayerId,
    toPlayerId,
    trust: 50,
    betrayal: 0,
    alliance: 0,
    notes: [],
  };
}

export function createRelationshipMatrix(players: Player[]): PlayerRelation[] {
  return players.flatMap((from) =>
    players
      .filter((to) => to.id !== from.id)
      .map((to) => createRelation(from.id, to.id)),
  );
}

export function ensureRelationships(state: GameState): PlayerRelation[] {
  if (state.relationships.length > 0) return state.relationships;
  return createRelationshipMatrix(state.players);
}

export function adjustRelationship(
  relationships: PlayerRelation[],
  fromPlayerId: string,
  toPlayerId: string,
  delta: RelationDelta,
): PlayerRelation[] {
  let found = false;
  const updated = relationships.map((relation) => {
    if (relation.fromPlayerId !== fromPlayerId || relation.toPlayerId !== toPlayerId) return relation;
    found = true;
    const notes = delta.note ? [...relation.notes.slice(-4), delta.note] : relation.notes;
    return {
      ...relation,
      trust: clamp(relation.trust + (delta.trustDelta ?? 0)),
      betrayal: clamp(relation.betrayal + (delta.betrayalDelta ?? 0)),
      alliance: clamp(relation.alliance + (delta.allianceDelta ?? 0)),
      notes,
    };
  });

  if (!found) {
    const relation = createRelation(fromPlayerId, toPlayerId);
    updated.push({
      ...relation,
      trust: clamp(relation.trust + (delta.trustDelta ?? 0)),
      betrayal: clamp(relation.betrayal + (delta.betrayalDelta ?? 0)),
      alliance: clamp(relation.alliance + (delta.allianceDelta ?? 0)),
      notes: delta.note ? [delta.note] : [],
    });
  }

  return updated;
}

export function trustOf(relationships: PlayerRelation[], fromPlayerId: string, toPlayerId: string): number {
  return relationships.find((relation) => relation.fromPlayerId === fromPlayerId && relation.toPlayerId === toPlayerId)?.trust ?? 50;
}

export function betrayalOf(relationships: PlayerRelation[], fromPlayerId: string, toPlayerId: string): number {
  return relationships.find((relation) => relation.fromPlayerId === fromPlayerId && relation.toPlayerId === toPlayerId)?.betrayal ?? 0;
}

export function mostTrustedCandidate(
  relationships: PlayerRelation[],
  fromPlayerId: string,
  candidates: Player[],
): Player | undefined {
  return [...candidates].sort((a, b) => {
    const trustDiff = trustOf(relationships, fromPlayerId, b.id) - trustOf(relationships, fromPlayerId, a.id);
    if (trustDiff !== 0) return trustDiff;
    return betrayalOf(relationships, fromPlayerId, a.id) - betrayalOf(relationships, fromPlayerId, b.id);
  })[0];
}

export function relationLabel(relation: PlayerRelation): string {
  if (relation.betrayal >= 60) return '敌对';
  if (relation.alliance >= 60) return '盟友';
  if (relation.trust >= 70) return '信任';
  if (relation.trust <= 30) return '怀疑';
  return '观望';
}
