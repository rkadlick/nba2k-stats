-- NBA Teams with Official Colors
-- Run this BEFORE seed.sql

-- Insert all 30 NBA teams with their official primary and secondary colors
insert into teams (id, name, primary_color, secondary_color) values
  -- Eastern Conference - Atlantic Division
  ('team-bos', 'Boston Celtics', '#007A33', '#BA9653'),
  ('team-bkn', 'Brooklyn Nets', '#000000', '#FFFFFF'),
  ('team-nyk', 'New York Knicks', '#006BB6', '#F58426'),
  ('team-phi', 'Philadelphia 76ers', '#006BB6', '#ED174C'),
  ('team-tor', 'Toronto Raptors', '#CE1141', '#000000'),

  -- Eastern Conference - Central Division
  ('team-chi', 'Chicago Bulls', '#CE1141', '#000000'),
  ('team-cle', 'Cleveland Cavaliers', '#860038', '#FDBB30'),
  ('team-det', 'Detroit Pistons', '#C8102E', '#1D42BA'),
  ('team-ind', 'Indiana Pacers', '#002D62', '#FDBB30'),
  ('team-mil', 'Milwaukee Bucks', '#00471B', '#EEE1C6'),

  -- Eastern Conference - Southeast Division
  ('team-atl', 'Atlanta Hawks', '#E03A3E', '#C1D32F'),
  ('team-cha', 'Charlotte Hornets', '#1D1160', '#00788C'),
  ('team-mia', 'Miami Heat', '#98002E', '#F9A01B'),
  ('team-orl', 'Orlando Magic', '#0077C0', '#C4CED4'),
  ('team-was', 'Washington Wizards', '#002B5C', '#E31837'),

  -- Western Conference - Northwest Division
  ('team-den', 'Denver Nuggets', '#0E2240', '#FEC524'),
  ('team-min', 'Minnesota Timberwolves', '#0C2340', '#236192'),
  ('team-okc', 'Oklahoma City Thunder', '#007AC1', '#EF1B24'),
  ('team-por', 'Portland Trail Blazers', '#E03A3E', '#000000'),
  ('team-uta', 'Utah Jazz', '#002B5C', '#F9A01B'),

  -- Western Conference - Pacific Division
  ('team-gsw', 'Golden State Warriors', '#1D428A', '#FFC72C'),
  ('team-lac', 'LA Clippers', '#C8102E', '#1D42BA'),
  ('team-lal', 'Los Angeles Lakers', '#552583', '#FDB927'),
  ('team-phx', 'Phoenix Suns', '#1D1160', '#E56020'),
  ('team-sac', 'Sacramento Kings', '#5A2D81', '#63727A'),

  -- Western Conference - Southwest Division
  ('team-dal', 'Dallas Mavericks', '#00538C', '#002B5E'),
  ('team-hou', 'Houston Rockets', '#CE1141', '#000000'),
  ('team-mem', 'Memphis Grizzlies', '#5D76A9', '#12173F'),
  ('team-nop', 'New Orleans Pelicans', '#0C2340', '#C8102E'),
  ('team-sas', 'San Antonio Spurs', '#C4CED4', '#000000')
on conflict (id) do update set
  name = excluded.name,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color;

