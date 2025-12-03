"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { Player, Season, Team, User } from "@/lib/types";
import { logger } from "@/lib/logger";
import { BasicInfoSection } from "./BasicInfoSection";
import { getSeasonFromDate } from "@/lib/helpers/dateUtils"; // ensure you use named export
import { PlayoffSection } from "./PlayoffSection";
import { StatsSection } from "./StatsSection";
import { ModalFooter } from "./ModalFooter";
import { useGameFormSubmit } from "@/hooks/useGameFormSubmit";

export interface GameFormData {
  game_date: string;
  season_id: string;
  opponent_team_id: string;
  is_home: boolean;
  player_score: number;
  opponent_score: number;
  is_overtime: boolean;
  is_simulated: boolean;
  is_key_game: boolean;
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
  seasons: Season[];
  teams: Team[];
  onGameAdded: () => void;
  editingGame?: any | null;
  currentUser: User | null;
}

export default function AddGameModal({
  isOpen,
  onClose,
  players,
  seasons,
  teams,
  onGameAdded,
  editingGame,
  currentUser,
}: AddGameModalProps) {
  const methods = useForm<GameFormData>({
    mode: "onChange",
    defaultValues: {
      game_date: new Date().toISOString().split("T")[0],
      season_id:
        getSeasonFromDate(new Date().toISOString().split("T")[0], seasons) ||
        seasons[0]?.id ||
        "",
      opponent_team_id: "",
      is_home: true,
      player_score: 0,
      opponent_score: 0,
      is_key_game: false,
      is_playoff_game: false,
	  is_overtime: false,
	  is_simulated: false,
      playoff_series_id: "",
    },
  });

  // --- Player / team setup ---
  const currentUserPlayer = currentUser
    ? players.find((p) => p.user_id === currentUser.id) || players[0]
    : players[0];
  const playerTeam = teams.find((t) => t.id === currentUserPlayer?.team_id);

  // --- Manual season blocking ---
  const [manualSeasonBlocked, setManualSeasonBlocked] = useState(false);
  const [manualSeasonMessage, setManualSeasonMessage] = useState<string | null>(
    null
  );

  const watchSeasonId = methods.watch("season_id");

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
		<form onSubmit={methods.handleSubmit(onSubmit)} className="p-6 space-y-6">
            <BasicInfoSection
              seasons={seasons}
              teams={teams}
              playerTeam={playerTeam}
              manualSeasonBlocked={manualSeasonBlocked}
              manualSeasonMessage={manualSeasonMessage}
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
