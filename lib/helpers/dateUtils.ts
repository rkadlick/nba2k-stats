import { Season } from "../types";

function getSeasonFromDate(
	dateString: string,
	seasons: Season[]
  ): string | null {
	if (!dateString) return null;
	const date = new Date(dateString);
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	const seasonStart = month >= 9 ? year : year - 1;
	const match = seasons.find((s) => s.year_start === seasonStart);
	return match?.id || null;
  }

  export { getSeasonFromDate };