import { Pair, Group, Match, SetScore, PlayoffBracket, PlayoffRound, GroupMode } from '../types';

export interface StandingRow {
  pairId: string;
  pair: Pair;
  points: number; // 3 for win, 1 for played/lost (often 2 pts win, 1 pt loss, let's use standard: PG*3 for maximum contrast)
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  gamesWon: number;
  gamesLost: number;
  gamesDiff: number;
}

// Helper to generate a unique random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Generate circular or standard matches for a group of pairs
export function generateGroupMatches(pairIds: string[], groupName: string): Match[] {
  const matches: Match[] = [];
  const n = pairIds.length;

  if (n < 2) return [];

  // Round Robin generation
  // For 3 pairs (A, B, C): A vs B, B vs C, A vs C
  // For 4 pairs (A, B, C, D): A vs B, C vs D, A vs C, B vs D, A vs D, B vs C
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        id: `match_${groupName.replace(/\s+/g, '')}_${i}_${j}_${generateId()}`,
        teamAId: pairIds[i],
        teamBId: pairIds[j],
        set1: { teamA: 0, teamB: 0 },
        set2: { teamA: 0, teamB: 0 },
        set3: { teamA: 0, teamB: 0 },
        winnerId: null,
        played: false,
        roundName: groupName,
      });
    }
  }

  return matches;
}

// Distributes pairs into groups manually configured by groupLetter selection
export function generateGroups(pairs: Pair[], existingGroups: Group[] = []): Group[] {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const groups: Group[] = [];

  const allExistingMatches: Match[] = [];
  if (existingGroups && Array.isArray(existingGroups)) {
    existingGroups.forEach(g => {
      if (g.matches) {
        allExistingMatches.push(...g.matches);
      }
    });
  }

  letters.forEach(letter => {
    const groupPairs = pairs.filter(p => p.groupLetter === letter);
    // Valid groups have between 1 and 8 pairs
    if (groupPairs.length >= 1 && groupPairs.length <= 8) {
      const groupName = `Grupo ${letter}`;
      const pairIds = groupPairs.map(p => p.id);
      
      const groupMatches = generateGroupMatchesWithPreservation(pairIds, groupName, allExistingMatches);
      
      const existingGroup = existingGroups?.find(g => g.name === groupName);
      const groupId = existingGroup?.id || `group_${letter.toLowerCase()}_${generateId()}`;

      groups.push({
        id: groupId,
        name: groupName,
        pairIds,
        matches: groupMatches
      });
    }
  });

  return groups;
}

// Generates circular or standard matches for a group of pairs, preserving existing matches if possible
export function generateGroupMatchesWithPreservation(pairIds: string[], groupName: string, existingMatches: Match[] = []): Match[] {
  const matches: Match[] = [];
  const n = pairIds.length;

  if (n < 2) return [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const teamAId = pairIds[i];
      const teamBId = pairIds[j];
      
      const existing = existingMatches.find(m => 
        (m.teamAId === teamAId && m.teamBId === teamBId) ||
        (m.teamAId === teamBId && m.teamBId === teamAId)
      );

      if (existing) {
        matches.push(existing);
      } else {
        matches.push({
          id: `match_${groupName.replace(/\s+/g, '')}_${i}_${j}_${generateId()}`,
          teamAId,
          teamBId,
          set1: { teamA: 0, teamB: 0 },
          set2: { teamA: 0, teamB: 0 },
          set3: { teamA: 0, teamB: 0 },
          winnerId: null,
          played: false,
          roundName: groupName,
        });
      }
    }
  }

  return matches;
}

