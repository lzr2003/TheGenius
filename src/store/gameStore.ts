import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { advanceGamePhase } from '../game/engine';
import { createInitialState, createLog, id } from '../game/mock';
import { createRelationshipMatrix } from '../game/relations';
import { grantSafetyToken } from '../game/safety';
import { acceptTradeSettlement, rejectTradeSettlement } from '../game/trade';
import type { ActionKind, GameState } from '../game/types';
import { playSfx } from '../utils/audio';

interface GameStore {
  state: GameState;
  createNewGame: (playerCount: number) => void;
  advancePhase: () => void;
  submitHumanAction: (kind: ActionKind, targetPlayerId?: string, guessedNumber?: number) => void;
  sendChat: (content: string, toPlayerId?: string, claimedSecretNumber?: number) => void;
  acceptTrade: (tradeId: string) => void;
  rejectTrade: (tradeId: string) => void;
  grantSafety: (targetPlayerId: string) => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
}

function normalizeLoadedState(state: GameState): GameState {
  return {
    ...state,
    relationships: state.relationships?.length ? state.relationships : createRelationshipMatrix(state.players),
    roundPoints: state.roundPoints ?? Object.fromEntries(state.players.map((player) => [player.id, 0])),
  };
}

function resolveActionSubmission(state: GameState): GameState {
  if (state.phase !== 'action') return state;

  const settlementState = advanceGamePhase(state);
  if (settlementState.phase !== 'settlement') return settlementState;

  return advanceGamePhase(settlementState);
}

function sfxForPhase(state: GameState): void {
  if (state.phase === 'deathmatch') {
    playSfx(state.deathMatch?.winnerId ? 'eliminate' : 'death');
    return;
  }

  if (state.phase === 'settlement' || state.phase === 'safety') {
    playSfx('settlement');
    return;
  }

  if (state.phase === 'elimination') {
    playSfx('eliminate');
    return;
  }

  playSfx('phase');
}

function clampSecret(value?: number): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  return Math.min(9, Math.max(1, Math.round(value)));
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),

  createNewGame: (playerCount) => {
    playSfx('phase');
    set({ state: createInitialState(playerCount) });
  },

  advancePhase: () => set((store) => {
    const nextState = advanceGamePhase(store.state);
    sfxForPhase(nextState);
    return { state: nextState };
  }),

  submitHumanAction: (kind, targetPlayerId, guessedNumber) => set((store) => {
    if (store.state.phase !== 'action') {
      playSfx('error');
      return {
        state: {
          ...store.state,
          matchLog: [...store.state.matchLog, createLog('ACTION_SUBMITTED', '当前不是行动提交阶段，行动未生效。请先推进到行动提交阶段。')],
        },
      };
    }

    const filtered = store.state.actionSubmissions.filter((action) => action.playerId !== 'human');
    const nextState: GameState = {
      ...store.state,
      actionSubmissions: [...filtered, { playerId: 'human', kind, targetPlayerId, guessedNumber }],
      matchLog: [...store.state.matchLog, createLog('ACTION_SUBMITTED', `你已提交行动：${kind}，系统正在结算本轮。`)],
    };

    const resolvedState = resolveActionSubmission(nextState);
    playSfx('submit');
    setTimeout(() => playSfx('settlement'), 150);
    return { state: resolvedState };
  }),

  sendChat: (content, toPlayerId, claimedSecretNumber) => set((store) => {
    playSfx('click');
    const claimed = clampSecret(claimedSecretNumber);
    const isPrivate = Boolean(toPlayerId);
    const players = isPrivate && claimed
      ? store.state.players.map((player) => player.id === toPlayerId ? { ...player, knownInfo: { ...player.knownInfo, human: claimed } } : player)
      : store.state.players;
    const messageContent = content || (claimed ? `我声称我的秘密数字是 ${claimed}。` : '');

    return {
      state: {
        ...store.state,
        players,
        chatMessages: [...store.state.chatMessages, {
          id: id('chat'),
          playerId: 'human',
          toPlayerId,
          channel: isPrivate ? 'private' : 'public',
          content: messageContent,
          claimedSecretNumber: isPrivate ? claimed : undefined,
          round: store.state.round,
          phase: store.state.phase,
          createdAt: new Date().toISOString(),
        }],
        matchLog: [...store.state.matchLog, createLog('CHAT_SENT', isPrivate ? '你发送了一条私聊信息。' : `你发言：${messageContent}`)],
      },
    };
  }),

  acceptTrade: (tradeId) => set((store) => {
    playSfx('tradeAccept');
    return { state: acceptTradeSettlement(store.state, tradeId) };
  }),

  rejectTrade: (tradeId) => set((store) => {
    playSfx('tradeReject');
    return { state: rejectTradeSettlement(store.state, tradeId) };
  }),

  grantSafety: (targetPlayerId) => set((store) => {
    playSfx('safety');
    return { state: grantSafetyToken(store.state, targetPlayerId) };
  }),

  saveGame: async () => {
    playSfx('click');
    const stateJson = JSON.stringify(get().state);
    await invoke('save_game_state', { stateJson });
  },

  loadGame: async () => {
    playSfx('phase');
    const stateJson = await invoke<string>('load_game_state');
    set({ state: normalizeLoadedState(JSON.parse(stateJson) as GameState) });
  },
}));
