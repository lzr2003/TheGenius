import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { advanceGamePhase } from '../game/engine';
import { createInitialState, createLog, id } from '../game/mock';
import { createRelationshipMatrix } from '../game/relations';
import { grantSafetyToken } from '../game/safety';
import { acceptTradeSettlement, rejectTradeSettlement } from '../game/trade';
import type { ActionKind, GameState } from '../game/types';

interface GameStore {
  state: GameState;
  createNewGame: (playerCount: number) => void;
  advancePhase: () => void;
  submitHumanAction: (kind: ActionKind, targetPlayerId?: string, guessedNumber?: number) => void;
  sendChat: (content: string) => void;
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
  };
}

function resolveActionSubmission(state: GameState): GameState {
  if (state.phase !== 'action') return state;

  const settlementState = advanceGamePhase(state);
  if (settlementState.phase !== 'settlement') return settlementState;

  return advanceGamePhase(settlementState);
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),

  createNewGame: (playerCount) => set({ state: createInitialState(playerCount) }),

  advancePhase: () => set((store) => ({ state: advanceGamePhase(store.state) })),

  submitHumanAction: (kind, targetPlayerId, guessedNumber) => set((store) => {
    if (store.state.phase !== 'action') {
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

    return { state: resolveActionSubmission(nextState) };
  }),

  sendChat: (content) => set((store) => ({
    state: {
      ...store.state,
      chatMessages: [...store.state.chatMessages, { id: id('chat'), playerId: 'human', content, round: store.state.round, phase: store.state.phase, createdAt: new Date().toISOString() }],
      matchLog: [...store.state.matchLog, createLog('CHAT_SENT', `你发言：${content}`)],
    },
  })),

  acceptTrade: (tradeId) => set((store) => ({ state: acceptTradeSettlement(store.state, tradeId) })),

  rejectTrade: (tradeId) => set((store) => ({ state: rejectTradeSettlement(store.state, tradeId) })),

  grantSafety: (targetPlayerId) => set((store) => ({ state: grantSafetyToken(store.state, targetPlayerId) })),

  saveGame: async () => {
    const stateJson = JSON.stringify(get().state);
    await invoke('save_game_state', { stateJson });
  },

  loadGame: async () => {
    const stateJson = await invoke<string>('load_game_state');
    set({ state: normalizeLoadedState(JSON.parse(stateJson) as GameState) });
  },
}));