// Calculate standings for a single group
export function calculateGroupStandings(group: Group, pairs: Pair[]): StandingRow[] {
  const standingsMap: Record<string, StandingRow> = {};

  // Initialize standings row for each pair in the group
  group.pairIds.forEach(pairId => {
    const pair = pairs.find(p => p.id === pairId) || { id: pairId, player1: 'Desconocido', player2: 'Desconocido', registeredAt: 0 };
    standingsMap[pairId] = {
      pairId,
      pair,
      points: 0,
      played: 0,
      won: 0,
      lost: 0,
      setsWon: 0,
      setsLost: 0,
      setsDiff: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDiff: 0,
    };
  });

  // Process completed matches in the group
  group.matches.forEach(match => {
    if (!match.played || !match.winnerId || match.annulled) return;

    const teamA = match.teamAId;
    const teamB = match.teamBId;

    // Ensure we have entries in the map
    if (!standingsMap[teamA] || !standingsMap[teamB]) return;

    const rowA = standingsMap[teamA];
    const rowB = standingsMap[teamB];

    // Update matches played
    rowA.played += 1;
    rowB.played += 1;

    // Calculate Sets and Games
    let setsA = 0;
    let setsB = 0;
    let gamesA = 0;
    let gamesB = 0;

    // Set 1
    gamesA += match.set1.teamA;
    gamesB += match.set1.teamB;
    if (match.set1.teamA > match.set1.teamB) setsA++;
    else if (match.set1.teamB > match.set1.teamA) setsB++;

    // Set 2
    gamesA += match.set2.teamA;
    gamesB += match.set2.teamB;
    if (match.set2.teamA > match.set2.teamB) setsA++;
    else if (match.set2.teamB > match.set2.teamA) setsB++;

    // Set 3 (if played)
    const hasSet3 = match.set3.teamA > 0 || match.set3.teamB > 0;
    if (hasSet3) {
      gamesA += match.set3.teamA;
      gamesB += match.set3.teamB;
      if (match.set3.teamA > match.set3.teamB) setsA++;
      else if (match.set3.teamB > match.set3.teamA) setsB++;
    }

    rowA.setsWon += setsA;
    rowA.setsLost += setsB;
    rowB.setsWon += setsB;
    rowB.setsLost += setsA;

    rowA.gamesWon += gamesA;
    rowA.gamesLost += gamesB;
    rowB.gamesWon += gamesB;
    rowB.gamesLost += gamesA;

    // Update winner and loser records
    if (match.winnerId === teamA) {
      rowA.won += 1;
      rowA.points += 3; // 3 pts for victory
      rowB.lost += 1;
      rowB.points += 1; // 1 pt for play
    } else {
      rowB.won += 1;
      rowB.points += 3;
      rowA.lost += 1;
      rowA.points += 1;
    }
  });

  // Convert map to array and compute differences
  const standingsList = Object.values(standingsMap).map(row => {
    row.setsDiff = row.setsWon - row.setsLost;
    row.gamesDiff = row.gamesWon - row.gamesLost;
    return row;
  });

  // Sort standings:
  // 1. Matches Won (won)
  // 2. SetsDifference (setsDiff)
  // 3. GamesDifference (gamesDiff)
  return standingsList.sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff;
    return b.gamesDiff - a.gamesDiff;
  });
}

// Helper to determine where the winner of a match in a given round should go in the next round
export function getNextMatchSlot(
  roundName: string,
  roundMatchesCount: number,
  matchIdx: number
): { nextMatchIdx: number; isTeamA: boolean } {
  if (roundName === 'Octavos de Final') {
    if (roundMatchesCount === 2) {
      // 10 pairs: Octavos Match 0 -> feeds into Cuartos Match 0 Team B
      //           Octavos Match 1 -> feeds into Cuartos Match 2 Team B
      if (matchIdx === 0) return { nextMatchIdx: 0, isTeamA: false };
      if (matchIdx === 1) return { nextMatchIdx: 2, isTeamA: false };
    } else if (roundMatchesCount === 4) {
      // 12 pairs: Octavos Match i -> feeds into Cuartos Match i Team B
      return { nextMatchIdx: matchIdx, isTeamA: false };
    }
  }

  // Standard power-of-2 advancement (e.g., Cuartos -> Semis -> Final)
  return {
    nextMatchIdx: Math.floor(matchIdx / 2),
    isTeamA: matchIdx % 2 === 0,
  };
}

