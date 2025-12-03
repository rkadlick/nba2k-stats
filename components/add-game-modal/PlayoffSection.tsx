"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { PlayoffSeries, Player } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";

interface PlayoffSectionProps {
  seasonId: string;
  currentUserPlayer?: Player;
}

export function PlayoffSection({ seasonId, currentUserPlayer }: PlayoffSectionProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const isPlayoffGame = watch("is_playoff_game");
  const [playerSeries, setPlayerSeries] = useState<PlayoffSeries[]>([]);

  // only active when playoff checkbox is checked
  useEffect(() => {
    const loadSeries = async () => {
      if (
        !isPlayoffGame ||
        !currentUserPlayer?.id ||
        !currentUserPlayer.team_id ||
        !seasonId
      ) {
        setPlayerSeries([]);
        return;
      }

      try {
        const { data, error } = await supabase!
          .from("playoff_series")
          .select(
            "id, round_name, team1_name, team2_name, team1_id, team2_id, season_id, player_id"
          )
          .eq("season_id", seasonId)
          .eq("player_id", currentUserPlayer.id)
          .order("round_number");

        if (error) {
          logger.error("Error loading playoff series:", error);
          setPlayerSeries([]);
          return;
        }

        const filtered = (data || []).filter(
          (series) =>
            series.team1_id === currentUserPlayer.team_id ||
            series.team2_id === currentUserPlayer.team_id
        );

        setPlayerSeries(filtered as PlayoffSeries[]);
      } catch (err) {
        logger.error("Unexpected playoff series fetch error:", err);
        setPlayerSeries([]);
      }
    };

    loadSeries();
  }, [isPlayoffGame, seasonId, currentUserPlayer?.id, currentUserPlayer?.team_id]);

  if (!isPlayoffGame) return null;

  return (
    <section className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200 mt-3">
      {/* Series selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Playoff Series *
        </label>
        <select
          {...register("playoff_series_id", { required: "Choose a series" })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select series...</option>
          {playerSeries.map((series) => (
            <option key={series.id} value={series.id}>
              {`${series.round_name} — ${series.team1_name ?? ""} vs ${
                series.team2_name ?? ""
              }`}
            </option>
          ))}
        </select>
        {errors.playoff_series_id && (
          <p className="text-xs text-red-600">
            {errors.playoff_series_id.message as string}
          </p>
        )}
      </div>

      {/* Game number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Game Number (1–7)
        </label>
        <input
          type="number"
          min={1}
          max={7}
          {...register("playoff_game_number", {
            valueAsNumber: true,
            min: { value: 1, message: "≥ 1" },
            max: { value: 7, message: "≤ 7" },
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.playoff_game_number && (
          <p className="text-xs text-red-600">
            {errors.playoff_game_number.message as string}
          </p>
        )}
      </div>
    </section>
  );
}