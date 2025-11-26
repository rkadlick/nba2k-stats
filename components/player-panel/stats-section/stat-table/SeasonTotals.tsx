import React from "react";

interface SeasonTotalsProps {
  seasonTotalsData: { totals: Record<string, number>; averages: Record<string, number>; count: number };
  seasonTotalsKeys: string[];
  getStatTooltip: (key: string) => string;
  getStatLabel: (key: string) => string;
}

export function SeasonTotals({
  seasonTotalsData,
  seasonTotalsKeys,
  getStatTooltip,
  getStatLabel,
}: SeasonTotalsProps) {

  const formatTotalValue = (key: string): string => {
    // Handle double/triple doubles - these are totals, not averages
    if (key === "double_doubles" || key === "triple_doubles") {
      const value = seasonTotalsData.totals[key];
      return value !== undefined ? value.toString() : "0";
    }

    // Handle percentage columns (only in season totals) - display as decimals (0.722)
    if (key === "fg_percentage") {
      const made = seasonTotalsData.totals.fg_made;
      const attempted = seasonTotalsData.totals.fg_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return "–";
    }
    if (key === "three_pt_percentage") {
      const made = seasonTotalsData.totals.threes_made;
      const attempted = seasonTotalsData.totals.threes_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return "–";
    }
    if (key === "ft_percentage") {
      const made = seasonTotalsData.totals.ft_made;
      const attempted = seasonTotalsData.totals.ft_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return "–";
    }

    if (key === "fg") {
      const made = seasonTotalsData.totals.fg_made;
      const attempted = seasonTotalsData.totals.fg_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return "–";
    }
    if (key === "threes") {
      const made = seasonTotalsData.totals.threes_made;
      const attempted = seasonTotalsData.totals.threes_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return "–";
    }
    if (key === "ft") {
      const made = seasonTotalsData.totals.ft_made;
      const attempted = seasonTotalsData.totals.ft_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return "–";
    }

    const value = seasonTotalsData.totals[key];
    if (value !== undefined) {
      return value.toFixed(value % 1 === 0 ? 0 : 1);
    }
    return "–";
  };

  const formatAvgValue = (key: string): string => {
    // Handle percentage columns - display as decimals (0.722)
    if (key === "fg_percentage") {
      const made = seasonTotalsData.totals.fg_made;
      const attempted = seasonTotalsData.totals.fg_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return "–";
    }
    if (key === "three_pt_percentage") {
      const made = seasonTotalsData.totals.threes_made;
      const attempted = seasonTotalsData.totals.threes_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return "–";
    }
    if (key === "ft_percentage") {
      const made = seasonTotalsData.totals.ft_made;
      const attempted = seasonTotalsData.totals.ft_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return "–";
    }

    if (key === "fg" || key === "threes" || key === "ft") {
      // For shooting stats, show percentage in averages as decimals (0.722)
      let made: number | undefined;
      let attempted: number | undefined;

      if (key === "fg") {
        made = seasonTotalsData.totals.fg_made;
        attempted = seasonTotalsData.totals.fg_attempted;
      } else if (key === "threes") {
        made = seasonTotalsData.totals.threes_made;
        attempted = seasonTotalsData.totals.threes_attempted;
      } else if (key === "ft") {
        made = seasonTotalsData.totals.ft_made;
        attempted = seasonTotalsData.totals.ft_attempted;
      }

      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return "–";
    }

    const value = seasonTotalsData.averages[key];
    if (value !== undefined) {
      // Format with 1 decimal place for per-game averages
      return value.toFixed(1);
    }
    return "–";
  };

  return (
    <>
      {/* Horizontal scroll container for split view */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-full border-y border-gray-200">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-sm text-gray-900 sticky left-0 bg-gray-100 z-10 border-b border-gray-300">
                Season Totals
              </th>
              {seasonTotalsKeys.map((key) => {
                const tooltip = getStatTooltip(key);
                return (
                  <th
                    key={key}
                    className="text-right px-2 py-2 font-semibold text-xs text-gray-900 whitespace-nowrap border-b border-gray-300"
                    title={tooltip || undefined}
                  >
                    {getStatLabel(key)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              <td className="px-3 py-2 text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                Totals
              </td>

              {seasonTotalsKeys.map((key) => {
                if (key === 'double_doubles' || key === 'triple_doubles') {
                  return (
                    <td
                      key={key}
                      rowSpan={2}
                      className="text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap bg-gray-50 align-middle"
                    >
                      {formatTotalValue(key)}
                    </td>
                  );
                } else {
                  return (
                    <td
                      key={key}
                      className="text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap"
                    >
                      {formatTotalValue(key)}
                    </td>
                  );
                }
              })}
            </tr>
            <tr className="bg-gray-100">
              <td className="px-3 py-2 text-sm font-semibold text-gray-900 sticky left-0 bg-gray-100 z-10">
                Avg
              </td>
              {seasonTotalsKeys.map((key) => {
                if (key === 'double_doubles' || key === 'triple_doubles') {
                  return null;
                } else {
                  return (
                    <td
                      key={key}
                      className="text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap"
                    >
                      {formatAvgValue(key)}
                    </td>
                  );
                }
              })}

            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
