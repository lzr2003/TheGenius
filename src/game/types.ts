export type PlayerStatus = 'active' | 'safe' | 'danger' | 'eliminated';

export type GamePhase =
  | 'setup'
  | 'rule'
  | 'discussion'
  | 'trade'
  | 'action'
  | 'settlement'
  | 'safety'
  | 'deathmatch_select'
  | 'deathmatch'
  | 'elimination'
  | 'finished';

export type Personality = 'rational' | 'deceptive' | 'cooperative' | 'risky' | 'conservative';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHuman: boolean;
  status: PlayerStatus;
  crystals: number;
  secretNumber: number;
  knownInfo: Record<string, number>;
  personality?: Personality;
}

export interface PlayerRelation {
  fromPlayerId: string;
  toPlayerId: string;
  trust: number;
  betrayal: number;
  alliance: number;
  notes: string[];
}

export interface SafetyToken {
  ownerPlayerId: string;
  grantedAtRound: number;
  recipientPlayerId?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  content: string;
  round: number;
  phase: GamePhase;
  createdAt: string;
}

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredCrystals: number;
  requestedCrystals: number;
  offeredInfo?: string;
  requestedInfo?: string;
  revealsOfferedSecret?: boolean;
  requestsTargetSecret?: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

export type ActionKind = 'hold' | 'reroll' | 'swap' | 'guess';

export interface ActionSubmission {
  playerId: string;
  kind: ActionKind;
  targetPlayerId?: string;
  guessedNumber?: number;
}

export interface RoundScore {
  playerId: string;
  crystals: number;
  secretNumber: number;
  score: number;
  delta: number;
}

export interface RoundResult {
  round: number;
  scores: RoundScore[];
  safetyPlayerId?: string;
  dangerPlayerId?: string;
  summary: string;
}

export interface DeathMatchState {
  challengerId: string;
  opponentId: string;
  challengerScore: number;
  opponentScore: number;
  round: number;
  history: DeathMatchRound[];
  winnerId?: string;
  loserId?: string;
}

export interface DeathMatchRound {
  round: number;
  challengerPick: number;
  opponentPick: number;
  winnerId?: string;
  note: string;
}

export type LogType =
  | 'PHASE_CHANGED'
  | 'CHAT_SENT'
  | 'TRADE_CREATED'
  | 'TRADE_ACCEPTED'
  | 'TRADE_REJECTED'
  | 'TRADE_CANCELLED'
  | 'ACTION_SUBMITTED'
  | 'ROUND_SETTLED'
  | 'SAFETY_GRANTED'
  | 'RELATION_CHANGED'
  | 'DEATHMATCH_STARTED'
  | 'DEATHMATCH_ROUND_RESULT'
  | 'PLAYER_ELIMINATED'
  | 'GAME_FINISHED';

export interface MatchLogEntry {
  id: string;
  type: LogType;
  message: string;
  createdAt: string;
}

export interface GameState {
  matchId: string;
  round: number;
  phase: GamePhase;
  players: Player[];
  relationships: PlayerRelation[];
  safetyToken?: SafetyToken;
  currentPlayerId: string;
  chatMessages: ChatMessage[];
  tradeOffers: TradeOffer[];
  actionSubmissions: ActionSubmission[];
  roundResults: RoundResult[];
  matchLog: MatchLogEntry[];
  deathMatch?: DeathMatchState;
}
