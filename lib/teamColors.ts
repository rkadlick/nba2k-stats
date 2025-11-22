// nbaTeamColors.ts

export interface TeamColors {
	primary: string;
	secondary: string;
  }
  
  export const NBA_TEAM_COLORS: Record<string, TeamColors> = {
	'Atlanta Hawks': { primary: '#E03A3E', secondary: '#C1D32F' },
	'Boston Celtics': { primary: '#007A33', secondary: '#BA9653' },
	'Brooklyn Nets': { primary: '#000000', secondary: '#FFFFFF' },
	'Charlotte Hornets': { primary: '#1D1160', secondary: '#00788C' },
	'Chicago Bulls': { primary: '#CE1141', secondary: '#000000' },
	'Cleveland Cavaliers': { primary: '#6F263D', secondary: '#FFB81C' },
	'Dallas Mavericks': { primary: '#00538C', secondary: '#002B5E' },
	'Denver Nuggets': { primary: '#0E2240', secondary: '#FEC524' },
	'Detroit Pistons': { primary: '#C8102E', secondary: '#006BB6' },
	'Golden State Warriors': { primary: '#1D428A', secondary: '#FFC72C' },
	'Houston Rockets': { primary: '#CE1141', secondary: '#000000' },
	'Indiana Pacers': { primary: '#002D62', secondary: '#FDBB30' },
	'Los Angeles Clippers': { primary: '#C8102E', secondary: '#1D428A' },
	'Los Angeles Lakers': { primary: '#552583', secondary: '#FDB927' },
	'Memphis Grizzlies': { primary: '#5D76A9', secondary: '#12173F' },
	'Miami Heat': { primary: '#98002E', secondary: '#F9A01B' },
	'Milwaukee Bucks': { primary: '#00471B', secondary: '#EEE1C6' },
	'Minnesota Timberwolves': { primary: '#0C2340', secondary: '#236192' },
	'New Orleans Pelicans': { primary: '#0C2340', secondary: '#C8102E' },
	'New York Knicks': { primary: '#006BB6', secondary: '#F58426' },
	'Oklahoma City Thunder': { primary: '#007AC1', secondary: '#EF3B24' },
	'Orlando Magic': { primary: '#0077C0', secondary: '#C4CED4' },
	'Philadelphia 76ers': { primary: '#006BB6', secondary: '#ED174C' },
	'Phoenix Suns': { primary: '#1D1160', secondary: '#E56020' },
	'Portland Trail Blazers': { primary: '#E03A3E', secondary: '#000000' },
	'Sacramento Kings': { primary: '#5A2D81', secondary: '#63727A' },
	'San Antonio Spurs': { primary: '#C4CED4', secondary: '#000000' },
	'Toronto Raptors': { primary: '#CE1141', secondary: '#000000' },
	'Utah Jazz': { primary: '#002B5C', secondary: '#F9A01B' },
	'Washington Wizards': { primary: '#002B5C', secondary: '#E31837' },
  };

  export function getTeamColor(
	teamName: string,
	variant: 'primary' | 'secondary' = 'primary'
  ): string {
	const team = Object.keys(NBA_TEAM_COLORS).find(
	  (key) => key.toLowerCase() === teamName.toLowerCase()
	);
  
	if (team) {
	  return NBA_TEAM_COLORS[team][variant];
	}
  
	// Default fallback color
	return '#CCCCCC';
  }