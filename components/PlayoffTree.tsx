'use client';

import { Season } from '@/lib/types';

interface PlayoffTreeProps {
  season: Season;
}

export default function PlayoffTree({ season }: PlayoffTreeProps) {
  const playoffTree = season.playoff_tree;

  if (!playoffTree) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
        No playoff data available for this season.
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Playoff Bracket ({season.year_start}–{season.year_end})
      </h3>
      <div className="space-y-4">
        {Object.entries(playoffTree).map(([round, matchups]) => {
          const matchupArray = Array.isArray(matchups) ? matchups : [];
          return (
          <div key={round} className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold text-purple-700 mb-2 capitalize">
              {round.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            {Array.isArray(matchups) ? (
              <div className="space-y-2 ml-4">
                {matchupArray.map((matchup: { team1?: string; team2?: string; winner?: string | null }, idx: number) => (
                  <div
                    key={idx}
                    className="text-sm bg-white p-2 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className={matchup.winner === matchup.team1 ? 'font-bold' : ''}>
                        {matchup.team1}
                      </span>
                      <span className="text-gray-400">vs</span>
                      <span className={matchup.winner === matchup.team2 ? 'font-bold' : ''}>
                        {matchup.team2}
                      </span>
                      {matchup.winner && (
                        <span className="ml-auto text-green-600 font-semibold">
                          ✓ {matchup.winner}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600 ml-4">
                {JSON.stringify(matchups, null, 2)}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

