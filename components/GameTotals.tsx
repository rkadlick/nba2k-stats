import React from "react";

export function GameTotals({
  seasonTotalsKeys,
  getTotalValue,
  getAvgValue,
  getStatTooltip,
  getStatLabel,
}: {
  seasonTotalsKeys: string[];
  getTotalValue: (key: string) => string;
  getAvgValue: (key: string) => string;
  getStatTooltip: (key: string) => string;
  getStatLabel: (key: string) => string;
}) {
  return (
    <>
      {/* Horizontal scroll container for split view */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-full">
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
						{getTotalValue(key)}
					  </td>
					);
				} else {
					return (
					  <td
						key={key}
						className="text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap"
					  >
						{getTotalValue(key)}
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
						{getAvgValue(key)}
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
