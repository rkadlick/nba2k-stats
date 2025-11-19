'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import { Player, Season, Team, User } from '@/lib/types';
import { logger } from '@/lib/logger';
import { useToast } from './ToastProvider';

interface GameFormData {
  game_date: string;
  season_id: string;
  opponent_team_id: string;
  is_home: boolean;
  player_score: number;
  opponent_score: number;
  is_key_game: boolean;
  is_playoff_game: boolean;
  playoff_series_id: string;
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

// Helper: find season from date
function getSeasonFromDate(dateString: string, seasons: Season[]): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const seasonStart = month >= 9 ? year : year - 1;
  const match = seasons.find(s => s.year_start === seasonStart);
  return match?.id || null;
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
  const { success, error: showError } = useToast();
  const [manualSeasonBlocked, setManualSeasonBlocked] = useState(false);
  const [manualSeasonMessage, setManualSeasonMessage] = useState<string | null>(null);

  // Current player
  const currentUserPlayer = currentUser
    ? players.find(p => p.user_id === currentUser.id) || players[0]
    : players[0];
  const playerTeam = teams.find(t => t.id === currentUserPlayer?.team_id);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GameFormData>({
    mode: 'onChange',
    defaultValues: {
      game_date: new Date().toISOString().split('T')[0],
      season_id:
        getSeasonFromDate(new Date().toISOString().split('T')[0], seasons) ||
        seasons[0]?.id ||
        '',
      opponent_team_id: '',
      is_home: true,
      player_score: 0,
      opponent_score: 0,
      is_key_game: false,
      is_playoff_game: false,
      playoff_series_id: '',
    },
  });

  // Watchers
  const seasonId = watch('season_id');
  const playerScore = watch('player_score');
  const opponentScore = watch('opponent_score');
  const isWin = playerScore > opponentScore;

  // Manual‑season check
  useEffect(() => {
    const runCheck = async () => {
      if (!currentUserPlayer?.id || !seasonId || !supabase) return;
      const { data, error } = await supabase
        .from('season_totals')
        .select('is_manual_entry')
        .eq('player_id', currentUserPlayer.id)
        .eq('season_id', seasonId)
        .maybeSingle();

      if (error) {
        logger.error('Manual season check error:', error);
        setManualSeasonBlocked(false);
        return;
      }

      if (data?.is_manual_entry) {
        setManualSeasonBlocked(true);
        setManualSeasonMessage(
          'This season has manually entered totals. You cannot add or edit games for this season.'
        );
      } else {
        setManualSeasonBlocked(false);
        setManualSeasonMessage('');
      }
    };
    runCheck();
  }, [seasonId]);

  // Edit prefill
  useEffect(() => {
    if (editingGame) {
      reset({
        ...editingGame,
        game_date: editingGame.game_date,
        season_id:
          getSeasonFromDate(editingGame.game_date, seasons) ||
          editingGame.season_id,
      });
    }
  }, [editingGame, reset, seasons]);

