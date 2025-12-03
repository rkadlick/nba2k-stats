"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Season, Team } from "@/lib/types";
import { getSeasonFromDate } from "@/lib/helpers/dateUtils";

interface BasicInfoSectionProps {
  seasons: Season[];
  teams: Team[];
  playerTeam: Team | undefined;
  manualSeasonBlocked: boolean;
  manualSeasonMessage: string | null;
}

export function BasicInfoSection({
  seasons,
  teams,
  playerTeam,
  manualSeasonBlocked,
  manualSeasonMessage,
}: BasicInfoSectionProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const playerScore = watch("player_score");
  const opponentScore = watch("opponent_score");
  const isWin = playerScore > opponentScore;
  const seasonId = watch("season_id");

  const selectedSeason = seasons.find((s) => s.id === seasonId);
  const seasonDisplay = selectedSeason
    ? `${selectedSeason.year_start}–${selectedSeason.year_end}`
    : "";

  // Auto-update season based on date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const season = getSeasonFromDate(newDate, seasons);
    if (season) setValue("season_id", season);
  };

  return (
    <section className="grid grid-cols-2 gap-4">
      {manualSeasonBlocked && (
        <div className="col-span-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{manualSeasonMessage}</p>
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Game Date *
        </label>
        <input
          type="date"
          {...register("game_date", {
            required: "Game date is required",
            onChange: handleDateChange,
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.game_date && (
          <p className="text-xs text-red-600">
            {errors.game_date.message as string}
          </p>
        )}
      </div>

      {/* Season Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Season *
        </label>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold">
          {seasonDisplay || "Select a date"}
        </div>
      </div>

      {/* Opponent */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opponent Team *
        </label>
        <select
          {...register("opponent_team_id", {
            required: "Opponent team is required",
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="" disabled>
            Select...
          </option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        {errors.opponent_team_id && (
          <p className="text-xs text-red-600">
            {errors.opponent_team_id.message as string}
          </p>
        )}
      </div>

      {/* Home/Away */}
      <div className="flex items-center gap-2 mt-6">
        <input
          type="checkbox"
          {...register("is_home")}
          id="homegame"
          className="rounded border-gray-300"
        />
        <label htmlFor="homegame" className="text-sm font-medium text-gray-700">
          Home Game
        </label>
      </div>

      {/* Scores */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {playerTeam?.name || "Your Team"} Score *
        </label>
        <input
          type="number"
          {...register("player_score", {
            valueAsNumber: true,
            required: "Player score required",
            min: { value: 0, message: "≥ 0" },
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.player_score && (
          <p className="text-xs text-red-600">
            {errors.player_score.message as string}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {(() => {
            const oppTeam = teams.find(
              (t) => t.id === watch("opponent_team_id")
            );
            return oppTeam?.name || "Opponent";
          })()}{" "}
          Score *
        </label>
        <input
          type="number"
          {...register("opponent_score", {
            valueAsNumber: true,
            required: "Opponent score required",
            min: { value: 0, message: "≥ 0" },
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.opponent_score && (
          <p className="text-xs text-red-600">
            {errors.opponent_score.message as string}
          </p>
        )}
      </div>

      {/* Result Indicator */}
      <div className="col-span-2 flex items-center justify-between mt-2">
        <div className="text-sm font-medium text-gray-700">
          Result:{" "}
          <span
            className={
              isWin ? "text-green-600 font-bold" : "text-red-600 font-bold"
            }
          >
            {isWin ? "Win" : "Loss"}
          </span>
        </div>

        {/* Key + Playoff flags */}
        <div className="flex items-center gap-8">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("is_key_game")}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Key Game</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("is_playoff_game")}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Playoff Game
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
