/**
 * NBA Teams Data
 * Unified team information including colors, logos, abbreviations, and conference data
 */

export interface TeamColors {
  primary: string;
  secondary: string;
  onPrimary: string; // text color that passes accessibility contrast on the primary background
}

export interface TeamData {
  id: string; // e.g., "team-atl"
  fullName: string; // e.g., "Atlanta Hawks"
  abbreviation: string; // e.g., "ATL"
  conference: 'East' | 'West';
  colors: TeamColors;
  numericId: string; // NBA API ID for logos
}

/**
 * Complete NBA teams data with all properties
 */
export const NBA_TEAMS: Record<string, TeamData> = {
  'team-atl': {
    id: 'team-atl',
    fullName: 'Atlanta Hawks',
    abbreviation: 'ATL',
    conference: 'East',
    colors: { primary: '#E03A3E', secondary: '#C1D32F', onPrimary: '#FFFFFF' },
    numericId: '1610612737'
  },
  'team-bos': {
    id: 'team-bos',
    fullName: 'Boston Celtics',
    abbreviation: 'BOS',
    conference: 'East',
    colors: { primary: '#007A33', secondary: '#BA9653', onPrimary: '#FFFFFF' },
    numericId: '1610612738'
  },
  'team-bkn': {
    id: 'team-bkn',
    fullName: 'Brooklyn Nets',
    abbreviation: 'BKN',
    conference: 'East',
    colors: { primary: '#000000', secondary: '#FFFFFF', onPrimary: '#FFFFFF' },
    numericId: '1610612751'
  },
  'team-cha': {
    id: 'team-cha',
    fullName: 'Charlotte Hornets',
    abbreviation: 'CHA',
    conference: 'East',
    colors: { primary: '#1D1160', secondary: '#00788C', onPrimary: '#FFFFFF' },
    numericId: '1610612766'
  },
  'team-chi': {
    id: 'team-chi',
    fullName: 'Chicago Bulls',
    abbreviation: 'CHI',
    conference: 'East',
    colors: { primary: '#CE1141', secondary: '#000000', onPrimary: '#FFFFFF' },
    numericId: '1610612741'
  },
  'team-cle': {
    id: 'team-cle',
    fullName: 'Cleveland Cavaliers',
    abbreviation: 'CLE',
    conference: 'East',
    colors: { primary: '#6F263D', secondary: '#FFB81C', onPrimary: '#FFFFFF' },
    numericId: '1610612739'
  },
  'team-dal': {
    id: 'team-dal',
    fullName: 'Dallas Mavericks',
    abbreviation: 'DAL',
    conference: 'West',
    colors: { primary: '#00538C', secondary: '#002B5E', onPrimary: '#FFFFFF' },
    numericId: '1610612742'
  },
  'team-den': {
    id: 'team-den',
    fullName: 'Denver Nuggets',
    abbreviation: 'DEN',
    conference: 'West',
    colors: { primary: '#0E2240', secondary: '#FEC524', onPrimary: '#FFFFFF' },
    numericId: '1610612743'
  },
  'team-det': {
    id: 'team-det',
    fullName: 'Detroit Pistons',
    abbreviation: 'DET',
    conference: 'East',
    colors: { primary: '#C8102E', secondary: '#006BB6', onPrimary: '#FFFFFF' },
    numericId: '1610612765'
  },
  'team-gsw': {
    id: 'team-gsw',
    fullName: 'Golden State Warriors',
    abbreviation: 'GSW',
    conference: 'West',
    colors: { primary: '#1D428A', secondary: '#FFC72C', onPrimary: '#FFFFFF' },
    numericId: '1610612744'
  },
  'team-hou': {
    id: 'team-hou',
    fullName: 'Houston Rockets',
    abbreviation: 'HOU',
    conference: 'West',
    colors: { primary: '#CE1141', secondary: '#000000', onPrimary: '#FFFFFF' },
    numericId: '1610612745'
  },
  'team-ind': {
    id: 'team-ind',
    fullName: 'Indiana Pacers',
    abbreviation: 'IND',
    conference: 'East',
    colors: { primary: '#002D62', secondary: '#FDBB30', onPrimary: '#FFFFFF' },
    numericId: '1610612754'
  },
  'team-lac': {
    id: 'team-lac',
    fullName: 'LA Clippers',
    abbreviation: 'LAC',
    conference: 'West',
    colors: { primary: '#C8102E', secondary: '#1D428A', onPrimary: '#FFFFFF' },
    numericId: '1610612746'
  },
  'team-lal': {
    id: 'team-lal',
    fullName: 'Los Angeles Lakers',
    abbreviation: 'LAL',
    conference: 'West',
    colors: { primary: '#552583', secondary: '#FDB927', onPrimary: '#FFFFFF' },
    numericId: '1610612747'
  },
  'team-mem': {
    id: 'team-mem',
    fullName: 'Memphis Grizzlies',
    abbreviation: 'MEM',
    conference: 'West',
    colors: { primary: '#5D76A9', secondary: '#12173F', onPrimary: '#FFFFFF' },
    numericId: '1610612763'
  },
  'team-mia': {
    id: 'team-mia',
    fullName: 'Miami Heat',
    abbreviation: 'MIA',
    conference: 'East',
    colors: { primary: '#98002E', secondary: '#F9A01B', onPrimary: '#FFFFFF' },
    numericId: '1610612748'
  },
  'team-mil': {
    id: 'team-mil',
    fullName: 'Milwaukee Bucks',
    abbreviation: 'MIL',
    conference: 'East',
    colors: { primary: '#00471B', secondary: '#EEE1C6', onPrimary: '#FFFFFF' },
    numericId: '1610612749'
  },
  'team-min': {
    id: 'team-min',
    fullName: 'Minnesota Timberwolves',
    abbreviation: 'MIN',
    conference: 'West',
    colors: { primary: '#0C2340', secondary: '#236192', onPrimary: '#FFFFFF' },
    numericId: '1610612750'
  },
  'team-nop': {
    id: 'team-nop',
    fullName: 'New Orleans Pelicans',
    abbreviation: 'NOP',
    conference: 'West',
    colors: { primary: '#0C2340', secondary: '#C8102E', onPrimary: '#FFFFFF' },
    numericId: '1610612740'
  },
  'team-nyk': {
    id: 'team-nyk',
    fullName: 'New York Knicks',
    abbreviation: 'NYK',
    conference: 'East',
    colors: { primary: '#006BB6', secondary: '#F58426', onPrimary: '#FFFFFF' },
    numericId: '1610612752'
  },
  'team-okc': {
    id: 'team-okc',
    fullName: 'Oklahoma City Thunder',
    abbreviation: 'OKC',
    conference: 'West',
    colors: { primary: '#007AC1', secondary: '#EF3B24', onPrimary: '#FFFFFF' },
    numericId: '1610612760'
  },
  'team-orl': {
    id: 'team-orl',
    fullName: 'Orlando Magic',
    abbreviation: 'ORL',
    conference: 'East',
    colors: { primary: '#0077C0', secondary: '#C4CED4', onPrimary: '#FFFFFF' },
    numericId: '1610612753'
  },
  'team-phi': {
    id: 'team-phi',
    fullName: 'Philadelphia 76ers',
    abbreviation: 'PHI',
    conference: 'East',
    colors: { primary: '#006BB6', secondary: '#ED174C', onPrimary: '#FFFFFF' },
    numericId: '1610612755'
  },
  'team-phx': {
    id: 'team-phx',
    fullName: 'Phoenix Suns',
    abbreviation: 'PHX',
    conference: 'West',
    colors: { primary: '#1D1160', secondary: '#E56020', onPrimary: '#FFFFFF' },
    numericId: '1610612756'
  },
  'team-por': {
    id: 'team-por',
    fullName: 'Portland Trail Blazers',
    abbreviation: 'POR',
    conference: 'West',
    colors: { primary: '#E03A3E', secondary: '#000000', onPrimary: '#FFFFFF' },
    numericId: '1610612757'
  },
  'team-sac': {
    id: 'team-sac',
    fullName: 'Sacramento Kings',
    abbreviation: 'SAC',
    conference: 'West',
    colors: { primary: '#5A2D81', secondary: '#63727A', onPrimary: '#FFFFFF' },
    numericId: '1610612758'
  },
  'team-sas': {
    id: 'team-sas',
    fullName: 'San Antonio Spurs',
    abbreviation: 'SAS',
    conference: 'West',
    colors: { primary: '#C4CED4', secondary: '#000000', onPrimary: '#111111' },
    numericId: '1610612759'
  },
  'team-tor': {
    id: 'team-tor',
    fullName: 'Toronto Raptors',
    abbreviation: 'TOR',
    conference: 'East',
    colors: { primary: '#CE1141', secondary: '#000000', onPrimary: '#FFFFFF' },
    numericId: '1610612761'
  },
  'team-uta': {
    id: 'team-uta',
    fullName: 'Utah Jazz',
    abbreviation: 'UTA',
    conference: 'West',
    colors: { primary: '#002B5C', secondary: '#F9A01B', onPrimary: '#FFFFFF' },
    numericId: '1610612762'
  },
  'team-was': {
    id: 'team-was',
    fullName: 'Washington Wizards',
    abbreviation: 'WAS',
    conference: 'East',
    colors: { primary: '#002B5C', secondary: '#E31837', onPrimary: '#FFFFFF' },
    numericId: '1610612764'
  }
};

