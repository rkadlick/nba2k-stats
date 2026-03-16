import { Season } from "../types";

function getSeasonFromDate(
	dateString: string,
	seasons: Season[]
  ): string | null {
	if (!dateString) return null;
	// Parse as local date to avoid UTC timezone shifting
	const [y, m, day] = dateString.split("T")[0].split("-").map(Number);
	if (isNaN(y) || isNaN(m) || isNaN(day)) return null;
	const date = new Date(y, m - 1, day);
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	const seasonStart = month >= 9 ? year : year - 1;
	const match = seasons.find((s) => s.year_start === seasonStart);
	return match?.id || null;
  }

  export { getSeasonFromDate };