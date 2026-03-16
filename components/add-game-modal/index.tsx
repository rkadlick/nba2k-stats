"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { Player, PlayerGameStatsWithDetails, Season, User } from "@/lib/types";
import { logger } from "@/lib/logger";
import { BasicInfoSection } from "./BasicInfoSection";
import { getSeasonFromDate } from "@/lib/helpers/dateUtils"; // ensure you use named export
import { PlayoffSection } from "./PlayoffSection";
import { StatsSection } from "./StatsSection";
import { ModalFooter } from "./ModalFooter";
import { useGameFormSubmit } from "@/hooks/ui/useGameFormSubmit";

export interface GameFormData {
  game_date: string;
  season_id: string;
  opponent_team_id: string;
  is_home?: boolean;
  player_score: number;
  opponent_score: number;
  is_overtime: boolean;
  is_simulated: boolean;
  is_key_game: boolean;
  is_cup_game: boolean;
  is_cup_championship: boolean;
  is_playoff_game: boolean;
  playoff_series_id?: string;
  playoff_game_number?: number;
  minutes?: number;
  points?: number;
  rebounds?: number;
  offensive_rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
  plus_minus?: number;
  fg_made?: number;
  fg_attempted?: number;
  threes_made?: number;
  threes_attempted?: number;
  ft_made?: number;
  ft_attempted?: number;
}

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  playerSeasons: Season[];
  allSeasons: Season[];
  onGameAdded: () => void;
  editingGame?: PlayerGameStatsWithDetails | null;
  currentUser: User | null;
  latestGameDate?: string | null;
}

export default function AddGameModal({
  isOpen,
  onClose,
  players,
  playerSeasons,
  allSeasons,
  onGameAdded,
  editingGame,
  currentUser,
  latestGameDate,
}: AddGameModalProps) {
  const buildDefaultValues = useCallback((): GameFormData => {
    // Local date helper (avoids UTC timezone shifting)
    const toLocalDateString = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const today = toLocalDateString(new Date());
    // latestGameDate from DB is already +1 day (save path adds 1), so use as-is for "next game" default
    // When no prior games, use today + 1
    const defaultDate = latestGameDate
      ? (() => {
          const dateOnly = latestGameDate.split("T")[0];
          const [y, m, day] = dateOnly.split("-").map(Number);
          return toLocalDateString(new Date(y, m - 1, day));
        })()
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          return toLocalDateString(d);
        })();

    const seasonId =
      getSeasonFromDate(defaultDate, allSeasons) ||
      allSeasons[0]?.id ||
      "";

    return {
      game_date: defaultDate,
      season_id: seasonId,
      opponent_team_id: "",
      is_home: undefined,
      player_score: 0,
      opponent_score: 0,
      is_key_game: false,
      is_playoff_game: false,
      is_overtime: false,
      is_simulated: false,
      is_cup_game: false,
      is_cup_championship: false,
      playoff_series_id: "",
    };
  }, [latestGameDate, allSeasons]);

  const methods = useForm<GameFormData>({
    mode: "onChange",
    defaultValues: buildDefaultValues(),
  });

  // Watch form values in parent (owns useForm) and pass as props - avoids production re-render issues in child
  const watched = useWatch({
    control: methods.control,
    name: ["player_score", "opponent_score", "season_id", "is_home", "opponent_team_id", "is_cup_game"],
    defaultValue: {
      player_score: 0,
      opponent_score: 0,
      season_id: "",
      is_home: undefined as boolean | undefined,
      opponent_team_id: "",
      is_cup_game: false,
    },
  });
  const [playerScore, opponentScore, seasonId, isHome, opponentTeamId, isCupGame] = watched;

  const resetForm = () => {
    methods.reset(buildDefaultValues());
  };

  // --- Player / team setup ---
  const currentUserPlayer = currentUser
    ? players.find((p) => p.user_id === currentUser.id) || players[0]
    : players[0];

  // --- Manual season blocking ---
  const [manualSeasonBlocked, setManualSeasonBlocked] = useState(false);
  const [manualSeasonMessage, setManualSeasonMessage] = useState<string | null>(
    null
  );

  const watchSeasonId = methods.watch("season_id");

  // Reset form when modal opens for add (clears ghost values from previous submission)
  useEffect(() => {
    if (isOpen && !editingGame) {
      methods.reset(buildDefaultValues());
    }
  }, [isOpen, editingGame, buildDefaultValues, methods]);

  useEffect(() => {
    const runCheck = async () => {
      if (!currentUserPlayer?.id || !watchSeasonId) return;
      const { data, error } = await supabase!
        .from("season_totals")
        .select("is_manual_entry")
        .eq("player_id", currentUserPlayer.id)
        .eq("season_id", watchSeasonId)
        .maybeSingle();

      if (error) {
        logger.error("Manual season check error:", error);
        setManualSeasonBlocked(false);
        return;
      }

      if (data?.is_manual_entry) {
        setManualSeasonBlocked(true);
        setManualSeasonMessage(
          "This season has manually entered totals. You cannot add or edit games for this season."
        );
      } else {
        setManualSeasonBlocked(false);
        setManualSeasonMessage(null);
      }
    };
    runCheck();
  }, [watchSeasonId, currentUserPlayer?.id]);

  // --- Handle form submission (simplified for now) ---
  const { onSubmit, isSubmitting } = useGameFormSubmit({
    currentUser,
    currentUserPlayer,
    editingGame,
    onGameAdded,
    onClose,
    manualSeasonBlocked,
    manualSeasonMessage,
    resetForm,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingGame ? "Edit Game" : "Add New Game"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Form Start */}
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="p-6 space-y-6"
          >
            <BasicInfoSection
              playerSeasons={playerSeasons}
              allSeasons={allSeasons}
              currentUserPlayer={currentUserPlayer}
              manualSeasonBlocked={manualSeasonBlocked}
              manualSeasonMessage={manualSeasonMessage}
              watchedValues={{
                playerScore: playerScore ?? 0,
                opponentScore: opponentScore ?? 0,
                seasonId: seasonId ?? "",
                isHome,
                opponentTeamId: opponentTeamId ?? "",
                isCupGame: isCupGame ?? false,
              }}
            />

            {/* Placeholder for Playoff + Stats sections (we’ll refactor next) */}
            <PlayoffSection
              seasonId={watchSeasonId}
              currentUserPlayer={currentUserPlayer}
            />

            <StatsSection />

            <ModalFooter
              onClose={onClose}
              onClear={() => methods.reset()}
              isSubmitting={isSubmitting}
              manualSeasonBlocked={manualSeasonBlocked}
              isEditing={!!editingGame}
            />
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