/**
 * Get team data by team ID (e.g., "team-atl")
 */
export function getTeamById(teamId: string): TeamData | null {
  return NBA_TEAMS[teamId] || null;
}

/**
 * Get team data by full name (e.g., "Atlanta Hawks")
 */
export function getTeamByName(teamName: string): TeamData | null {
  const team = Object.values(NBA_TEAMS).find(
    (t) => t.fullName.toLowerCase() === teamName.toLowerCase()
  );
  return team || null;
}

/**
 * Get team abbreviation from team ID or name
 */
export function getTeamAbbreviation(teamIdOrName: string): string {
  if (!teamIdOrName) return 'N/A';

  // First try as team ID
  const teamById = getTeamById(teamIdOrName);
  if (teamById) return teamById.abbreviation;

  // Then try as team name
  const teamByName = getTeamByName(teamIdOrName);
  if (teamByName) return teamByName.abbreviation;

  return teamIdOrName; // fallback to original string
}

/**
 * Get team color from team ID or name
 */
export function getTeamColor(
  teamIdOrName: string,
  variant: keyof TeamColors = 'primary'
): string {
  if (!teamIdOrName) return variant === 'onPrimary' ? '#111111' : '#CCCCCC';

  // First try as team ID
  const teamById = getTeamById(teamIdOrName);
  if (teamById) return teamById.colors[variant];

  // Then try as team name
  const teamByName = getTeamByName(teamIdOrName);
  if (teamByName) return teamByName.colors[variant];

  // Default fallback
  return variant === 'onPrimary' ? '#111111' : '#CCCCCC';
}

