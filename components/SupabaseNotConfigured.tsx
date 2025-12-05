export function SupabaseNotConfigured() {
	return (
		<div className="text-center py-16">
		<div className="inline-block p-4 bg-red-100 rounded-full mb-4">
		  <svg
			className="w-12 h-12 text-red-500"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		  >
			<path
			  strokeLinecap="round"
			  strokeLinejoin="round"
			  strokeWidth={2}
			  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
			/>
		  </svg>
		</div>
		<h2 className="text-xl font-semibold text-gray-900 mb-2">
		  Supabase Not Configured
		</h2>
		<p className="text-gray-600 text-lg mb-4">
		  Please configure your Supabase credentials in{" "}
		  <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>
		</p>
		<p className="text-sm text-gray-500">
		  See{" "}
		  <code className="bg-gray-100 px-2 py-1 rounded">
			SUPABASE_SETUP.md
		  </code>{" "}
		  for instructions.
		</p>
	  </div>
	);
  }