"use client";

import { useState, type ReactNode } from "react";
import {
  PlayerWithTeam,
  PlayerGameStatsWithDetails,
  Award,
  Season,
  User,
} from "@/lib/types";
import { getDisplayPlayerName } from "@/lib/playerNameUtils";
import { getTeamColor } from "@/lib/teams";
import { AWARDS_MASTER_LIST } from "@/lib/constants";
import { useComparisonData, type ComparisonData } from "@/hooks/data/useComparisonData";
import {
  useCareerPlayoffData,
  PLAYOFF_ROUND_OPTIONS,
  type PlayoffRoundFilter,
  type TeamPlayoffRecord,
} from "@/hooks/data/useCareerPlayoffData";
import { getSeasonTotals } from "@/lib/statHelpers";

interface ComparisonViewProps {
  players: PlayerWithTeam[];
  player1Stats: PlayerGameStatsWithDetails[];
  player2Stats: PlayerGameStatsWithDetails[];
  player1Awards: Award[];
  player2Awards: Award[];
  seasons: Season[];
  currentUser: User | null;
}

type ComparisonSection = "overview" | "career-highs" | "seasons" | "awards" | "milestones" | "playoffs";

const STAT_LABELS: Record<string, string> = {
  games_played: "GP",
  games_started: "GS",
  minutes: "MIN",
  points: "PTS",
  rebounds: "REB",
  assists: "AST",
  steals: "STL",
  blocks: "BLK",
  offensive_rebounds: "OR",
  turnovers: "TO",
  fouls: "PF",
  plus_minus: "+/-",
  fg: "FG",
  threes: "3PT",
  ft: "FT",
  double_doubles: "DD",
  triple_doubles: "TD",
};

function getTotalValue(totals: Record<string, number>, key: string): string {
  if (key === "double_doubles" || key === "triple_doubles") {
    return (totals[key] ?? 0).toString();
  }
  if (key === "fg") {
    const made = totals.fg_made ?? 0;
    const attempted = totals.fg_attempted ?? 0;
    return attempted > 0 ? `${made}/${attempted}` : "–";
  }
  if (key === "threes") {
    const made = totals.threes_made ?? 0;
    const attempted = totals.threes_attempted ?? 0;
    return attempted > 0 ? `${made}/${attempted}` : "–";
  }
  if (key === "ft") {
    const made = totals.ft_made ?? 0;
    const attempted = totals.ft_attempted ?? 0;
    return attempted > 0 ? `${made}/${attempted}` : "–";
  }
  const value = totals[key];
  if (value !== undefined && value !== null) {
    return typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 1) : String(value);
  }
  return "–";
}

function getAvgValue(
  totals: Record<string, number>,
  averages: Record<string, number>,
  gamesPlayed: number,
  key: string
): string {
  if (["games_played", "games_started", "double_doubles", "triple_doubles"].includes(key)) {
    return "–";
  }
  if (key === "fg") {
    const made = totals.fg_made ?? 0;
    const attempted = totals.fg_attempted ?? 0;
    return attempted > 0 ? (made / attempted).toFixed(3) : "–";
  }
  if (key === "threes") {
    const made = totals.threes_made ?? 0;
    const attempted = totals.threes_attempted ?? 0;
    return attempted > 0 ? (made / attempted).toFixed(3) : "–";
  }
  if (key === "ft") {
    const made = totals.ft_made ?? 0;
    const attempted = totals.ft_attempted ?? 0;
    return attempted > 0 ? (made / attempted).toFixed(3) : "–";
  }
  const value = averages[key];
  return value !== undefined && typeof value === "number" ? value.toFixed(1) : "–";
}

function SectionSwitcher({
  viewMode,
  onChange,
}: {
  viewMode: ComparisonSection;
  onChange: (m: ComparisonSection) => void;
}) {
  const options: { label: string; value: ComparisonSection }[] = [
    { label: "Career Stats", value: "overview" },
    { label: "Career Highs", value: "career-highs" },
    { label: "Seasons", value: "seasons" },
    { label: "Playoffs", value: "playoffs" },
    { label: "Awards", value: "awards" },
    { label: "Milestones", value: "milestones" },
  ];

  return (
    <div className="mb-2 text-xs sm:text-sm">
      <span className="font-bold text-gray-900">View:</span>{" "}
      {options.map((opt, i) => (
        <span key={opt.value}>
          <button
            onClick={() => onChange(opt.value)}
            className={
              viewMode === opt.value
                ? "text-blue-600 font-semibold underline"
                : "text-blue-500 hover:text-blue-700 cursor-pointer"
            }
          >
            {opt.label}
          </button>
          {i < options.length - 1 && <span className="text-gray-400 mx-1">•</span>}
        </span>
      ))}
    </div>
  );
}

function parseComparable(value: ReactNode): number | null {
  if (value === undefined || value === null || typeof value === "object") return null;
  if (typeof value === "number") return value;
  const n = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
}

