'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Player, Season, Team, PlayerGameStats } from '@/lib/types';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  seasons: Season[];
  teams: Team[];
  onGameAdded: () => void;
  editingGame?: PlayerGameStats | null;
}

export default function AddGameModal({
  isOpen,
  onClose,
  players,
  seasons,
  teams,
  onGameAdded,
  editingGame,
}: AddGameModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    player_id: players[0]?.id || '',
    season_id: seasons[0]?.id || '',
    game_date: new Date().toISOString().split('T')[0],
    opponent_team_id: '',
    opponent_team_name: '',
    is_home: true,
    is_win: true,
    player_score: 0,
    opponent_score: 0,
    is_key_game: false,
    is_playoff_game: false,
    playoff_series_id: '',
    playoff_game_number: undefined as number | undefined,
    minutes: undefined as number | undefined,
    points: undefined as number | undefined,
    rebounds: undefined as number | undefined,
    offensive_rebounds: undefined as number | undefined,
    assists: undefined as number | undefined,
    steals: undefined as number | undefined,
    blocks: undefined as number | undefined,
    turnovers: undefined as number | undefined,
    fouls: undefined as number | undefined,
    plus_minus: undefined as number | undefined,
    fg_made: undefined as number | undefined,
    fg_attempted: undefined as number | undefined,
    threes_made: undefined as number | undefined,
    threes_attempted: undefined as number | undefined,
    ft_made: undefined as number | undefined,
    ft_attempted: undefined as number | undefined,
  });

  useEffect(() => {
    if (editingGame) {
      setFormData({
        player_id: editingGame.player_id,
        season_id: editingGame.season_id,
        game_date: editingGame.game_date || new Date().toISOString().split('T')[0],
        opponent_team_id: editingGame.opponent_team_id || '',
        opponent_team_name: editingGame.opponent_team_name || '',
        is_home: editingGame.is_home,
        is_win: editingGame.is_win,
        player_score: editingGame.player_score,
        opponent_score: editingGame.opponent_score,
        is_key_game: editingGame.is_key_game || false,
        is_playoff_game: editingGame.is_playoff_game || false,
        playoff_series_id: editingGame.playoff_series_id || '',
        playoff_game_number: editingGame.playoff_game_number,
        minutes: editingGame.minutes,
        points: editingGame.points,
        rebounds: editingGame.rebounds,
        offensive_rebounds: editingGame.offensive_rebounds,
        assists: editingGame.assists,
        steals: editingGame.steals,
        blocks: editingGame.blocks,
        turnovers: editingGame.turnovers,
        fouls: editingGame.fouls,
        plus_minus: editingGame.plus_minus,
        fg_made: editingGame.fg_made,
        fg_attempted: editingGame.fg_attempted,
        threes_made: editingGame.threes_made,
        threes_attempted: editingGame.threes_attempted,
        ft_made: editingGame.ft_made,
        ft_attempted: editingGame.ft_attempted,
      });
    } else {
      // Reset form for new game
      setFormData({
        player_id: players[0]?.id || '',
        season_id: seasons[0]?.id || '',
        game_date: new Date().toISOString().split('T')[0],
        opponent_team_id: '',
        opponent_team_name: '',
        is_home: true,
        is_win: true,
        player_score: 0,
        opponent_score: 0,
        is_key_game: false,
        is_playoff_game: false,
        playoff_series_id: '',
        playoff_game_number: undefined,
        minutes: undefined,
        points: undefined,
        rebounds: undefined,
        offensive_rebounds: undefined,
        assists: undefined,
        steals: undefined,
        blocks: undefined,
        turnovers: undefined,
        fouls: undefined,
        plus_minus: undefined,
        fg_made: undefined,
        fg_attempted: undefined,
        threes_made: undefined,
        threes_attempted: undefined,
        ft_made: undefined,
        ft_attempted: undefined,
      });
    }
    setErrors({});
  }, [isOpen, editingGame, players, seasons]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.player_id) newErrors.player_id = 'Player is required';
    if (!formData.season_id) newErrors.season_id = 'Season is required';
    if (!formData.game_date) newErrors.game_date = 'Game date is required';
    if (!formData.opponent_team_id && !formData.opponent_team_name) {
      newErrors.opponent_team = 'Opponent team is required';
    }

    // Validate shooting stats
    if (formData.fg_made !== undefined && formData.fg_attempted !== undefined) {
      if (formData.fg_made > formData.fg_attempted) {
        newErrors.fg = 'Field goals made cannot exceed attempts';
      }
    }
    if (formData.threes_made !== undefined && formData.threes_attempted !== undefined) {
      if (formData.threes_made > formData.threes_attempted) {
        newErrors.threes = 'Three-pointers made cannot exceed attempts';
      }
      if (formData.fg_attempted !== undefined && formData.threes_attempted > formData.fg_attempted) {
        newErrors.threes = 'Three-point attempts cannot exceed field goal attempts';
      }
    }
    if (formData.ft_made !== undefined && formData.ft_attempted !== undefined) {
      if (formData.ft_made > formData.ft_attempted) {
        newErrors.ft = 'Free throws made cannot exceed attempts';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const gameData: any = {
        player_id: formData.player_id,
        season_id: formData.season_id,
        game_date: formData.game_date,
        is_home: formData.is_home,
        is_win: formData.is_win,
        player_score: formData.player_score,
        opponent_score: formData.opponent_score,
        is_key_game: formData.is_key_game,
        is_playoff_game: formData.is_playoff_game,
      };

      if (formData.opponent_team_id) {
        gameData.opponent_team_id = formData.opponent_team_id;
      } else if (formData.opponent_team_name) {
        gameData.opponent_team_name = formData.opponent_team_name;
      }

      if (formData.is_playoff_game && formData.playoff_series_id) {
        gameData.playoff_series_id = formData.playoff_series_id;
        if (formData.playoff_game_number) {
          gameData.playoff_game_number = formData.playoff_game_number;
        }
      }

      // Add stat fields only if they have values
      const statFields = [
        'minutes', 'points', 'rebounds', 'offensive_rebounds', 'assists',
        'steals', 'blocks', 'turnovers', 'fouls', 'plus_minus',
        'fg_made', 'fg_attempted', 'threes_made', 'threes_attempted',
        'ft_made', 'ft_attempted'
      ];

      statFields.forEach(field => {
        const value = formData[field as keyof typeof formData];
        if (value !== undefined && value !== null && value !== '') {
          gameData[field] = value;
        }
      });

      if (editingGame) {
        // Update existing game
        const { error } = await supabase
          .from('player_game_stats')
          .update(gameData)
          .eq('id', editingGame.id);

        if (error) throw error;
      } else {
        // Insert new game
        const { error } = await supabase
          .from('player_game_stats')
          .insert([gameData]);

        if (error) throw error;
      }

      onGameAdded();
      onClose();
    } catch (error: any) {
      console.error('Error saving game:', error);
      setErrors({ submit: error.message || 'Failed to save game' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingGame ? 'Edit Game' : 'Add New Game'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Player *
              </label>
              <select
                value={formData.player_id}
                onChange={(e) => handleChange('player_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold"
                required
              >
                {players.map(player => (
                <option key={player.id} value={player.id} className="text-gray-900">
                  {player.player_name}
                </option>
                ))}
              </select>
              {errors.player_id && (
                <p className="text-xs text-red-600 mt-1">{errors.player_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Season *
              </label>
              <select
                value={formData.season_id}
                onChange={(e) => handleChange('season_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                required
              >
                {seasons.map(season => (
                  <option key={season.id} value={season.id} className="text-gray-900">
                    {season.year_start}–{season.year_end}
                  </option>
                ))}
              </select>
              {errors.season_id && (
                <p className="text-xs text-red-600 mt-1">{errors.season_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Date *
              </label>
              <input
                type="date"
                value={formData.game_date}
                onChange={(e) => handleChange('game_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                required
              />
              {errors.game_date && (
                <p className="text-xs text-red-600 mt-1">{errors.game_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opponent Team *
              </label>
              <select
                value={formData.opponent_team_id}
                onChange={(e) => {
                  handleChange('opponent_team_id', e.target.value);
                  handleChange('opponent_team_name', '');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold"
              >
                <option value="" className="text-gray-500">Select team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} className="text-gray-900">
                    {team.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Or enter team name manually"
                value={formData.opponent_team_name}
                onChange={(e) => {
                  handleChange('opponent_team_name', e.target.value);
                  if (e.target.value) handleChange('opponent_team_id', '');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.opponent_team && (
                <p className="text-xs text-red-600 mt-1">{errors.opponent_team}</p>
              )}
            </div>
          </div>

          {/* Game Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_home}
                  onChange={(e) => handleChange('is_home', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Home Game</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_win}
                  onChange={(e) => handleChange('is_win', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Win</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Player Score *
              </label>
              <input
                type="number"
                value={formData.player_score}
                onChange={(e) => handleChange('player_score', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opponent Score *
              </label>
              <input
                type="number"
                value={formData.opponent_score}
                onChange={(e) => handleChange('opponent_score', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                required
                min="0"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_key_game}
                  onChange={(e) => handleChange('is_key_game', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Key Game</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_playoff_game}
                  onChange={(e) => handleChange('is_playoff_game', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Playoff Game</span>
              </label>
            </div>
          </div>

          {/* Playoff Info */}
          {formData.is_playoff_game && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Playoff Series ID
                </label>
                <input
                  type="text"
                  value={formData.playoff_series_id}
                  onChange={(e) => handleChange('playoff_series_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                  placeholder="series-2024-25-round1-lakers-warriors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Game Number
                </label>
                <input
                  type="number"
                  value={formData.playoff_game_number || ''}
                  onChange={(e) => handleChange('playoff_game_number', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                  min="1"
                  placeholder="Game 1, 2, 3..."
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Minutes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.minutes || ''}
                  onChange={(e) => handleChange('minutes', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  value={formData.points || ''}
                  onChange={(e) => handleChange('points', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Rebounds */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rebounds</label>
                <input
                  type="number"
                  value={formData.rebounds || ''}
                  onChange={(e) => handleChange('rebounds', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Offensive Rebounds */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offensive Rebounds</label>
                <input
                  type="number"
                  value={formData.offensive_rebounds || ''}
                  onChange={(e) => handleChange('offensive_rebounds', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Assists */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assists</label>
                <input
                  type="number"
                  value={formData.assists || ''}
                  onChange={(e) => handleChange('assists', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Steals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steals</label>
                <input
                  type="number"
                  value={formData.steals || ''}
                  onChange={(e) => handleChange('steals', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Blocks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blocks</label>
                <input
                  type="number"
                  value={formData.blocks || ''}
                  onChange={(e) => handleChange('blocks', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Turnovers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turnovers</label>
                <input
                  type="number"
                  value={formData.turnovers || ''}
                  onChange={(e) => handleChange('turnovers', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Fouls */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fouls</label>
                <input
                  type="number"
                  value={formData.fouls || ''}
                  onChange={(e) => handleChange('fouls', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Plus/Minus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">+/-</label>
                <input
                  type="number"
                  value={formData.plus_minus || ''}
                  onChange={(e) => handleChange('plus_minus', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Field Goals Made */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FG Made</label>
                <input
                  type="number"
                  value={formData.fg_made || ''}
                  onChange={(e) => handleChange('fg_made', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
                {errors.fg && (
                  <p className="text-xs text-red-600 mt-1">{errors.fg}</p>
                )}
              </div>

              {/* Field Goals Attempted */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FG Attempted</label>
                <input
                  type="number"
                  value={formData.fg_attempted || ''}
                  onChange={(e) => handleChange('fg_attempted', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Three-Pointers Made */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">3PT Made</label>
                <input
                  type="number"
                  value={formData.threes_made || ''}
                  onChange={(e) => handleChange('threes_made', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
                {errors.threes && (
                  <p className="text-xs text-red-600 mt-1">{errors.threes}</p>
                )}
              </div>

              {/* Three-Pointers Attempted */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">3PT Attempted</label>
                <input
                  type="number"
                  value={formData.threes_attempted || ''}
                  onChange={(e) => handleChange('threes_attempted', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>

              {/* Free Throws Made */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FT Made</label>
                <input
                  type="number"
                  value={formData.ft_made || ''}
                  onChange={(e) => handleChange('ft_made', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
                {errors.ft && (
                  <p className="text-xs text-red-600 mt-1">{errors.ft}</p>
                )}
              </div>

              {/* Free Throws Attempted */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FT Attempted</label>
                <input
                  type="number"
                  value={formData.ft_attempted || ''}
                  onChange={(e) => handleChange('ft_attempted', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editingGame ? 'Update Game' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

