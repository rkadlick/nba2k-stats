"use client";

import { Award, Team } from "@/lib/types";
import TeamLogo from "../../../TeamLogo";
import {
  getTeamAbbreviation,
  getConferenceFromTeamId,
} from "@/lib/teams";

interface LeagueAwardsProps {
  awards: Award[];
  teams: Team[];
}

// Award type constants
export const ALL_NBA_TEAMS = [
  "1st Team All-NBA",
  "2nd Team All-NBA",
  "3rd Team All-NBA",
] as const;

export const ALL_DEFENSE_TEAMS = [
  "1st Team All-Defense",
  "2nd Team All-Defense",
] as const;

export const ALL_ROOKIE_TEAMS = [
  "1st Team All-Rookie",
  "2nd Team All-Rookie",
] as const;

export const ALL_STAR_AWARD = "All-Star" as const;

export const TEAM_BASED_AWARDS = [
  ...ALL_NBA_TEAMS,
  ...ALL_DEFENSE_TEAMS,
  ...ALL_ROOKIE_TEAMS,
  ALL_STAR_AWARD,
] as const;

const CONFERENCES = ["East", "West"] as const;

export default function LeagueAwards({ awards, teams }: LeagueAwardsProps) {
  // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  // Helper function to find team by ID or name
  const findTeam = (award: Award): Team | undefined => {
    if (award.winner_team_id) {
      return teams.find((t) => t.id === award.winner_team_id);
    }
    if (award.winner_team_name) {
      return teams.find(
        (t) =>
          t.name?.toLowerCase() === award.winner_team_name?.toLowerCase()
      );
    }
    return undefined;
  };

  // Helper function to get conference from team (by ID or name)
  const getConference = (award: Award): 'East' | 'West' | null => {
    const team = findTeam(award);

    // First try by team ID
    if (team?.id) {
      const conference = getConferenceFromTeamId(team.id);
      if (conference) return conference;
    }

    // Fallback: determine by team name
    if (team?.name) {
      const easternTeamNames = [
        'Boston Celtics', 'Brooklyn Nets', 'New York Knicks', 'Philadelphia 76ers', 'Toronto Raptors',
        'Chicago Bulls', 'Cleveland Cavaliers', 'Detroit Pistons', 'Indiana Pacers', 'Milwaukee Bucks',
        'Atlanta Hawks', 'Charlotte Hornets', 'Miami Heat', 'Orlando Magic', 'Washington Wizards',
      ];
      return easternTeamNames.includes(team.name) ? 'East' : 'West';
    }

    return null;
  };

  // Helper to check if an award is team-based
  const isTeamBasedAward = (awardName: string): boolean => {
    return (TEAM_BASED_AWARDS as readonly string[]).includes(awardName);
  };

  // Split awards into team-based and regular
  const teamBasedAwards = awards.filter((a) => isTeamBasedAward(a.award_name));
  const regularAwards = awards.filter((a) => !isTeamBasedAward(a.award_name));

  // Render a single award winner with team info
  const renderAwardWinner = (award: Award) => {
    const team = findTeam(award);
    const teamColor = team?.primary_color || "#374151";
    const abbrev = getTeamAbbreviation(team?.name);

    return (
      <div
        key={award.id}
        className="flex items-center justify-center gap-2 py-0.5"
      >
        <span>{award.winner_player_name}</span>
        {team && (
          <>
            <TeamLogo teamName={team.name} teamId={team.id} size={18} />
            <span style={{ color: teamColor }}>{abbrev}</span>
          </>
        )}
      </div>
    );
  };

  // Render regular (non-team-based) awards
  const renderRegularAwards = () => {
    if (regularAwards.length === 0) return null;

    return (
      <div className="flex flex-col">
        {regularAwards.map((award, index) => {
          const team = findTeam(award);
          const teamColor = team?.primary_color || "#374151";
          const winnerName = award.winner_player_name || "Unknown";

          return (
            <div key={award.id}>
              <div className="text-center py-2">
                <div className="text-base font-bold text-gray-900 mb-1">
                  {award.award_name}
                </div>
                <div className="text-sm text-gray-700 flex items-center justify-center gap-2">
                  {winnerName}
                  {team?.name && (
                    <>
                      <TeamLogo
                        teamName={team.name}
                        teamId={team.id}
                        size={20}
                      />
                      <span style={{ color: teamColor }}>{team.name}</span>
                    </>
                  )}
                </div>
              </div>
              {index < regularAwards.length - 1 && (
                <hr className="border-gray-300 my-2" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render All-NBA Teams
  const renderAllNBATeams = () => {
    const hasAllNBA = ALL_NBA_TEAMS.some((name) =>
      teamBasedAwards.some((a) => a.award_name === name)
    );

    if (!hasAllNBA) return null;

    return (
      <div>
        <div className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">
          All-NBA
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8 text-sm text-gray-700">
          {ALL_NBA_TEAMS.map((name, idx) => {
            const teamAwards = teamBasedAwards.filter(
              (a) => a.award_name === name
            );
            return (
              <div
                key={name}
                className={`text-center ${idx === 2 ? "md:col-span-2 xl:col-span-1" : ""}`}
              >
                <div className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                  {idx + 1}{getOrdinalSuffix(idx + 1)} Team
                </div>
                {teamAwards.map((award) => renderAwardWinner(award))}
              </div>
            );
          })}
        </div>
        <hr className="border-gray-300 my-4" />
      </div>
    );
  };

  // Render All-Defensive Teams
  const renderAllDefenseTeams = () => {
    const hasAllDefense = ALL_DEFENSE_TEAMS.some((name) =>
      teamBasedAwards.some((a) => a.award_name === name)
    );

    if (!hasAllDefense) return null;

    return (
      <div>
        <div className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">
          All-Defensive
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 text-sm text-gray-700">
          {ALL_DEFENSE_TEAMS.map((name, idx) => {
            const teamAwards = teamBasedAwards.filter(
              (a) => a.award_name === name
            );
            return (
              <div key={name} className="text-center">
                <div className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                  {idx + 1}{getOrdinalSuffix(idx + 1)} Team
                </div>
                {teamAwards.map((award) => renderAwardWinner(award))}
              </div>
            );
          })}
        </div>
        <hr className="border-gray-300 my-4" />
      </div>
    );
  };

  // Render All-Rookie Teams
  const renderAllRookieTeams = () => {
    const hasAllRookie = ALL_ROOKIE_TEAMS.some((name) =>
      teamBasedAwards.some((a) => a.award_name === name)
    );

    if (!hasAllRookie) return null;

    return (
      <div>
        <div className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">
          All-Rookie
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 text-sm text-gray-700">
          {ALL_ROOKIE_TEAMS.map((name, idx) => {
            const teamAwards = teamBasedAwards.filter(
              (a) => a.award_name === name
            );
            return (
              <div key={name} className="text-center">
                <div className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                  {idx + 1}{getOrdinalSuffix(idx + 1)} Team
                </div>
                {teamAwards.map((award) => renderAwardWinner(award))}
              </div>
            );
          })}
        </div>
        <hr className="border-gray-300 my-4" />
      </div>
    );
  };

  // Render All-Star Teams (fixed east/west logic)
  const renderAllStarTeams = () => {
    const allStarAwards = teamBasedAwards.filter(
      (a) => a.award_name === ALL_STAR_AWARD
    );

    if (allStarAwards.length === 0) return null;

    // Group All-Star awards by conference
    const eastAwards = allStarAwards.filter((award) => {
      const conference = getConference(award);
      return conference === "East";
    });

    const westAwards = allStarAwards.filter((award) => {
      const conference = getConference(award);
      return conference === "West";
    });

    return (
      <div>
        <div className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">
          All-Star
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-sm text-gray-700">
          {CONFERENCES.map((conf) => {
            const conferenceAwards =
              conf === "East" ? eastAwards : westAwards;
            return (
              <div key={conf} className="text-center">
                <div className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                  {conf}
                </div>
                {conferenceAwards.map((award) => renderAwardWinner(award))}
              </div>
            );
          })}
        </div>
        <hr className="border-gray-300 my-4" />
      </div>
    );
  };

  // Render team-based awards section
  const renderTeamBasedAwards = () => {
    if (teamBasedAwards.length === 0) return null;

    return (
      <div
        className={`space-y-8 ${regularAwards.length > 0 ? "pt-6 border-t border-gray-300" : ""}`}
      >
        {renderAllNBATeams()}
        {renderAllDefenseTeams()}
        {renderAllRookieTeams()}
        {renderAllStarTeams()}
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-0.5">
        League Awards
      </h3>
      {awards.length === 0 ? (
        <p className="text-xs text-gray-600">No awards recorded</p>
      ) : (
        <div className="flex flex-col mt-4">
          {renderRegularAwards()}
          {renderTeamBasedAwards()}
        </div>
      )}
    </div>
  );
}

