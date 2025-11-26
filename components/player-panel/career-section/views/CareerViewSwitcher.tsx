import React from 'react';

interface CareerViewSwitcherProps {
	viewMode: string;
	onChange: (mode: "overview" | "awards" | "splits" | "playoffs") => void;
}

export function CareerViewSwitcher({
	viewMode,
	onChange,
}: CareerViewSwitcherProps) {

	const options = [
		{ label: 'Overview', value: 'overview' },
		{ label: 'Awards', value: 'awards' },
		{ label: 'Splits', value: 'splits' },
		{ label: 'Playoffs', value: 'playoffs' },
	];

	return (
		<div className="mb-3 text-xs">
			<span className="font-bold text-gray-900">View:</span>{' '}
			{options.map((opt, i) => (
				<React.Fragment key={opt.value}>
					<button
						onClick={() => onChange(opt.value as "overview" | "awards" | "splits" | "playoffs")}
						className={
							viewMode === opt.value
								? 'text-blue-600 font-semibold underline'
								: 'text-blue-500 hover:text-blue-700 cursor-pointer'
						}
					>
						{opt.label}
					</button>
					{i < options.length - 1 && (
						<span className="text-gray-400 mx-1">•</span>
					)}
				</React.Fragment>
			))}
		</div>
	);
}
