import type { DeathMatchRound, DeathMatchState, Player } from './types';
import { randomNumber } from './mock';

export function createDeathMatch(players: Player[]): DeathMatchState | undefined {
  const challenger = players.find((player) => player.status === 'danger');
  const protectedCandidates = players.filter((player) => player.status !== 'eliminated' && player.status !== 'safe' && player.id !== challenger?.id);
  const fallbackCandidates = players.filter((player) => player.status !== 'eliminated' && player.id !== challenger?.id);
  const opponent = protectedCandidates[0] ?? fallbackCandidates[0];
  if (!challenger || !opponent) return undefined;

  return {
    challengerId: challenger.id,
    opponentId: opponent.id,
    challengerScore: 0,
    opponentScore: 0,
    round: 1,
    history: [],
  };
}

export function playDeathMatchRound(match: DeathMatchState): DeathMatchState {
  if (match.winnerId || match.loserId) return match;

  const challengerPick = randomNumber(1, 5);
  const opponentPick = randomNumber(1, 5);
  let challengerScore = match.challengerScore;
  let opponentScore = match.opponentScore;
  let winnerId: string | undefined;
  let note = '双方数字相同，本小局无人得分。';

  if (challengerPick > opponentPick) {
    challengerScore += 1;
    winnerId = match.challengerId;
    note = '挑战者预测成功，获得 1 分。';
  } else if (opponentPick > challengerPick) {
    opponentScore += 1;
    winnerId = match.opponentId;
    note = '防守者反预测成功，获得 1 分。';
  }

  const history: DeathMatchRound[] = [
    ...match.history,
    { round: match.round, challengerPick, opponentPick, winnerId, note },
  ];

  const shouldFinish = match.round >= 5 && challengerScore !== opponentScore;
  const finalWinnerId = shouldFinish ? (challengerScore > opponentScore ? match.challengerId : match.opponentId) : undefined;
  const finalLoserId = finalWinnerId === match.challengerId ? match.opponentId : finalWinnerId === match.opponentId ? match.challengerId : undefined;

  return {
    ...match,
    challengerScore,
    opponentScore,
    history,
    round: match.round + 1,
    winnerId: finalWinnerId,
    loserId: finalLoserId,
  };
}
