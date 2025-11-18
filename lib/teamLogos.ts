/**
 * NBA Team Logo Utilities
 * Maps team names and IDs to NBA CDN logo URLs
 */

// NBA team IDs (numeric) mapped to team names
const NBA_TEAM_IDS: Record<string, string> = {
  'Atlanta Hawks': '1610612737',
  'Boston Celtics': '1610612738',
  'Brooklyn Nets': '1610612751',
  'Charlotte Hornets': '1610612766',
  'Chicago Bulls': '1610612741',
  'Cleveland Cavaliers': '1610612739',
  'Dallas Mavericks': '1610612742',
  'Denver Nuggets': '1610612743',
  'Detroit Pistons': '1610612765',
  'Golden State Warriors': '1610612744',
  'Houston Rockets': '1610612745',
  'Indiana Pacers': '1610612754',
  'LA Clippers': '1610612746',
  'Los Angeles Clippers': '1610612746',
  'LA Lakers': '1610612747',
  'Los Angeles Lakers': '1610612747',
  'Memphis Grizzlies': '1610612763',
  'Miami Heat': '1610612748',
  'Milwaukee Bucks': '1610612749',
  'Minnesota Timberwolves': '1610612750',
  'New Orleans Pelicans': '1610612740',
  'New York Knicks': '1610612752',
  'Oklahoma City Thunder': '1610612760',
  'Orlando Magic': '1610612753',
  'Philadelphia 76ers': '1610612755',
  'Phoenix Suns': '1610612756',
  'Portland Trail Blazers': '1610612757',
  'Sacramento Kings': '1610612758',
  'San Antonio Spurs': '1610612759',
  'Toronto Raptors': '1610612761',
  'Utah Jazz': '1610612762',
  'Washington Wizards': '1610612764',
};

/**
 * Get NBA CDN logo URL for a team
 * @param teamName Full team name (e.g., "Los Angeles Lakers")
 * @returns NBA CDN logo URL or null if team not found
 */
export function getTeamLogoUrl(teamName: string | null | undefined): string | null {
  if (!teamName) return null;
  
  const teamId = NBA_TEAM_IDS[teamName];
  if (!teamId) return null;
  
  return `https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg`;
}

/**
 * Get NBA CDN logo URL from team ID (e.g., "team-lal")
 * @param teamId Team ID from database (e.g., "team-lal")
 * @returns NBA CDN logo URL or null if team not found
 */
export function getTeamLogoUrlFromId(teamId: string | null | undefined): string | null {
  if (!teamId) return null;
  
  // Map team IDs to team names
  const teamIdToName: Record<string, string> = {
    'team-atl': 'Atlanta Hawks',
    'team-bos': 'Boston Celtics',
    'team-bkn': 'Brooklyn Nets',
    'team-cha': 'Charlotte Hornets',
    'team-chi': 'Chicago Bulls',
    'team-cle': 'Cleveland Cavaliers',
    'team-dal': 'Dallas Mavericks',
    'team-den': 'Denver Nuggets',
    'team-det': 'Detroit Pistons',
    'team-gsw': 'Golden State Warriors',
    'team-hou': 'Houston Rockets',
    'team-ind': 'Indiana Pacers',
    'team-lac': 'LA Clippers',
    'team-lal': 'Los Angeles Lakers',
    'team-mem': 'Memphis Grizzlies',
    'team-mia': 'Miami Heat',
    'team-mil': 'Milwaukee Bucks',
    'team-min': 'Minnesota Timberwolves',
    'team-nop': 'New Orleans Pelicans',
    'team-nyk': 'New York Knicks',
    'team-okc': 'Oklahoma City Thunder',
    'team-orl': 'Orlando Magic',
    'team-phi': 'Philadelphia 76ers',
    'team-phx': 'Phoenix Suns',
    'team-por': 'Portland Trail Blazers',
    'team-sac': 'Sacramento Kings',
    'team-sas': 'San Antonio Spurs',
    'team-tor': 'Toronto Raptors',
    'team-uta': 'Utah Jazz',
    'team-was': 'Washington Wizards',
  };
  
  const teamName = teamIdToName[teamId];
  if (!teamName) return null;
  
  return getTeamLogoUrl(teamName);
}

