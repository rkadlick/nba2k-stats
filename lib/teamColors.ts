// nbaTeamColors.ts
export interface TeamColors {
	primary: string;
	secondary: string;
	onPrimary: string; // text color that passes accessibility contrast on the primary background
  }
  
  export const NBA_TEAM_COLORS: Record<string, TeamColors> = {
	'Atlanta Hawks': { primary: '#E03A3E', secondary: '#C1D32F', onPrimary: '#FFFFFF' },
	'Boston Celtics': { primary: '#007A33', secondary: '#BA9653', onPrimary: '#FFFFFF' },
	'Brooklyn Nets': { primary: '#000000', secondary: '#FFFFFF', onPrimary: '#FFFFFF' },
	'Charlotte Hornets': { primary: '#1D1160', secondary: '#00788C', onPrimary: '#FFFFFF' },
	'Chicago Bulls': { primary: '#CE1141', secondary: '#000000', onPrimary: '#FFFFFF' },
	'Cleveland Cavaliers': { primary: '#6F263D', secondary: '#FFB81C', onPrimary: '#FFFFFF' },
	'Dallas Mavericks': { primary: '#00538C', secondary: '#002B5E', onPrimary: '#FFFFFF' },
	'Denver Nuggets': { primary: '#0E2240', secondary: '#FEC524', onPrimary: '#FFFFFF' },
	'Detroit Pistons': { primary: '#C8102E', secondary: '#006BB6', onPrimary: '#FFFFFF' },
	'Golden State Warriors': { primary: '#1D428A', secondary: '#FFC72C', onPrimary: '#FFFFFF' },
	'Houston Rockets': { primary: '#CE1141', secondary: '#000000', onPrimary: '#FFFFFF' },
	'Indiana Pacers': { primary: '#002D62', secondary: '#FDBB30', onPrimary: '#FFFFFF' },
	'Los Angeles Clippers': { primary: '#C8102E', secondary: '#1D428A', onPrimary: '#FFFFFF' },
	'Los Angeles Lakers': { primary: '#552583', secondary: '#FDB927', onPrimary: '#FFFFFF' },
	'Memphis Grizzlies': { primary: '#5D76A9', secondary: '#12173F', onPrimary: '#FFFFFF' },
	'Miami Heat': { primary: '#98002E', secondary: '#F9A01B', onPrimary: '#FFFFFF' },
	'Milwaukee Bucks': { primary: '#00471B', secondary: '#EEE1C6', onPrimary: '#FFFFFF' },
	'Minnesota Timberwolves': { primary: '#0C2340', secondary: '#236192', onPrimary: '#FFFFFF' },
	'New Orleans Pelicans': { primary: '#0C2340', secondary: '#C8102E', onPrimary: '#FFFFFF' },
	'New York Knicks': { primary: '#006BB6', secondary: '#F58426', onPrimary: '#FFFFFF' },
	'Oklahoma City Thunder': { primary: '#007AC1', secondary: '#EF3B24', onPrimary: '#FFFFFF' },
	'Orlando Magic': { primary: '#0077C0', secondary: '#C4CED4', onPrimary: '#FFFFFF' },
	'Philadelphia 76ers': { primary: '#006BB6', secondary: '#ED174C', onPrimary: '#FFFFFF' },
	'Phoenix Suns': { primary: '#1D1160', secondary: '#E56020', onPrimary: '#FFFFFF' },
	'Portland Trail Blazers': { primary: '#E03A3E', secondary: '#000000', onPrimary: '#FFFFFF' },
	'Sacramento Kings': { primary: '#5A2D81', secondary: '#63727A', onPrimary: '#FFFFFF' },
	'San Antonio Spurs': { primary: '#C4CED4', secondary: '#000000', onPrimary: '#111111' },
	'Toronto Raptors': { primary: '#CE1141', secondary: '#000000', onPrimary: '#FFFFFF' },
	'Utah Jazz': { primary: '#002B5C', secondary: '#F9A01B', onPrimary: '#FFFFFF' },
	'Washington Wizards': { primary: '#002B5C', secondary: '#E31837', onPrimary: '#FFFFFF' },
  };
  
  export function getTeamColor(
	teamName: string,
	variant: keyof TeamColors = 'primary'
  ): string {
	const team = Object.keys(NBA_TEAM_COLORS).find(
	  (key) => key.toLowerCase() === teamName.toLowerCase()
	);
  
	if (team) {
	  return NBA_TEAM_COLORS[team][variant];
	}
  
	// Default fallback color
	return variant === 'onPrimary' ? '#111111' : '#CCCCCC';
  }