const valueCellBase = "text-base sm:text-lg md:text-xl lg:text-2xl";
const valueCellNarrow = "max-w-[10rem] sm:max-w-[14rem] md:max-w-[18rem]";
const valueCellWide = "max-w-[16rem] sm:max-w-[22rem] md:max-w-[28rem] lg:max-w-[32rem]";
const labelCellNarrow = "max-w-[6rem] sm:max-w-[8rem] md:max-w-[10rem]";
const labelCellWide = "max-w-[10rem] sm:max-w-[14rem] md:max-w-[18rem]";
const labelCellWider = "max-w-[12rem] sm:max-w-[16rem] md:max-w-[22rem] lg:max-w-[26rem]";

function renderValueWithSmallSuffix(
  value: ReactNode,
  smallSuffix: boolean
): ReactNode {
  if (!smallSuffix || typeof value !== "string") return value;
  const match = value.match(/^(.*?)\s*(\([^)]+\))$/);
  if (!match) return value;
  return (
    <>
      {match[1]}
      <span className="text-sm sm:text-base text-gray-500"> {match[2]}</span>
    </>
  );
}

function ComparisonRow({
  value1,
  label,
  value2,
  highlightWinner = true,
  lowerIsBetter = false,
  wide = false,
  smallLabelInValue = false,
  smallLabel = false,
  wideCenter = false,
  subValue1,
  subValue2,
  subValueVertical = false,
}: {
  value1: ReactNode;
  label: ReactNode;
  value2: ReactNode;
  highlightWinner?: boolean;
  lowerIsBetter?: boolean;
  wide?: boolean;
  smallLabelInValue?: boolean;
  smallLabel?: boolean;
  wideCenter?: boolean;
  subValue1?: ReactNode;
  subValue2?: ReactNode;
  subValueVertical?: boolean;
}) {
  const n1 = parseComparable(value1);
  const n2 = parseComparable(value2);
  const p1Wins = highlightWinner && n1 !== null && n2 !== null && (lowerIsBetter ? n1 < n2 : n1 > n2);
  const p2Wins = highlightWinner && n1 !== null && n2 !== null && (lowerIsBetter ? n2 < n1 : n2 > n1);

  const valueMax = wide ? valueCellWide : valueCellNarrow;
  const labelMax = wideCenter ? labelCellWider : wide ? labelCellWide : labelCellNarrow;
  const labelSize = smallLabel ? "text-sm sm:text-base text-gray-500" : valueCellBase;

  const renderCellWithSub = (value: ReactNode, subValue: ReactNode | undefined, alignRight: boolean, flipOrder: boolean) => {
    const main = <span>{renderValueWithSmallSuffix(value, smallLabelInValue)}</span>;
    const sub = subValue != null && subValue !== "" ? (
      <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{subValue}</span>
    ) : null;
    const content = subValueVertical ? (
      <>{main}{sub && <>{sub}</>}</>
    ) : flipOrder ? (sub && <>{sub}{main}</>) || main : <>{main}{sub}</>;
    const flexClass = subValueVertical
      ? `flex flex-col gap-0.5 w-full items-baseline ${alignRight ? "items-end" : "items-start"}`
      : `flex flex-row flex-wrap w-full items-baseline gap-x-2 gap-y-3 ${alignRight ? "justify-end" : "justify-start"}`;
    return (
      <div className={flexClass}>
        {content}
      </div>
    );
  };

  return (
    <tr>
      <td className={`text-right px-4 py-1.5 sm:px-5 sm:py-2 ${valueCellBase} break-words ${valueMax} ${p1Wins ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
        {subValue1 != null ? renderCellWithSub(value1, subValue1, true, subValueVertical ? false : true) : renderValueWithSmallSuffix(value1, smallLabelInValue)}
      </td>
      <td className={`text-center px-5 py-1.5 sm:px-6 sm:py-2 ${labelSize} font-medium text-gray-700 break-words ${labelMax}`}>
        {label}
      </td>
      <td className={`text-left px-4 py-1.5 sm:px-5 sm:py-2 ${valueCellBase} break-words ${valueMax} ${p2Wins ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
        {subValue2 != null ? renderCellWithSub(value2, subValue2, false, false) : renderValueWithSmallSuffix(value2, smallLabelInValue)}
      </td>
    </tr>
  );
}

export default function ComparisonView({
  players,
  player1Stats,
  player2Stats,
  player1Awards,
  player2Awards,
  seasons,
  currentUser,
}: ComparisonViewProps) {
  const [viewMode, setViewMode] = useState<ComparisonSection>("overview");

  const player1 = players[0];
  const player2 = players[1];

  const { data, loading } = useComparisonData(
    player1,
    player2,
    player1Stats,
    player2Stats,
    player1Awards,
    player2Awards,
    seasons
  );

  if (players.length < 2) {
    return (
      <div className="text-center py-16 text-gray-600">
        Add at least two players to compare.
      </div>
    );
  }

  const primaryColor1 = player1.team?.colors.primary || getTeamColor(player1.team_id ?? "") || "#6B7280";
  const primaryColor2 = player2.team?.colors.primary || getTeamColor(player2.team_id ?? "") || "#6B7280";
  const secondaryColor1 = player1.team?.colors.secondary || "#9CA3AF";
  const secondaryColor2 = player2.team?.colors.secondary || "#9CA3AF";

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header - Compact split design */}
      <div
        className="px-5 py-4 sm:px-6 sm:py-5 text-white relative grid grid-cols-2 gap-4"
        style={{
          background: `linear-gradient(90deg, ${primaryColor1} 0%, ${primaryColor1} 50%, ${primaryColor2} 50%, ${primaryColor2} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-sm sm:text-base md:text-lg font-bold">{getDisplayPlayerName(player1, currentUser)}</h2>
          {player1.team && <p className="text-xs opacity-90">{player1.team.fullName}</p>}
        </div>
        <div className="relative z-10 text-right">
          <h2 className="text-sm sm:text-base md:text-lg font-bold">{getDisplayPlayerName(player2, currentUser)}</h2>
          {player2.team && <p className="text-xs opacity-90">{player2.team.fullName}</p>}
        </div>
      </div>

      {/* VS badge */}
      <div className="flex justify-center -mt-2.5 relative z-20">
        <span className="px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded-full">
          VS
        </span>
      </div>

      {/* Section selector */}
      <div className="px-5 py-3 sm:px-6 sm:py-4">
        <SectionSwitcher viewMode={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : data ? (
          <>
            {viewMode === "overview" && (
              <OverviewSection data={data} player1={player1} player2={player2} currentUser={currentUser} />
            )}
            {viewMode === "career-highs" && (
              <CareerHighsSection data={data} player1={player1} player2={player2} currentUser={currentUser} />
            )}
            {viewMode === "seasons" && (
              <SeasonsSection data={data} player1={player1} player2={player2} seasons={seasons} currentUser={currentUser} />
            )}
            {viewMode === "playoffs" && (
              <PlayoffsSection
                player1={player1}
                player2={player2}
                player1Stats={player1Stats}
                player2Stats={player2Stats}
                currentUser={currentUser}
              />
            )}
            {viewMode === "awards" && (
              <AwardsSection data={data} player1={player1} player2={player2} seasons={seasons} currentUser={currentUser} />
            )}
            {viewMode === "milestones" && (
              <MilestonesSection data={data} player1={player1} player2={player2} currentUser={currentUser} />
            )}
          </>
        ) : (
          <div className="text-center py-12 sm:py-16 text-gray-500 text-sm sm:text-base">No comparison data available.</div>
        )}
      </div>
    </div>
  );
}

const CAREER_HIGH_LABELS: Record<string, string> = {
  points: "PTS",
  rebounds: "REB",
  assists: "AST",
  steals: "STL",
  blocks: "BLK",
  minutes: "MIN",
  fg_made: "FG Made",
  threes_made: "3PT Made",
  ft_made: "FT Made",
};

function ComparisonTable({
  children,
  centerHeader,
  leftColor,
  rightColor,
  wideCenter = false,
  centerTable = false,
  wide = false,
}: {
  children: React.ReactNode;
  centerHeader: string;
  leftColor: string;
  rightColor: string;
  wideCenter?: boolean;
  centerTable?: boolean;
  wide?: boolean;
}) {
  const headerSize = "text-base sm:text-lg md:text-xl";
  const headerPad = "px-4 py-1.5 sm:px-5 sm:py-2";
  const centerMax = wideCenter ? labelCellWider : "";

  return (
    <div className={`flex justify-center w-full px-4 sm:px-6 md:px-8 ${centerTable ? "min-w-0" : ""}`}>
      <div className={centerTable ? "w-full max-w-4xl mx-auto" : wide ? "w-fit max-w-6xl min-w-0" : "w-fit max-w-full min-w-0"}>
        <table className={`border-collapse ${centerTable ? "w-full table-fixed" : "w-auto"}`}>
          {centerTable && (
            <colgroup>
              <col className="w-1/4" />
              <col className="w-1/2" />
              <col className="w-1/4" />
            </colgroup>
          )}
          <thead>
            <tr>
              <th
                className={`text-right ${headerPad} ${headerSize} font-medium text-gray-500`}
                style={{ borderTop: `3px solid ${leftColor}` }}
              />
              <th className={`text-center ${headerPad} ${headerSize} font-medium text-gray-500 ${centerMax}`}>
                {centerHeader}
              </th>
              <th
                className={`text-left ${headerPad} ${headerSize} font-medium text-gray-500`}
                style={{ borderTop: `3px solid ${rightColor}` }}
              />
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function OverviewSection({
  data,
  player1,
  player2,
  currentUser,
}: {
  data: ComparisonData;
  player1: PlayerWithTeam;
  player2: PlayerWithTeam;
  currentUser: User | null;
}) {
  const { player1CareerTotals, player2CareerTotals, seasonTotalsKeys } = data;

  if (!player1CareerTotals || !player2CareerTotals) {
    return (
      <div className="text-center py-12 sm:py-16 text-gray-500 text-sm sm:text-base">
        No career totals available. Add season totals for both players.
      </div>
    );
  }

  const totalKeys = ["games_played", "double_doubles", "triple_doubles"];
  const lowerIsBetterKeys = ["turnovers", "fouls"];
  const avgKeys = seasonTotalsKeys.filter(
    (k) =>
      !totalKeys.includes(k) &&
      k !== "games_started" &&
      (player1CareerTotals.totals[k] !== undefined || player2CareerTotals.totals[k] !== undefined)
  );

  const primaryColor1 = player1.team?.colors.primary || getTeamColor(player1.team_id ?? "") || "#6B7280";
  const primaryColor2 = player2.team?.colors.primary || getTeamColor(player2.team_id ?? "") || "#6B7280";

  return (
    <ComparisonTable
      centerHeader="Stat"
      leftColor={primaryColor1}
      rightColor={primaryColor2}
      wide
    >
      {totalKeys.map((key) => {
        const label = STAT_LABELS[key] || key.replace(/_/g, " ").toUpperCase();
        return (
          <ComparisonRow
            key={key}
            value1={getTotalValue(player1CareerTotals.totals, key)}
            label={label}
            value2={getTotalValue(player2CareerTotals.totals, key)}
            lowerIsBetter={lowerIsBetterKeys.includes(key)}
            smallLabel
          />
        );
      })}
      {avgKeys.map((key) => {
        const label = STAT_LABELS[key] || key.replace(/_/g, " ").toUpperCase();
        const total1 = getTotalValue(player1CareerTotals.totals, key);
        const total2 = getTotalValue(player2CareerTotals.totals, key);
        return (
          <ComparisonRow
            key={key}
            value1={getAvgValue(
              player1CareerTotals.totals,
              player1CareerTotals.averages,
              player1CareerTotals.gamesPlayed,
              key
            )}
            label={label}
            value2={getAvgValue(
              player2CareerTotals.totals,
              player2CareerTotals.averages,
              player2CareerTotals.gamesPlayed,
              key
            )}
            lowerIsBetter={lowerIsBetterKeys.includes(key)}
            subValue1={total1 !== "–" ? total1 : undefined}
            subValue2={total2 !== "–" ? total2 : undefined}
            wide
            smallLabel
          />
        );
      })}
    </ComparisonTable>
  );
}

function CareerHighsSection({
  data,
  player1,
  player2,
  currentUser,
}: {
  data: ComparisonData;
  player1: PlayerWithTeam;
  player2: PlayerWithTeam;
  currentUser: User | null;
}) {
  const { player1CareerHighs, player2CareerHighs } = data;

  const keys = [
    "points",
    "rebounds",
    "assists",
    "steals",
    "blocks",
    "minutes",
    "fg_made",
    "threes_made",
    "ft_made",
  ] as const;

  const hasAny =
    keys.some((k) => (player1CareerHighs[k] ?? 0) > 0) ||
    keys.some((k) => (player2CareerHighs[k] ?? 0) > 0);

  if (!hasAny) {
    return (
      <div className="text-center py-12 sm:py-16 text-gray-500 text-sm sm:text-base">
        No career highs recorded. Add games to see single-game highs.
      </div>
    );
  }

  const primaryColor1 = player1.team?.colors.primary || getTeamColor(player1.team_id ?? "") || "#6B7280";
  const primaryColor2 = player2.team?.colors.primary || getTeamColor(player2.team_id ?? "") || "#6B7280";

  return (
    <ComparisonTable
      centerHeader="Career High"
      leftColor={primaryColor1}
      rightColor={primaryColor2}
    >
      {keys
        .filter(
          (k) => (player1CareerHighs[k] ?? 0) > 0 || (player2CareerHighs[k] ?? 0) > 0
        )
        .map((key) => (
          <ComparisonRow
            key={key}
            value1={(player1CareerHighs[key] ?? 0) > 0 ? player1CareerHighs[key] : "–"}
            label={CAREER_HIGH_LABELS[key] || key.replace(/_/g, " ")}
            value2={(player2CareerHighs[key] ?? 0) > 0 ? player2CareerHighs[key] : "–"}
            smallLabel
          />
        ))}
    </ComparisonTable>
  );
}

function shortSeasonLabel(yearStart: number, yearEnd: number): string {
  const s = String(yearStart).slice(-2);
  const e = String(yearEnd).slice(-2);
  return `${s}-${e}`;
}

function SeasonsSection({
  data,
  player1,
  player2,
  seasons,
  currentUser,
}: {
  data: ComparisonData;
  player1: PlayerWithTeam;
  player2: PlayerWithTeam;
  seasons: Season[];
  currentUser: User | null;
}) {
  const { player1BestSeasons, player2BestSeasons, player1SeasonTotals, player2SeasonTotals } = data;

  const allStats = new Set([
    ...player1BestSeasons.map((b) => b.stat),
    ...player2BestSeasons.map((b) => b.stat),
  ]);

  const allSeasonIds = new Set([
    ...player1SeasonTotals.map((st) => st.season_id),
    ...player2SeasonTotals.map((st) => st.season_id),
  ]);
  const sortedSeasons = seasons
    .filter((s) => allSeasonIds.has(s.id))
    .sort((a, b) => b.year_end - a.year_end);

  const hasAny = allStats.size > 0 || sortedSeasons.length > 0;

  if (!hasAny) {
    return (
      <div className="text-center py-12 sm:py-16 text-gray-500 text-sm sm:text-base">
        No season data. Add season totals for both players.
      </div>
    );
  }

  const primaryColor1 = player1.team?.colors.primary || getTeamColor(player1.team_id ?? "") || "#6B7280";
  const primaryColor2 = player2.team?.colors.primary || getTeamColor(player2.team_id ?? "") || "#6B7280";

  const getSeasonStats = (totals: typeof player1SeasonTotals, seasonId: string) => {
    const st = totals.find((t) => t.season_id === seasonId);
    if (!st) return { avg: "–", total: undefined };
    const ppg = (st.avg_points ?? 0).toFixed(1);
    const rpg = (st.avg_rebounds ?? 0).toFixed(1);
    const apg = (st.avg_assists ?? 0).toFixed(1);
    const spg = (st.avg_steals ?? 0).toFixed(1);
    const bpg = (st.avg_blocks ?? 0).toFixed(1);
    const pts = st.total_points ?? 0;
    const reb = st.total_rebounds ?? 0;
    const ast = st.total_assists ?? 0;
    const stl = st.total_steals ?? 0;
    const blk = st.total_blocks ?? 0;
    const total = `${pts} PTS · ${reb} REB · ${ast} AST · ${stl} STL · ${blk} BLK`;
    return { avg: `${ppg} / ${rpg} / ${apg} / ${spg} / ${bpg}`, total };
  };

  return (
    <ComparisonTable
      centerHeader="Best Seasons"
      leftColor={primaryColor1}
      rightColor={primaryColor2}
    >
      {Array.from(allStats).map((stat) => {
        const p1 = player1BestSeasons.find((b) => b.stat === stat);
        const p2 = player2BestSeasons.find((b) => b.stat === stat);
        const season1 = p1 ? seasons.find((s) => s.id === p1.seasonId) : null;
        const season2 = p2 ? seasons.find((s) => s.id === p2.seasonId) : null;
        const label1 = season1 ? shortSeasonLabel(season1.year_start, season1.year_end) : "";
        const label2 = season2 ? shortSeasonLabel(season2.year_start, season2.year_end) : "";
        const v1 = p1 ? `${p1.value} (${label1})` : "–";
        const v2 = p2 ? `${p2.value} (${label2})` : "–";
        return (
          <ComparisonRow key={stat} value1={v1} label={stat} value2={v2} wide smallLabelInValue />
        );
      })}
      {sortedSeasons.length > 0 && (
        <>
          <tr>
            <td colSpan={3} className="px-4 py-3 border-t-2 border-gray-300" />
          </tr>
          {sortedSeasons.map((season) => {
            const shortLabel = shortSeasonLabel(season.year_start, season.year_end);
            const s1 = getSeasonStats(player1SeasonTotals, season.id);
            const s2 = getSeasonStats(player2SeasonTotals, season.id);
            return (
              <ComparisonRow
                key={season.id}
                value1={s1.avg}
                label={shortLabel}
                value2={s2.avg}
                subValue1={s1.total}
                subValue2={s2.total}
                subValueVertical
                wide
                highlightWinner={false}
                smallLabel
              />
            );
          })}
        </>
      )}
    </ComparisonTable>
  );
}

function AwardsSection({
  data,
  player1,
  player2,
  seasons,
  currentUser,
}: {
  data: ComparisonData;
  player1: PlayerWithTeam;
  player2: PlayerWithTeam;
  seasons: Season[];
  currentUser: User | null;
}) {
  const { player1AwardsWon, player2AwardsWon } = data;

  const grouped1: Record<string, number[]> = {};
  player1AwardsWon.forEach((a) => {
    const season = seasons.find((s) => s.id === a.season_id);
    const year = season?.year_end ?? 0;
    if (!grouped1[a.award_name]) grouped1[a.award_name] = [];
    grouped1[a.award_name].push(year);
  });

  const grouped2: Record<string, number[]> = {};
  player2AwardsWon.forEach((a) => {
    const season = seasons.find((s) => s.id === a.season_id);
    const year = season?.year_end ?? 0;
    if (!grouped2[a.award_name]) grouped2[a.award_name] = [];
    grouped2[a.award_name].push(year);
  });

  const allAwardNames = new Set([...Object.keys(grouped1), ...Object.keys(grouped2)]);
  const orderedAwards = [
    ...AWARDS_MASTER_LIST.filter((a) => allAwardNames.has(a.name)).map((a) => a.name),
    ...Array.from(allAwardNames).filter((n) => !AWARDS_MASTER_LIST.some((a) => a.name === n)).sort(),
  ];

  if (orderedAwards.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 text-gray-500 text-sm sm:text-base">
        No awards recorded for either player.
      </div>
    );
  }

  const primaryColor1 = player1.team?.colors.primary || getTeamColor(player1.team_id ?? "") || "#6B7280";
  const primaryColor2 = player2.team?.colors.primary || getTeamColor(player2.team_id ?? "") || "#6B7280";

  const formatAwardValue = (years: number[]): { count: string; years: string } => {
    const sorted = [...years].sort((a, b) => a - b);
    const shortYears = sorted.map((y) => `${String(y - 1).slice(-2)}-${String(y).slice(-2)}`);
    const count = years.length > 1 ? `${years.length}×` : "";
    const yearsStr = `(${shortYears.join(", ")})`;
    return { count, years: yearsStr };
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <ComparisonTable
        centerHeader="Award"
        leftColor={primaryColor1}
        rightColor={primaryColor2}
        wideCenter
        centerTable
      >
      {orderedAwards.map((name) => {
        const v1 = grouped1[name] ? formatAwardValue(grouped1[name]) : null;
        const v2 = grouped2[name] ? formatAwardValue(grouped2[name]) : null;
        return (
          <tr key={name}>
            <td className="text-right px-4 py-1.5 sm:px-5 sm:py-2 font-medium text-gray-600 align-middle">
              <div className="flex flex-row items-center justify-end gap-2">
                <span className="text-xs sm:text-sm text-gray-500">{v1 ? v1.years : "–"}</span>
                {v1?.count && <span className="text-lg sm:text-xl md:text-2xl font-semibold">{v1.count}</span>}
              </div>
            </td>
            <td className="text-center px-5 py-1.5 sm:px-6 sm:py-2 text-base sm:text-lg text-gray-700 font-medium align-middle max-w-[12rem] sm:max-w-[16rem] md:max-w-[22rem] lg:max-w-[26rem]">
              {name}
            </td>
            <td className="text-left px-4 py-1.5 sm:px-5 sm:py-2 font-medium text-gray-600 align-middle">
              <div className="flex flex-row items-center justify-start gap-2">
                {v2?.count && <span className="text-lg sm:text-xl md:text-2xl font-semibold">{v2.count}</span>}
                <span className="text-xs sm:text-sm text-gray-500">{v2 ? v2.years : "–"}</span>
              </div>
            </td>
          </tr>
        );
      })}
      </ComparisonTable>
    </div>
  );
}

function PlayoffsSection({
  player1,
  player2,
  player1Stats: allPlayer1Stats,
  player2Stats: allPlayer2Stats,
}: {
  player1: PlayerWithTeam;
  player2: PlayerWithTeam;
  player1Stats: PlayerGameStatsWithDetails[];
  player2Stats: PlayerGameStatsWithDetails[];
  currentUser: User | null;
}) {
  const [roundFilter, setRoundFilter] = useState<PlayoffRoundFilter>("all");

  const p1TeamId = player1.team?.id ?? player1.team_id;
  const p2TeamId = player2.team?.id ?? player2.team_id;

  const {
    gamesByRound: p1ByRound,
    recordsByRound: p1RecordsByRound,
    loading: l1,
  } = useCareerPlayoffData(player1.id, allPlayer1Stats, p1TeamId);

  const {
    gamesByRound: p2ByRound,
    recordsByRound: p2RecordsByRound,
    loading: l2,
  } = useCareerPlayoffData(player2.id, allPlayer2Stats, p2TeamId);

  const primaryColor1 = player1.team?.colors.primary || getTeamColor(player1.team_id ?? "") || "#6B7280";
  const primaryColor2 = player2.team?.colors.primary || getTeamColor(player2.team_id ?? "") || "#6B7280";

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const p1Games = p1ByRound[roundFilter];
  const p2Games = p2ByRound[roundFilter];

  const sumWL = (records: TeamPlayoffRecord[]) =>
    records.reduce(
      (acc, r) => ({ wins: acc.wins + r.wins, losses: acc.losses + r.losses }),
      { wins: 0, losses: 0 }
    );

  const p1WL = sumWL(p1RecordsByRound[roundFilter].recordsByTeam);
  const p2WL = sumWL(p2RecordsByRound[roundFilter].recordsByTeam);

  const p1Calc = getSeasonTotals(p1Games);
  const p2Calc = getSeasonTotals(p2Games);

  const formatAvg = (calc: ReturnType<typeof getSeasonTotals>, key: string): string => {
    if (calc.count === 0) return "–";
    const val = calc.averages[key];
    return val !== undefined ? val.toFixed(1) : "–";
  };

  const formatTotal = (calc: ReturnType<typeof getSeasonTotals>, key: string): string | undefined => {
    if (calc.count === 0) return undefined;
    const val = calc.totals[key];
    return val !== undefined ? String(Math.round(val)) : undefined;
  };

  const calcPct = (made: number, attempted: number): number | null =>
    attempted > 0 ? Number((made / attempted).toFixed(3)) : null;

  const p1FgPct = calcPct(p1Calc.totals.fg_made ?? 0, p1Calc.totals.fg_attempted ?? 0);
  const p2FgPct = calcPct(p2Calc.totals.fg_made ?? 0, p2Calc.totals.fg_attempted ?? 0);
  const p13Pct = calcPct(p1Calc.totals.threes_made ?? 0, p1Calc.totals.threes_attempted ?? 0);
  const p23Pct = calcPct(p2Calc.totals.threes_made ?? 0, p2Calc.totals.threes_attempted ?? 0);
  const p1FtPct = calcPct(p1Calc.totals.ft_made ?? 0, p1Calc.totals.ft_attempted ?? 0);
  const p2FtPct = calcPct(p2Calc.totals.ft_made ?? 0, p2Calc.totals.ft_attempted ?? 0);

  const hasFg = (p1Calc.totals.fg_attempted ?? 0) > 0 || (p2Calc.totals.fg_attempted ?? 0) > 0;
  const has3 = (p1Calc.totals.threes_attempted ?? 0) > 0 || (p2Calc.totals.threes_attempted ?? 0) > 0;
  const hasFt = (p1Calc.totals.ft_attempted ?? 0) > 0 || (p2Calc.totals.ft_attempted ?? 0) > 0;
  const hasDd = (p1Calc.totals.double_doubles ?? 0) > 0 || (p2Calc.totals.double_doubles ?? 0) > 0;
  const hasTd = (p1Calc.totals.triple_doubles ?? 0) > 0 || (p2Calc.totals.triple_doubles ?? 0) > 0;

  const hasAny =
    p1Games.length > 0 ||
    p2Games.length > 0 ||
    p1WL.wins + p1WL.losses > 0 ||
    p2WL.wins + p2WL.losses > 0;

  const roundLabel = PLAYOFF_ROUND_OPTIONS.find((o) => o.value === roundFilter)?.label ?? "Playoffs";

  const computeSeriesRecord = (records: TeamPlayoffRecord[]) => {
    let seriesW = 0;
    let seriesL = 0;
    records.forEach((r) => {
      r.seriesByYear.forEach((s) => {
        if (s.wins + s.losses === 0) return;
        if (s.wins > s.losses) seriesW++;
        else seriesL++;
      });
    });
    return { seriesW, seriesL };
  };

  const p1Series = computeSeriesRecord(p1RecordsByRound[roundFilter].recordsByTeam);
  const p2Series = computeSeriesRecord(p2RecordsByRound[roundFilter].recordsByTeam);

  const countingStats: { key: string; label: string; lowerIsBetter?: boolean }[] = [
    { key: "points", label: "PTS" },
    { key: "rebounds", label: "REB" },
    { key: "assists", label: "AST" },
    { key: "steals", label: "STL" },
    { key: "blocks", label: "BLK" },
    { key: "turnovers", label: "TO", lowerIsBetter: true },
    { key: "fouls", label: "PF", lowerIsBetter: true },
    { key: "plus_minus", label: "+/-" },
    { key: "minutes", label: "MIN" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Round filter */}
      <div className="flex flex-wrap gap-1">
        {PLAYOFF_ROUND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoundFilter(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roundFilter === opt.value
                ? "btn-primary"
                : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text)] hover:bg-[color:var(--color-border)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!hasAny ? (
        <div className="text-center py-12 text-gray-500 text-sm sm:text-base">
          No playoff data for either player{roundFilter !== "all" ? ` in ${roundLabel}` : ""}.
        </div>
      ) : (
        <ComparisonTable
          centerHeader={roundLabel}
          leftColor={primaryColor1}
          rightColor={primaryColor2}
          wide
        >
          {/* W-L record */}
          <ComparisonRow
            value1={p1WL.wins + p1WL.losses > 0 ? `${p1WL.wins}-${p1WL.losses}` : "–"}
            label={
              <span
                className="inline-flex items-center gap-1 cursor-help"
                title="Game W-L: total wins and losses from all recorded games and series data. The smaller figure is the series record — how many playoff series were won vs. lost."
              >
                W-L
                <span className="text-gray-400 text-[10px] leading-none">ⓘ</span>
              </span>
            }
            value2={p2WL.wins + p2WL.losses > 0 ? `${p2WL.wins}-${p2WL.losses}` : "–"}
            subValue1={
              p1Series.seriesW + p1Series.seriesL > 0
                ? `${p1Series.seriesW}-${p1Series.seriesL}`
                : undefined
            }
            subValue2={
              p2Series.seriesW + p2Series.seriesL > 0
                ? `${p2Series.seriesW}-${p2Series.seriesL}`
                : undefined
            }
            highlightWinner={false}
            smallLabel
          />
          {/* Games Recorded */}
          <ComparisonRow
            value1={p1Games.length > 0 ? p1Games.length : "–"}
            label={
              <span
                className="inline-flex items-center gap-1 cursor-help"
                title="Games with full stat lines recorded (excludes series where only the outcome is known)"
              >
                GR
                <span className="text-gray-400 text-[10px] leading-none">ⓘ</span>
              </span>
            }
            value2={p2Games.length > 0 ? p2Games.length : "–"}
            smallLabel
          />
          {/* Counting stats (per game avg, total as sub-value) */}
          {countingStats.map(({ key, label, lowerIsBetter }) => (
            <ComparisonRow
              key={key}
              value1={formatAvg(p1Calc, key)}
              label={label}
              value2={formatAvg(p2Calc, key)}
              lowerIsBetter={lowerIsBetter ?? false}
              subValue1={formatTotal(p1Calc, key)}
              subValue2={formatTotal(p2Calc, key)}
              wide
              smallLabel
            />
          ))}
          {/* FG% */}
          {hasFg && (
            <ComparisonRow
              value1={p1FgPct !== null ? p1FgPct.toFixed(3) : "–"}
              label="FG%"
              value2={p2FgPct !== null ? p2FgPct.toFixed(3) : "–"}
              subValue1={
                p1FgPct !== null
                  ? `${p1Calc.totals.fg_made ?? 0}/${p1Calc.totals.fg_attempted ?? 0}`
                  : undefined
              }
              subValue2={
                p2FgPct !== null
                  ? `${p2Calc.totals.fg_made ?? 0}/${p2Calc.totals.fg_attempted ?? 0}`
                  : undefined
              }
              wide
              smallLabel
            />
          )}
          {/* 3PT% */}
          {has3 && (
            <ComparisonRow
              value1={p13Pct !== null ? p13Pct.toFixed(3) : "–"}
              label="3PT%"
              value2={p23Pct !== null ? p23Pct.toFixed(3) : "–"}
              subValue1={
                p13Pct !== null
                  ? `${p1Calc.totals.threes_made ?? 0}/${p1Calc.totals.threes_attempted ?? 0}`
                  : undefined
              }
              subValue2={
                p23Pct !== null
                  ? `${p2Calc.totals.threes_made ?? 0}/${p2Calc.totals.threes_attempted ?? 0}`
                  : undefined
              }
              wide
              smallLabel
            />
          )}
          {/* FT% */}
          {hasFt && (
            <ComparisonRow
              value1={p1FtPct !== null ? p1FtPct.toFixed(3) : "–"}
              label="FT%"
              value2={p2FtPct !== null ? p2FtPct.toFixed(3) : "–"}
              subValue1={
                p1FtPct !== null
                  ? `${p1Calc.totals.ft_made ?? 0}/${p1Calc.totals.ft_attempted ?? 0}`
                  : undefined
              }
              subValue2={
                p2FtPct !== null
                  ? `${p2Calc.totals.ft_made ?? 0}/${p2Calc.totals.ft_attempted ?? 0}`
                  : undefined
              }
              wide
              smallLabel
            />
          )}
          {/* Double / Triple Doubles */}
          {hasDd && (
            <ComparisonRow
              value1={p1Calc.totals.double_doubles ?? 0}
              label="DD"
              value2={p2Calc.totals.double_doubles ?? 0}
              smallLabel
            />
          )}
          {hasTd && (
            <ComparisonRow
              value1={p1Calc.totals.triple_doubles ?? 0}
              label="TD"
              value2={p2Calc.totals.triple_doubles ?? 0}
              smallLabel
            />
          )}
        </ComparisonTable>
      )}
    </div>
  );
}

function MilestonesSection({
  data,
  player1,
  player2,
  currentUser,
}: {
  data: ComparisonData;
  player1: PlayerWithTeam;
  player2: PlayerWithTeam;
  currentUser: User | null;
}) {
  const { player1Milestones, player2Milestones } = data;

  const milestones = [
    { key: "quadDoubles", label: "Quad-Doubles" },
    { key: "fiveByFive", label: "5x5" },
    { key: "games40Plus", label: "40+ Point" },
    { key: "games50Plus", label: "50+ Point" },
    { key: "games60Plus", label: "60+ Point" },
    { key: "games70Plus", label: "70+ Point" },
    { key: "games20PlusReb", label: "20+ Rebound" },
    { key: "games15PlusReb", label: "15+ Rebound" },
    { key: "games15PlusAst", label: "15+ Assist" },
    { key: "games20PlusAst", label: "20+ Assist" },
    { key: "games30PlusAst", label: "30+ Assist" },
    { key: "games10PlusStl", label: "10+ Steal" },
    { key: "games15PlusStl", label: "15+ Steal" },
  ] as const;

  const primaryColor1 = player1.team?.colors.primary || getTeamColor(player1.team_id ?? "") || "#6B7280";
  const primaryColor2 = player2.team?.colors.primary || getTeamColor(player2.team_id ?? "") || "#6B7280";

  return (
    <ComparisonTable
      centerHeader="Milestone (Games)"
      leftColor={primaryColor1}
      rightColor={primaryColor2}
    >
      {milestones.map(({ key, label }) => (
        <ComparisonRow
          key={key}
          value1={player1Milestones[key]}
          label={label}
          value2={player2Milestones[key]}
          wideCenter
          smallLabel
        />
      ))}
    </ComparisonTable>
  );
}