  const onSubmit: SubmitHandler<GameFormData> = async data => {
    if (manualSeasonBlocked) {
      showError(manualSeasonMessage || 'Manual season block error');
      return;
    }

    // Validate required fields
    if (!currentUserPlayer?.id) {
      showError('Player not found. Please ensure you are logged in.');
      return;
    }

    if (!data.season_id) {
      showError('Season is required');
      return;
    }

    if (!data.opponent_team_id) {
      showError('Opponent team is required');
      return;
    }

    try {
      const isWin = data.player_score > data.opponent_score;
      
      // Fix timezone issue: add 1 day to the date to prevent it from being stored as the previous day
      const date = new Date(data.game_date);
      date.setDate(date.getDate() + 1);
      const adjustedDate = date.toISOString().split('T')[0];
      
      // Clean up the data: convert empty strings to null, remove undefined values
      const cleanValue = (value: any): any => {
        if (value === undefined) return undefined; // Will be omitted
        if (value === '' || (typeof value === 'number' && isNaN(value))) return null;
        return value;
      };

      // Build gameData object, only including defined values
      // NOTE: games_started is NOT included here - it is automatically handled by Supabase database triggers/functions.
      // All games are considered "started" from here on out, so games_started is calculated automatically in the backend.
      // DO NOT add games_started to gameData or any game-related database submissions.
      const gameData: Record<string, any> = {
        player_id: currentUserPlayer.id,
        season_id: data.season_id,
        game_date: adjustedDate,
        opponent_team_id: data.opponent_team_id, // Required field
        is_home: data.is_home ?? true,
        is_win: isWin,
        player_score: data.player_score ?? 0,
        opponent_score: data.opponent_score ?? 0,
        is_key_game: data.is_key_game ?? false,
        is_playoff_game: data.is_playoff_game ?? false,
      };

      const playoffSeriesId = cleanValue(data.playoff_series_id);
      if (playoffSeriesId !== undefined) {
        gameData.playoff_series_id = playoffSeriesId;
      }

      const playoffGameNumber = cleanValue(data.playoff_game_number);
      if (playoffGameNumber !== undefined) {
        gameData.playoff_game_number = playoffGameNumber;
      }

      // Add stat fields - include them even if null (to explicitly set null in DB)
      const statFields = [
        'minutes', 'points', 'rebounds', 'offensive_rebounds', 'assists',
        'steals', 'blocks', 'turnovers', 'fouls', 'plus_minus',
        'fg_made', 'fg_attempted', 'threes_made', 'threes_attempted',
        'ft_made', 'ft_attempted'
      ];

      statFields.forEach(field => {
        const value = cleanValue(data[field as keyof GameFormData]);
        if (value !== undefined) {
          gameData[field] = value;
        }
      });

      if (!supabase) {
        showError('Database connection not available');
        return;
      }

      // Explicitly ensure games_started is NOT in gameData (Supabase handles this automatically)
      if ('games_started' in gameData) {
        delete gameData.games_started;
      }

      logger.info('Saving game data:', gameData);
      logger.info('Game data keys:', Object.keys(gameData));

      const { data: result, error } = editingGame
        ? await supabase.from('player_game_stats').update(gameData).eq('id', editingGame.id).select()
        : await supabase.from('player_game_stats').insert([gameData]).select();

      if (error) {
        logger.error('Database error:', error);
        showError(`Failed to save game: ${error.message}`);
        return;
      }

      logger.info('Game saved successfully:', result);
      onGameAdded();
      success(editingGame ? 'Game updated successfully' : 'Game added successfully');
      reset(); // Reset form after successful save
      onClose();
    } catch (error) {
      logger.error('Unexpected error saving game:', error);
      showError(`Failed to save game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  const selectedSeason = seasons.find(s => s.id === watch('season_id'));
  const seasonDisplay = selectedSeason
    ? `${selectedSeason.year_start}–${selectedSeason.year_end}`
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingGame ? 'Edit Game' : 'Add New Game'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {manualSeasonBlocked && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{manualSeasonMessage}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Date *
              </label>
              <input
                type="date"
                {...register('game_date', {
                  required: 'Game date is required',
                  onChange: e => {
                    const newDate = e.target.value;
                    const season = getSeasonFromDate(newDate, seasons);
                    if (season) setValue('season_id', season);
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {errors.game_date && (
                <p className="text-xs text-red-600">{errors.game_date.message}</p>
              )}
            </div>

            {/* Season Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season *</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold">
                {seasonDisplay || 'Select a date'}
              </div>
            </div>

            {/* Opponent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opponent Team *
              </label>
              <select
                {...register('opponent_team_id', { required: 'Opponent team is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.opponent_team_id && (
                <p className="text-xs text-red-600">{errors.opponent_team_id.message}</p>
              )}
            </div>

            {/* Home/Away */}
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                {...register('is_home')}
                id="homegame"
                className="rounded border-gray-300"
              />
              <label htmlFor="homegame" className="text-sm font-medium text-gray-700">
                Home Game
              </label>
            </div>

            {/* Player / Opponent Scores */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {playerTeam?.name || 'Your Team'} Score *
              </label>
              <input
                type="number"
                {...register('player_score', {
                  valueAsNumber: true,
                  required: 'Player score required',
                  min: { value: 0, message: '≥ 0' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {errors.player_score && (
                <p className="text-xs text-red-600">{errors.player_score.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {(() => {
                  const oppTeam = teams.find(t => t.id === watch('opponent_team_id'));
                  return oppTeam?.name || 'Opponent';
                })()} Score *
              </label>
              <input
                type="number"
                {...register('opponent_score', {
                  valueAsNumber: true,
                  required: 'Opponent score required',
                  min: { value: 0, message: '≥ 0' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {errors.opponent_score && (
                <p className="text-xs text-red-600">{errors.opponent_score.message}</p>
              )}
            </div>
          </div>

          {/* Result Indicator */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm font-medium text-gray-700">
              Result:{' '}
              <span className={isWin ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {isWin ? 'Win' : 'Loss'}
              </span>
            </div>

            {/* Key + Playoff flags */}
            <div className="flex items-center gap-8">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('is_key_game')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Key Game</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('is_playoff_game')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Playoff Game</span>
              </label>
            </div>
          </div>

          {/* Playoff Info */}
          {/* {watch('is_playoff_game') && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Playoff Series ID
                </label>
                <input
                  type="text"
                  {...register('playoff_series_id')}
                  placeholder="series-2024-25-round1-lakers-warriors"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Game Number
                </label>
                <input
                  type="number"
                  {...register('playoff_game_number', {
                    valueAsNumber: true,
                    min: { value: 1, message: '≥ 1' },
                  })}
                  placeholder="Game 1, 2, 3..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.playoff_game_number && (
                  <p className="text-xs text-red-600">{errors.playoff_game_number.message}</p>
                )}
              </div>
            </div> 
          )} */}

          {/* Stats Section */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Minutes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('minutes', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.minutes && <p className="text-xs text-red-600">{errors.minutes.message}</p>}
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  {...register('points', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.points && <p className="text-xs text-red-600">{errors.points.message}</p>}
              </div>

              {/* Rebounds */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rebounds</label>
                <input
                  type="number"
                  {...register('rebounds', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.rebounds && <p className="text-xs text-red-600">{errors.rebounds.message}</p>}
              </div>

              {/* Offensive Rebounds */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offensive Rebounds
                </label>
                <input
                  type="number"
                  {...register('offensive_rebounds', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.offensive_rebounds && (
                  <p className="text-xs text-red-600">{errors.offensive_rebounds.message}</p>
                )}
              </div>

              {/* Assists */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assists</label>
                <input
                  type="number"
                  {...register('assists', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.assists && <p className="text-xs text-red-600">{errors.assists.message}</p>}
              </div>

              {/* Steals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steals</label>
                <input
                  type="number"
                  {...register('steals', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.steals && <p className="text-xs text-red-600">{errors.steals.message}</p>}
              </div>

              {/* Blocks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blocks</label>
                <input
                  type="number"
                  {...register('blocks', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.blocks && <p className="text-xs text-red-600">{errors.blocks.message}</p>}
              </div>

              {/* Turnovers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turnovers</label>
                <input
                  type="number"
                  {...register('turnovers', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.turnovers && <p className="text-xs text-red-600">{errors.turnovers.message}</p>}
              </div>

              {/* Fouls */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fouls</label>
                <input
                  type="number"
                  {...register('fouls', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.fouls && <p className="text-xs text-red-600">{errors.fouls.message}</p>}
              </div>

              {/* Plus/Minus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">+/-</label>
                <input
                  type="number"
                  {...register('plus_minus', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Field Goals Made */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FG Made</label>
                <input
                  type="number"
                  {...register('fg_made', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                    validate: val =>
                      val === undefined || val <= (watch('fg_attempted') ?? val) ||
                      'FG made cannot exceed attempts',
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.fg_made && <p className="text-xs text-red-600">{errors.fg_made.message}</p>}
              </div>

              {/* Field Goals Attempted */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FG Attempted</label>
                <input
                  type="number"
                  {...register('fg_attempted', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.fg_attempted && (
                  <p className="text-xs text-red-600">{errors.fg_attempted.message}</p>
                )}
              </div>

              {/* Three-Pointers Made */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">3PT Made</label>
                <input
                  type="number"
                  {...register('threes_made', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                    validate: val =>
                      val === undefined || val <= (watch('threes_attempted') ?? val) ||
                      '3PT made cannot exceed attempts',
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.threes_made && (
                  <p className="text-xs text-red-600">{errors.threes_made.message}</p>
                )}
              </div>

              {/* Three-Pointers Attempted */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">3PT Attempted</label>
                <input
                  type="number"
                  {...register('threes_attempted', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                    validate: val =>
                      val === undefined || val >= (watch('threes_made') ?? 0) ||
                      '3PT attempts must be ≥ 3PT made',
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.threes_attempted && (
                  <p className="text-xs text-red-600">{errors.threes_attempted.message}</p>
                )}
              </div>

              {/* Free Throws Made */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FT Made</label>
                <input
                  type="number"
                  {...register('ft_made', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                    validate: val =>
                      val === undefined || val <= (watch('ft_attempted') ?? val) || 'FT made cannot exceed attempts',
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.ft_made && <p className="text-xs text-red-600">{errors.ft_made.message}</p>}
              </div>

              {/* Free Throws Attempted */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FT Attempted</label>
                <input
                  type="number"
                  {...register('ft_attempted', {
                    valueAsNumber: true,
                    min: { value: 0, message: '≥ 0' },
                    validate: val =>
                      val === undefined || val >= (watch('ft_made') ?? 0) || 'FT attempts must be ≥ FT made',
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.ft_attempted && (
                  <p className="text-xs text-red-600">{errors.ft_attempted.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => reset()}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Clear Form
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || manualSeasonBlocked}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingGame ? 'Update' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}