/**
 * Get NBA CDN logo URL from team ID or name
 */
export function getTeamLogoUrl(teamIdOrName: string | null | undefined): string | null {
  if (!teamIdOrName) return null;

  // First try as team ID
  const teamById = getTeamById(teamIdOrName);
  if (teamById) {
    return `https://cdn.nba.com/logos/nba/${teamById.numericId}/primary/L/logo.svg`;
  }

  // Then try as team name
  const teamByName = getTeamByName(teamIdOrName);
  if (teamByName) {
    return `https://cdn.nba.com/logos/nba/${teamByName.numericId}/primary/L/logo.svg`;
  }

  return null;
}

/**
 * Get conference from team ID
 */
export function getConferenceFromTeamId(teamId: string | null | undefined): 'East' | 'West' | null {
  if (!teamId) return null;
  const team = getTeamById(teamId);
  return team?.conference || null;
}

/**
 * Get all teams in a conference
 */
export function getTeamsByConference(conference: 'East' | 'West'): TeamData[] {
  return Object.values(NBA_TEAMS).filter(team => team.conference === conference);
}

/**
 * Get all team IDs
 */
export function getAllTeamIds(): string[] {
  return Object.keys(NBA_TEAMS);
}

/**
 * Get all team names
 */
export function getAllTeamNames(): string[] {
  return Object.values(NBA_TEAMS).map(team => team.fullName);
}
