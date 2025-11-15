// Team name to abbreviation mapping
export const teamAbbreviations: Record<string, string> = {
  // Eastern Conference - Atlantic
  'Boston Celtics': 'BOS',
  'Brooklyn Nets': 'BKN',
  'New York Knicks': 'NYK',
  'Philadelphia 76ers': 'PHI',
  'Toronto Raptors': 'TOR',
  
  // Eastern Conference - Central
  'Chicago Bulls': 'CHI',
  'Cleveland Cavaliers': 'CLE',
  'Detroit Pistons': 'DET',
  'Indiana Pacers': 'IND',
  'Milwaukee Bucks': 'MIL',
  
  // Eastern Conference - Southeast
  'Atlanta Hawks': 'ATL',
  'Charlotte Hornets': 'CHA',
  'Miami Heat': 'MIA',
  'Orlando Magic': 'ORL',
  'Washington Wizards': 'WAS',
  
  // Western Conference - Northwest
  'Denver Nuggets': 'DEN',
  'Minnesota Timberwolves': 'MIN',
  'Oklahoma City Thunder': 'OKC',
  'Portland Trail Blazers': 'POR',
  'Utah Jazz': 'UTA',
  
  // Western Conference - Pacific
  'Golden State Warriors': 'GSW',
  'Los Angeles Clippers': 'LAC',
  'LA Clippers': 'LAC', // Alternative name format
  'Los Angeles Lakers': 'LAL',
  'LA Lakers': 'LAL', // Alternative name format
  'Phoenix Suns': 'PHX',
  'Sacramento Kings': 'SAC',
  
  // Western Conference - Southwest
  'Dallas Mavericks': 'DAL',
  'Houston Rockets': 'HOU',
  'Memphis Grizzlies': 'MEM',
  'New Orleans Pelicans': 'NOP',
  'San Antonio Spurs': 'SAS',
};

/**
 * Get team abbreviation from team name
 * @param teamName Full team name
 * @returns Abbreviation or original name if not found
 */
export function getTeamAbbreviation(teamName: string | null | undefined): string {
  if (!teamName) return 'N/A';
  return teamAbbreviations[teamName] || teamName;
}

