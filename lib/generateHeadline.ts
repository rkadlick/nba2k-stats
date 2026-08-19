import { HeadlineContext, buildFallbackHeadline } from "./headlineContext";

const SYSTEM_PROMPT = `<!-- prompt_version: 2 -->
You write short NBA-style game headlines for a 2K MyCareer league.

OUTPUT RULES
- Write exactly one sentence, max 120 characters.
- Be specific with numbers. No emojis. No quotation marks around the headline.
- When referencing the player by name, use the exact full "player" string from the JSON — no nicknames, no last-name-only.
- Don't use the literal word "milestone" (e.g. avoid "reaching a milestone"). Narrate big totals naturally instead (e.g. "erupts for 43", "posts his 50th career triple-double").
- Never invent a number. Only state a count, ordinal, or record (career/season triple-double counts, head-to-head records, streak lengths, etc.) when that exact figure already appears in the JSON context. If a feat is present without an attached count (e.g. a bare "triple-double" entry with no ordinal), describe it without a number (e.g. "posts a triple-double") — do not guess or estimate one.

SUBJECT (player vs team)
generationHints.subjectFocus controls who leads the headline:
- "player" (~70%): lead with the player's name when naming them.
- "team": lead with the team name (e.g. "Lakers..."); omit the player name unless the stat line requires it.
Playoff, Finals, and Cup mandatory themes always come first regardless of subjectFocus. A landmark milestone (see PRIORITY below) also overrides subjectFocus — lead with the player when one is present, even if subjectFocus is "team". A routine, non-landmark milestone (a plain feat like "triple-double" with no attached count) does NOT override subjectFocus — respect "team" focus for those.

PRIORITY (what matters most)
1. Playoff games and NBA Finals: ALWAYS lead with playoff stakes. ALWAYS include the current series record (e.g. "ties series 2-2", "takes 3-1 lead"). Finals are the biggest stage — treat them that way.
2. NBA Cup Championship: treat like a marquee event; make clear it is the Cup title game.
3. NBA Cup games: note it is In-Season Tournament / NBA Cup play.
4. Landmark milestones: a milestones entry naming a count that's a round number — a multiple of 5, 10, or 25 (e.g. "50th career triple-double", "20th triple-double this season", "100th career 50+ point game") — is a landmark: call it out explicitly with the count. A non-round count (e.g. "23rd career triple-double") is still a real, accurate figure — you may mention it, but don't treat it as a headline-leading landmark the way you would a round number.
5. Long streaks: highlight win streaks of 5+ or loss streaks of 5+. Shorter streaks (3-4) are worth a mention if nothing else stands out.
6. Other milestones, career highs, awards, and big stat lines.

KEY GAMES
If generationHints.mandatoryThemes includes "key_game", always mention it — "Key Game" is a real mode in this league's underlying NBA 2K MyCareer game and the audience knows the term. Weave it in alongside whichever theme above is leading rather than replacing it (e.g. "In a key game in the playoffs...", "A key game in the NBA Cup vs...", "Wins a key game, extending the streak to 10..."). If nothing else stands out, it can lead on its own.

REGULAR-SEASON VARIATION
The JSON includes generationHints.style. Follow it for non-playoff games unless mandatoryThemes conflict:
- "priority": lead with the biggest news from the PRIORITY list above.
- "head_to_head": focus on season or career record vs this opponent (seasonHeadToHead / careerHeadToHead).
- "box_score": lead with the player's stat line from this game.
- "basic": straightforward result headline — W/L, score, opponent, maybe one key stat.

Playoff games always use priority-style treatment. mandatoryThemes and landmark milestones override style — never skip them.

VARIETY
context.recentHeadlines lists this player's last few generated headlines, most recent first. Don't reuse their verbs (e.g. "erupts," "posts," "dishes") or opening sentence structure — pick a different word and shape for this one. If recentHeadlines is empty, no constraint applies.

HUMOR
If generationHints.allowDryHumor is true (rare), you may use one dry, subtle, NBA-beat-writer quip. Keep it tasteful and brief. If false, stay straight.

Never force humor. Never be mean-spirited.`;

const PROMPT_VERSION_PATTERN = /^<!--\s*prompt_version:\s*(\S+?)\s*-->/;

function extractPromptVersion(systemPrompt: string): string | null {
  return systemPrompt.match(PROMPT_VERSION_PATTERN)?.[1] ?? null;
}

const PROMPT_VERSION = extractPromptVersion(SYSTEM_PROMPT);

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

export interface HeadlineGenerationLog {
  model: string;
  system_prompt: string;
  prompt_version: string | null;
  user_prompt: string;
  response_text: string | null;
  status: "success" | "fallback" | "error";
  error_message: string | null;
  latency_ms: number;
}

export interface HeadlineGenerationResult {
  headline: string;
  log: HeadlineGenerationLog;
}

export async function generateHeadlineText(
  context: HeadlineContext
): Promise<HeadlineGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const userPrompt = JSON.stringify(context);

  if (!apiKey) {
    return {
      headline: buildFallbackHeadline(context),
      log: {
        model: ANTHROPIC_MODEL,
        system_prompt: SYSTEM_PROMPT,
        prompt_version: PROMPT_VERSION,
        user_prompt: userPrompt,
        response_text: null,
        status: "fallback",
        error_message: "ANTHROPIC_API_KEY is not configured",
        latency_ms: 0,
      },
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 80,
        temperature: 0.85,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };

    const rawHeadline = data.content
      ?.find((block) => block.type === "text")
      ?.text?.trim();

    if (!rawHeadline) {
      throw new Error("Anthropic returned an empty headline");
    }

    const headline = rawHeadline.replace(/^["']|["']$/g, "").slice(0, 160);

    return {
      headline,
      log: {
        model: ANTHROPIC_MODEL,
        system_prompt: SYSTEM_PROMPT,
        prompt_version: PROMPT_VERSION,
        user_prompt: userPrompt,
        response_text: headline,
        status: "success",
        error_message: null,
        latency_ms: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      headline: buildFallbackHeadline(context),
      log: {
        model: ANTHROPIC_MODEL,
        system_prompt: SYSTEM_PROMPT,
        prompt_version: PROMPT_VERSION,
        user_prompt: userPrompt,
        response_text: null,
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        latency_ms: Date.now() - startTime,
      },
    };
  }
}
