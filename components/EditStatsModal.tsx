'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Player, Season, SeasonTotals } from '@/lib/types';

interface EditStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  seasons: Season[];
  onStatsUpdated: () => void;
}

export default function EditStatsModal({
  isOpen,
  onClose,
  players,
  seasons,
  onStatsUpdated,
}: EditStatsModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPlayer, setSelectedPlayer] = useState<string>(players[0]?.id || '');
  const [selectedSeason, setSelectedSeason] = useState<string>(seasons[0]?.id || '');
  const [seasonTotals, setSeasonTotals] = useState<SeasonTotals | null>(null);
  const [loadingTotals, setLoadingTotals] = useState(false);

  const [formData, setFormData] = useState({
    games_played: 0,
    games_started: 0,
    total_points: 0,
    total_rebounds: 0,
    total_assists: 0,
    total_steals: 0,
    total_blocks: 0,
    total_turnovers: 0,
    total_minutes: 0,
    total_fouls: 0,
    total_plus_minus: 0,
    total_fg_made: 0,
    total_fg_attempted: 0,
    total_threes_made: 0,
    total_threes_attempted: 0,
    total_ft_made: 0,
    total_ft_attempted: 0,
    avg_points: undefined as number | undefined,
    avg_rebounds: undefined as number | undefined,
    avg_assists: undefined as number | undefined,
    avg_steals: undefined as number | undefined,
    avg_blocks: undefined as number | undefined,
    avg_turnovers: undefined as number | undefined,
    avg_minutes: undefined as number | undefined,
    avg_fouls: undefined as number | undefined,
    avg_plus_minus: undefined as number | undefined,
    fg_percentage: undefined as number | undefined,
    ft_percentage: undefined as number | undefined,
    three_pt_percentage: undefined as number | undefined,
    double_doubles: 0,
    triple_doubles: 0,
  });

  useEffect(() => {
    if (selectedPlayer && selectedSeason) {
      loadSeasonTotals();
    }
  }, [selectedPlayer, selectedSeason]);

  const loadSeasonTotals = async () => {
    if (!selectedPlayer || !selectedSeason) return;

    setLoadingTotals(true);
    try {
      const { data, error } = await supabase
        .from('season_totals')
        .select('*')
        .eq('player_id', selectedPlayer)
        .eq('season_id', selectedSeason)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading season totals:', error);
      }

      if (data) {
        setSeasonTotals(data);
        setFormData({
          games_played: data.games_played || 0,
          games_started: data.games_started || 0,
          total_points: data.total_points || 0,
          total_rebounds: data.total_rebounds || 0,
          total_assists: data.total_assists || 0,
          total_steals: data.total_steals || 0,
          total_blocks: data.total_blocks || 0,
          total_turnovers: data.total_turnovers || 0,
          total_minutes: data.total_minutes || 0,
          total_fouls: data.total_fouls || 0,
          total_plus_minus: data.total_plus_minus || 0,
          total_fg_made: data.total_fg_made || 0,
          total_fg_attempted: data.total_fg_attempted || 0,
          total_threes_made: data.total_threes_made || 0,
          total_threes_attempted: data.total_threes_attempted || 0,
          total_ft_made: data.total_ft_made || 0,
          total_ft_attempted: data.total_ft_attempted || 0,
          avg_points: data.avg_points,
          avg_rebounds: data.avg_rebounds,
          avg_assists: data.avg_assists,
          avg_steals: data.avg_steals,
          avg_blocks: data.avg_blocks,
          avg_turnovers: data.avg_turnovers,
          avg_minutes: data.avg_minutes,
          avg_fouls: data.avg_fouls,
          avg_plus_minus: data.avg_plus_minus,
          fg_percentage: data.fg_percentage,
          ft_percentage: data.ft_percentage,
          three_pt_percentage: data.three_pt_percentage,
          double_doubles: data.double_doubles || 0,
          triple_doubles: data.triple_doubles || 0,
        });
      } else {
        // Reset form if no totals exist
        setSeasonTotals(null);
        setFormData({
          games_played: 0,
          games_started: 0,
          total_points: 0,
          total_rebounds: 0,
          total_assists: 0,
          total_steals: 0,
          total_blocks: 0,
          total_turnovers: 0,
          total_minutes: 0,
          total_fouls: 0,
          total_plus_minus: 0,
          total_fg_made: 0,
          total_fg_attempted: 0,
          total_threes_made: 0,
          total_threes_attempted: 0,
          total_ft_made: 0,
          total_ft_attempted: 0,
          avg_points: undefined,
          avg_rebounds: undefined,
          avg_assists: undefined,
          avg_steals: undefined,
          avg_blocks: undefined,
          avg_turnovers: undefined,
          avg_minutes: undefined,
          avg_fouls: undefined,
          avg_plus_minus: undefined,
          fg_percentage: undefined,
          ft_percentage: undefined,
          three_pt_percentage: undefined,
          double_doubles: 0,
          triple_doubles: 0,
        });
      }
    } catch (error) {
      console.error('Error loading season totals:', error);
    } finally {
      setLoadingTotals(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.total_fg_made > formData.total_fg_attempted) {
      newErrors.fg = 'Field goals made cannot exceed attempts';
    }
    if (formData.total_threes_made > formData.total_threes_attempted) {
      newErrors.threes = 'Three-pointers made cannot exceed attempts';
    }
    if (formData.total_threes_attempted > formData.total_fg_attempted) {
      newErrors.threes = 'Three-point attempts cannot exceed field goal attempts';
    }
    if (formData.total_ft_made > formData.total_ft_attempted) {
      newErrors.ft = 'Free throws made cannot exceed attempts';
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
      const totalsData: any = {
        player_id: selectedPlayer,
        season_id: selectedSeason,
        is_manual_entry: true,
        games_played: formData.games_played,
        games_started: formData.games_started || 0,
        total_points: formData.total_points,
        total_rebounds: formData.total_rebounds,
        total_assists: formData.total_assists,
        total_steals: formData.total_steals,
        total_blocks: formData.total_blocks,
        total_turnovers: formData.total_turnovers,
        total_minutes: formData.total_minutes,
        total_fouls: formData.total_fouls,
        total_plus_minus: formData.total_plus_minus,
        total_fg_made: formData.total_fg_made,
        total_fg_attempted: formData.total_fg_attempted,
        total_threes_made: formData.total_threes_made,
        total_threes_attempted: formData.total_threes_attempted,
        total_ft_made: formData.total_ft_made,
        total_ft_attempted: formData.total_ft_attempted,
        double_doubles: formData.double_doubles,
        triple_doubles: formData.triple_doubles,
      };

      // Add averages if provided
      if (formData.avg_points !== undefined) totalsData.avg_points = formData.avg_points;
      if (formData.avg_rebounds !== undefined) totalsData.avg_rebounds = formData.avg_rebounds;
      if (formData.avg_assists !== undefined) totalsData.avg_assists = formData.avg_assists;
      if (formData.avg_steals !== undefined) totalsData.avg_steals = formData.avg_steals;
      if (formData.avg_blocks !== undefined) totalsData.avg_blocks = formData.avg_blocks;
      if (formData.avg_turnovers !== undefined) totalsData.avg_turnovers = formData.avg_turnovers;
      if (formData.avg_minutes !== undefined) totalsData.avg_minutes = formData.avg_minutes;
      if (formData.avg_fouls !== undefined) totalsData.avg_fouls = formData.avg_fouls;
      if (formData.avg_plus_minus !== undefined) totalsData.avg_plus_minus = formData.avg_plus_minus;

      // Add percentages if provided
      if (formData.fg_percentage !== undefined) totalsData.fg_percentage = formData.fg_percentage;
      if (formData.ft_percentage !== undefined) totalsData.ft_percentage = formData.ft_percentage;
      if (formData.three_pt_percentage !== undefined) totalsData.three_pt_percentage = formData.three_pt_percentage;

      if (seasonTotals) {
        // Update existing totals
        const { error } = await supabase
          .from('season_totals')
          .update(totalsData)
          .eq('id', seasonTotals.id);

        if (error) throw error;
      } else {
        // Insert new totals
        const { error } = await supabase
          .from('season_totals')
          .insert([totalsData]);

        if (error) throw error;
      }

      onStatsUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error saving season totals:', error);
      setErrors({ submit: error.message || 'Failed to save season totals' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Season Statistics</h2>
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

          {/* Player and Season Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Player *
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.player_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Season *
              </label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>
                    {season.year_start}–{season.year_end}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingTotals ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading season totals...</p>
            </div>
          ) : (
            <>
              {/* Games */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Games</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Games Played *</label>
                    <input
                      type="number"
                      value={formData.games_played}
                      onChange={(e) => handleChange('games_played', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Games Started</label>
                    <input
                      type="number"
                      value={formData.games_started}
                      onChange={(e) => handleChange('games_started', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Totals</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <input
                      type="number"
                      value={formData.total_points}
                      onChange={(e) => handleChange('total_points', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rebounds</label>
                    <input
                      type="number"
                      value={formData.total_rebounds}
                      onChange={(e) => handleChange('total_rebounds', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assists</label>
                    <input
                      type="number"
                      value={formData.total_assists}
                      onChange={(e) => handleChange('total_assists', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Steals</label>
                    <input
                      type="number"
                      value={formData.total_steals}
                      onChange={(e) => handleChange('total_steals', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blocks</label>
                    <input
                      type="number"
                      value={formData.total_blocks}
                      onChange={(e) => handleChange('total_blocks', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turnovers</label>
                    <input
                      type="number"
                      value={formData.total_turnovers}
                      onChange={(e) => handleChange('total_turnovers', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.total_minutes}
                      onChange={(e) => handleChange('total_minutes', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fouls</label>
                    <input
                      type="number"
                      value={formData.total_fouls}
                      onChange={(e) => handleChange('total_fouls', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">+/-</label>
                    <input
                      type="number"
                      value={formData.total_plus_minus}
                      onChange={(e) => handleChange('total_plus_minus', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FG Made</label>
                    <input
                      type="number"
                      value={formData.total_fg_made}
                      onChange={(e) => handleChange('total_fg_made', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                    {errors.fg && (
                      <p className="text-xs text-red-600 mt-1">{errors.fg}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FG Attempted</label>
                    <input
                      type="number"
                      value={formData.total_fg_attempted}
                      onChange={(e) => handleChange('total_fg_attempted', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3PT Made</label>
                    <input
                      type="number"
                      value={formData.total_threes_made}
                      onChange={(e) => handleChange('total_threes_made', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                    {errors.threes && (
                      <p className="text-xs text-red-600 mt-1">{errors.threes}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3PT Attempted</label>
                    <input
                      type="number"
                      value={formData.total_threes_attempted}
                      onChange={(e) => handleChange('total_threes_attempted', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FT Made</label>
                    <input
                      type="number"
                      value={formData.total_ft_made}
                      onChange={(e) => handleChange('total_ft_made', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                    {errors.ft && (
                      <p className="text-xs text-red-600 mt-1">{errors.ft}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FT Attempted</label>
                    <input
                      type="number"
                      value={formData.total_ft_attempted}
                      onChange={(e) => handleChange('total_ft_attempted', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Double-Doubles</label>
                    <input
                      type="number"
                      value={formData.double_doubles}
                      onChange={(e) => handleChange('double_doubles', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Triple-Doubles</label>
                    <input
                      type="number"
                      value={formData.triple_doubles}
                      onChange={(e) => handleChange('triple_doubles', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Averages (Optional) */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Per Game Averages (Optional)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'avg_points', label: 'Points' },
                    { key: 'avg_rebounds', label: 'Rebounds' },
                    { key: 'avg_assists', label: 'Assists' },
                    { key: 'avg_steals', label: 'Steals' },
                    { key: 'avg_blocks', label: 'Blocks' },
                    { key: 'avg_turnovers', label: 'Turnovers' },
                    { key: 'avg_minutes', label: 'Minutes' },
                    { key: 'avg_fouls', label: 'Fouls' },
                    { key: 'avg_plus_minus', label: '+/-' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData[key as keyof typeof formData] || ''}
                        onChange={(e) => handleChange(key, e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Percentages (Optional) */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shooting Percentages (Optional)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FG %</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.fg_percentage || ''}
                      onChange={(e) => handleChange('fg_percentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FT %</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.ft_percentage || ''}
                      onChange={(e) => handleChange('ft_percentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3PT %</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.three_pt_percentage || ''}
                      onChange={(e) => handleChange('three_pt_percentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.000"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

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
              disabled={loading || loadingTotals}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Season Totals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

