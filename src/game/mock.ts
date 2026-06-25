import type { GameState, MatchLogEntry, Personality, Player } from './types';
import { createRelationshipMatrix } from './relations';

const names = ['Raven', 'Iris', 'Cipher', 'Mira', 'Noah', 'Vega', 'Echo', 'Luna', 'Orion', 'Sage', 'Kane', 'Nova', 'Aster'];
const personalities: Personality[] = ['rational', 'deceptive', 'cooperative', 'risky', 'conservative'];

export function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createLog(type: MatchLogEntry['type'], message: string): MatchLogEntry {
  return { id: id('log'), type, message, createdAt: new Date().toISOString() };
}

export function createPlayers(count: number): Player[] {
  const safeCount = Math.min(Math.max(count, 6), 13);
  return Array.from({ length: safeCount }, (_, index) => ({
    id: index === 0 ? 'human' : id('ai'),
    name: index === 0 ? '你' : names[index - 1] ?? `AI-${index}`,
    avatar: index === 0 ? 'YOU' : names[index - 1]?.slice(0, 2).toUpperCase() ?? 'AI',
    isHuman: index === 0,
    status: 'active',
    crystals: 5,
    secretNumber: randomNumber(1, 9),
    knownInfo: {},
    personality: index === 0 ? undefined : personalities[(index - 1) % personalities.length],
  }));
}

export function createInitialState(playerCount = 9): GameState {
  const players = createPlayers(playerCount);
  return {
    matchId: id('match'),
    round: 1,
    phase: 'rule',
    players,
    relationships: createRelationshipMatrix(players),
    currentPlayerId: 'human',
    chatMessages: [],
    tradeOffers: [],
    actionSubmissions: [],
    roundResults: [],
    matchLog: [createLog('PHASE_CHANGED', '比赛开始：秘密数字市场规则已公布。')],
  };
}
