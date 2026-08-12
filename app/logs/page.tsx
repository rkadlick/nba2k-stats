"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TbArrowLeft } from "react-icons/tb";
import { useAuth } from "@/hooks/auth/useAuth";
import { useGenerationLogs, AiGenerationLog } from "@/hooks/data/useGenerationLogs";
import { LoadingState } from "@/components/LoadingState";
import { tableSurfaces } from "@/components/stat-table/theme";

const STATUS_STYLES: Record<AiGenerationLog["status"], string> = {
  success: "bg-[color:var(--color-win-bg)] text-[color:var(--color-win-text)]",
  fallback: "bg-yellow-100 text-yellow-800",
  error: "bg-[color:var(--color-loss-bg)] text-[color:var(--color-loss-text)]",
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function LogRow({ log }: { log: AiGenerationLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={`border-b ${tableSurfaces.border} ${tableSurfaces.rowHover} transition-colors cursor-pointer`}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <td className="px-2 py-1.5 text-xs text-[color:var(--color-text)] whitespace-nowrap">
          {formatTimestamp(log.created_at)}
        </td>
        <td className="px-2 py-1.5 text-xs">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_STYLES[log.status]}`}
          >
            {log.status}
          </span>
        </td>
        <td className="px-2 py-1.5 text-xs text-[color:var(--color-text)] whitespace-nowrap">
          {log.feature}
        </td>
        <td className="px-2 py-1.5 text-xs text-[color:var(--color-text-muted)] whitespace-nowrap">
          {log.model ?? "–"}
        </td>
        <td className="px-2 py-1.5 text-xs text-[color:var(--color-text-muted)] whitespace-nowrap">
          {log.prompt_version ?? "–"}
        </td>
        <td className="px-2 py-1.5 text-xs text-[color:var(--color-text-muted)] whitespace-nowrap text-right">
          {log.latency_ms != null ? `${log.latency_ms}ms` : "–"}
        </td>
        <td className="px-2 py-1.5 text-xs text-[color:var(--color-text)] max-w-md truncate">
          {log.response_text ?? log.error_message ?? "–"}
        </td>
      </tr>
      {expanded && (
        <tr className={`border-b ${tableSurfaces.border}`}>
          <td colSpan={7} className="px-4 py-3 bg-[color:var(--color-surface-muted)]">
            <div className="grid gap-3 text-xs">
              {log.error_message && (
                <div>
                  <div className="font-semibold text-[color:var(--color-loss-text)] mb-1">Error</div>
                  <pre className="whitespace-pre-wrap break-words text-[color:var(--color-text)]">
                    {log.error_message}
                  </pre>
                </div>
              )}
              {log.system_prompt && (
                <div>
                  <div className="font-semibold text-[color:var(--color-text)] mb-1">System prompt</div>
                  <pre className="whitespace-pre-wrap break-words text-[color:var(--color-text-muted)]">
                    {log.system_prompt}
                  </pre>
                </div>
              )}
              <div>
                <div className="font-semibold text-[color:var(--color-text)] mb-1">User prompt</div>
                <pre className="whitespace-pre-wrap break-words text-[color:var(--color-text-muted)]">
                  {log.user_prompt}
                </pre>
              </div>
              {log.response_text && (
                <div>
                  <div className="font-semibold text-[color:var(--color-text)] mb-1">Response</div>
                  <pre className="whitespace-pre-wrap break-words text-[color:var(--color-text-muted)]">
                    {log.response_text}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function LogsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { logs, loading: logsLoading } = useGenerationLogs();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  if (authLoading || !currentUser) return <LoadingState />;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-text)] transition-colors">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mb-4 text-sm font-medium text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] transition-colors cursor-pointer"
        >
          <TbArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-1">AI Generation Logs</h1>
        <p className="text-sm text-[color:var(--color-text-muted)] mb-6">
          Recent prompts and responses sent to the LLM (most recent 100). Click a row to see the full prompt/response.
        </p>

        {logsLoading ? (
          <p className="text-sm text-[color:var(--color-text-muted)]">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-[color:var(--color-text-muted)]">No generations logged yet.</p>
        ) : (
          <div className={`overflow-auto rounded-xl border ${tableSurfaces.border} ${tableSurfaces.tableBg}`}>
            <table className="min-w-full table-auto border-collapse">
              <thead className={`sticky top-0 z-10 border-b-2 ${tableSurfaces.header} ${tableSurfaces.border}`}>
                <tr>
                  <th className="text-left px-2 py-2 font-semibold text-xs">Time</th>
                  <th className="text-left px-2 py-2 font-semibold text-xs">Status</th>
                  <th className="text-left px-2 py-2 font-semibold text-xs">Feature</th>
                  <th className="text-left px-2 py-2 font-semibold text-xs">Model</th>
                  <th className="text-left px-2 py-2 font-semibold text-xs">Prompt v</th>
                  <th className="text-right px-2 py-2 font-semibold text-xs">Latency</th>
                  <th className="text-left px-2 py-2 font-semibold text-xs">Response / Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
