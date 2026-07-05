import { supabase } from "./supabaseClient";

export async function requestGameHeadline(gameId: string): Promise<void> {
  if (!supabase) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return;

  await fetch("/api/games/generate-headline", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ gameId }),
  });
}
