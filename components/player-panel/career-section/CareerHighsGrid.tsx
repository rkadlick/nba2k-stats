import { CareerHigh } from '@/lib/types';
import { getTeamAbbreviation } from '@/lib/teams';

const CAREER_HIGHS_ORDER = [
  'points',
  'rebounds',
  'assists',
  'steals',
  'blocks',
  'fg_made',
  'threes_made',
  'ft_made',
  'minutes',
];

const DISPLAY_NAMES: Record<string, string> = {
  points: 'PTS',
  rebounds: 'REB',
  assists: 'AST',
  steals: 'STL',
  blocks: 'BLK',
  fg_made: 'FGM',
  threes_made: '3PM',
  ft_made: 'FTM',
  minutes: 'MIN',
};

function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
}

interface CareerHighsGridProps {
  title: string;
  careerHighs: CareerHigh[];
  primaryColor: string;
}

export default function CareerHighsGrid({ title, careerHighs, primaryColor }: CareerHighsGridProps) {
  if (careerHighs.length === 0) return null;

  const byKey = Object.fromEntries(careerHighs.map((ch) => [ch.stat_key, ch]));

  const ordered = CAREER_HIGHS_ORDER
    .filter((key) => byKey[key] !== undefined)
    .map((key) => {
      const ch = byKey[key];
      const opponent = ch.opponent_team_id
        ? getTeamAbbreviation(ch.opponent_team_id)
        : ch.opponent_team_name;
      const subtitle = ch.game_id && ch.game_date
        ? `vs ${opponent || '?'} · ${formatGameDate(ch.game_date)}`
        : ch.is_manual ? 'Manual' : undefined;

      return {
        key,
        label: DISPLAY_NAMES[key] || key.replace(/_/g, ' ').toUpperCase(),
        value: ch.value,
        subtitle,
      };
    });

  if (ordered.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {ordered.map(({ key, label, value, subtitle }) => (
          <div
            key={key}
            className="flex flex-col items-center text-center rounded-lg py-3 px-2 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {label}
            </div>
            <div
              className="text-3xl font-extrabold leading-tight tabular-nums mt-1"
              style={{ color: primaryColor }}
            >
              {value}
            </div>
            <div className="text-xs text-gray-500 mt-1.5">
              {subtitle || ' '}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
