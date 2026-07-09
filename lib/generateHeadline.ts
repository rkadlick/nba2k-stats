import { HeadlineContext, buildFallbackHeadline } from "./headlineContext";

const SYSTEM_PROMPT = `You write short NBA-style game headlines for a 2K MyCareer league.

OUTPUT RULES
- Write exactly one sentence, max 120 characters.
- Be specific with numbers. No emojis. No quotation marks around the headline.
- When referencing the player by name, use the exact full "player" string from the JSON — no nicknames, no last-name-only.

SUBJECT (player vs team)
generationHints.subjectFocus controls who leads the headline:
- "player" (~70%): lead with the player's name when naming them.
- "team": lead with the team name (e.g. "Lakers..."); omit the player name unless the stat line requires it.
Playoff, Finals, and Cup mandatory themes still come first regardless of subjectFocus.

PRIORITY (what matters most)
1. Playoff games and NBA Finals: ALWAYS lead with playoff stakes. ALWAYS include the current series record (e.g. "ties series 2-2", "takes 3-1 lead"). Finals are the biggest stage — treat them that way.
2. NBA Cup Championship: treat like a marquee event; make clear it is the Cup title game.
3. NBA Cup games: note it is In-Season Tournament / NBA Cup play.
4. Long streaks: highlight win streaks of 5+ or loss streaks of 5+. Shorter streaks (3-4) are worth a mention if nothing else stands out.
5. Milestones, career highs, awards, and big stat lines.

REGULAR-SEASON VARIATION
The JSON includes generationHints.style. Follow it for non-playoff games unless mandatoryThemes conflict:
- "priority": lead with the biggest news from the context above.
- "head_to_head": focus on season or career record vs this opponent (seasonHeadToHead / careerHeadToHead).
- "box_score": lead with the player's stat line from this game.
- "basic": straightforward result headline — W/L, score, opponent, maybe one key stat.

Playoff games always use priority-style treatment. mandatoryThemes override style — never skip them.

HUMOR
If generationHints.allowDryHumor is true (rare), you may use one dry, subtle, NBA-beat-writer quip. Keep it tasteful and brief. If false, stay straight.

Never force humor. Never be mean-spirited.`;

const ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";

export async function generateHeadlineText(
  context: HeadlineContext
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return buildFallbackHeadline(context);
  }

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
            content: JSON.stringify(context),
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

    const headline = data.content
      ?.find((block) => block.type === "text")
      ?.text?.trim();

    if (!headline) {
      throw new Error("Anthropic returned an empty headline");
    }

    return headline.replace(/^["']|["']$/g, "").slice(0, 160);
  } catch {
    return buildFallbackHeadline(context);
  }
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