// Logic to generate the initial playoff bracket. Supports sizes: '2' | '4' | '8' | '10' | '12' | '16'
export function generateInitialBracket(
  size: '2' | '4' | '8' | '10' | '12' | '16',
  groups: Group[],
  pairs: Pair[]
): PlayoffBracket {
  const rounds: PlayoffRound[] = [];

  // Calculate standings from current group stage
  const groupStandings = groups.map(g => ({
    groupName: g.name,
    standings: calculateGroupStandings(g, pairs)
  }));

  // Compile flat list of qualified pairs prioritized by standings (first places, then second, then third, etc.)
  const qualifiersList: string[] = [];
  const maxStandingsLength = Math.max(...groupStandings.map(g => g.standings.length), 0);
  for (let pos = 0; pos < maxStandingsLength; pos++) {
    groupStandings.forEach(g => {
      if (g.standings[pos]) {
        qualifiersList.push(g.standings[pos].pairId);
      }
    });
  }

  // Fallback: append any pairs that exist but might not be in standings (e.g. if groups are unbegun)
  pairs.forEach(p => {
    if (!qualifiersList.includes(p.id)) {
      qualifiersList.push(p.id);
    }
  });

  // Generate round structure based on size '8' (starts from Cuartos) or other (starts from Octavos)
  const roundConfigs: Array<[string, number]> = size === '8'
    ? [
        ['Cuartos de Final', 4],
        ['Semifinales', 2],
        ['Final', 1],
      ]
    : [
        ['Octavos de Final', 8],
        ['Cuartos de Final', 4],
        ['Semifinales', 2],
        ['Final', 1],
      ];

  for (let r = 0; r < roundConfigs.length; r++) {
    const [roundName, matchesCount] = roundConfigs[r];
    const matches: Match[] = [];

    for (let i = 0; i < matchesCount; i++) {
      let teamAId = '';
      let teamBId = '';

      // Dejar las llaves de la primera ronda sin completar por defecto para que las complete el usuario
      if (r === 0) {
        teamAId = '';
        teamBId = '';
      }

      matches.push({
        id: `playoff_${roundName ? roundName.replace(/\s+/g, '') : 'Round'}_${i}_${generateId()}`,
        teamAId,
        teamBId,
        set1: { teamA: 0, teamB: 0 },
        set2: { teamA: 0, teamB: 0 },
        set3: { teamA: 0, teamB: 0 },
        winnerId: null,
        played: false,
        roundName,
      });
    }

    rounds.push({
      name: roundName,
      matches,
    });
  }

  return { rounds };
}

// Advances bracket winners to the correct spot in the next round
export function advanceBracketWinner(
  bracket: PlayoffBracket,
  matchId: string,
  winnerId: string | null,
  set1?: SetScore,
  set2?: SetScore,
  set3?: SetScore,
  annulled?: boolean
): PlayoffBracket {
  const newRounds = JSON.parse(JSON.stringify(bracket.rounds)) as PlayoffRound[];
  
  // Find which round and match indexing we are in
  let roundIdx = -1;
  let matchIdx = -1;

  for (let r = 0; r < newRounds.length; r++) {
    const mIdx = newRounds[r].matches.findIndex(m => m.id === matchId);
    if (mIdx !== -1) {
      roundIdx = r;
      matchIdx = mIdx;
      // Update winner of this specific match
      newRounds[r].matches[mIdx].winnerId = winnerId;
      newRounds[r].matches[mIdx].played = winnerId !== null || !!annulled;
      newRounds[r].matches[mIdx].annulled = !!annulled;
      if (set1) newRounds[r].matches[mIdx].set1 = set1;
      if (set2) newRounds[r].matches[mIdx].set2 = set2;
      if (set3) newRounds[r].matches[mIdx].set3 = set3;
      break;
    }
  }

  if (roundIdx === -1 || matchIdx === -1) return { rounds: newRounds };

  // If there is a next round (e.g. current round is not the Final which is the last item in rounds)
  const nextRoundIdx = roundIdx + 1;
  if (nextRoundIdx < newRounds.length) {
    const currentRound = newRounds[roundIdx];
    const { nextMatchIdx, isTeamA } = getNextMatchSlot(
      currentRound.name,
      currentRound.matches.length,
      matchIdx
    );

    if (isTeamA) {
      newRounds[nextRoundIdx].matches[nextMatchIdx].teamAId = winnerId || '';
    } else {
      newRounds[nextRoundIdx].matches[nextMatchIdx].teamBId = winnerId || '';
    }

    // Also clear subsequent matches' winner state if previous winner changes
    const propagateClear = (currRIdx: number, currMIdx: number) => {
      const nextR = currRIdx + 1;
      if (nextR < newRounds.length) {
        const nextRoundConfig = newRounds[currRIdx];
        const { nextMatchIdx: nextM } = getNextMatchSlot(
          nextRoundConfig.name,
          nextRoundConfig.matches.length,
          currMIdx
        );
        
        // Reset results in future rounds
        newRounds[nextR].matches[nextM].played = false;
        newRounds[nextR].matches[nextM].winnerId = null;
        newRounds[nextR].matches[nextM].set1 = { teamA: 0, teamB: 0 };
        newRounds[nextR].matches[nextM].set2 = { teamA: 0, teamB: 0 };
        newRounds[nextR].matches[nextM].set3 = { teamA: 0, teamB: 0 };

        propagateClear(nextR, nextM);
      }
    };

    propagateClear(roundIdx, matchIdx);
  }

  return { rounds: newRounds };
}
