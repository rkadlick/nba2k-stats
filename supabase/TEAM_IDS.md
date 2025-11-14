# NBA Team IDs Reference

Quick reference for team IDs used in the database. All teams are populated via `teams.sql`.

## Team ID Format

All team IDs follow the pattern: `team-xxx` where `xxx` is a 3-letter abbreviation.

## Complete Team List

### Eastern Conference - Atlantic Division
- `team-bos` - Boston Celtics
- `team-bkn` - Brooklyn Nets
- `team-nyk` - New York Knicks
- `team-phi` - Philadelphia 76ers
- `team-tor` - Toronto Raptors

### Eastern Conference - Central Division
- `team-chi` - Chicago Bulls
- `team-cle` - Cleveland Cavaliers
- `team-det` - Detroit Pistons
- `team-ind` - Indiana Pacers
- `team-mil` - Milwaukee Bucks

### Eastern Conference - Southeast Division
- `team-atl` - Atlanta Hawks
- `team-cha` - Charlotte Hornets
- `team-mia` - Miami Heat
- `team-orl` - Orlando Magic
- `team-was` - Washington Wizards

### Western Conference - Northwest Division
- `team-den` - Denver Nuggets
- `team-min` - Minnesota Timberwolves
- `team-okc` - Oklahoma City Thunder
- `team-por` - Portland Trail Blazers
- `team-uta` - Utah Jazz

### Western Conference - Pacific Division
- `team-gsw` - Golden State Warriors
- `team-lac` - LA Clippers
- `team-lal` - Los Angeles Lakers
- `team-phx` - Phoenix Suns
- `team-sac` - Sacramento Kings

### Western Conference - Southwest Division
- `team-dal` - Dallas Mavericks
- `team-hou` - Houston Rockets
- `team-mem` - Memphis Grizzlies
- `team-nop` - New Orleans Pelicans
- `team-sas` - San Antonio Spurs

## Usage Examples

### In SQL Queries
```sql
-- Reference a team in player_stats
insert into player_stats (player_id, season_id, opponent_team_id, ...) values
  ('player-1', 'season-2024-25', 'team-lal', ...);

-- Reference a team in players table
update players set team_id = 'team-bos' where id = 'player-1';
```

### In Application Code
```typescript
// Team IDs are stored as strings
const lakersId = 'team-lal';
const celticsId = 'team-bos';
```

## Adding New Teams

If you need to add a team that's not in the list, add it to `teams.sql` following the same pattern:

```sql
insert into teams (id, name, primary_color, secondary_color) values
  ('team-xxx', 'Team Name', '#HEXCOLOR', '#HEXCOLOR');
```

