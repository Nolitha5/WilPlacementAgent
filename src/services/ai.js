/**
 * src/services/ai.js
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenAI integration for the WIL Placement Agent.
 *
 * Current features:
 *   · openAIWebSearch()   — returns a parsed JSON array via Chat Completions
 *                           (used for live job listings and career news)
 *
 * Future AI integration point (Claude AI Recommendation Engine):
 *   · matchStudents()     — send student profiles + internships to Claude,
 *                           get back ranked recommendations with explanations
 *   · generateCoverLetter() — AI-assisted cover letter drafting
 *   · analyseCV()         — parse uploaded CV and extract structured data
 *
 * IMPORTANT: Never expose API keys in client-side code in production.
 * Move these calls to src/services/ai-server.js (backend) before deploying.
 */

// ── Prompts ───────────────────────────────────────────────────────────────────

export const OPENAI_JOB_PROMPT = `Generate a list of realistic current South African job opportunities for students and recent graduates in 2025. Include a mix of internships, WIL (Work Integrated Learning) placements, graduate programmes, junior vacancies, and entry-level roles. Use real South African companies such as Absa, Standard Bank, MTN, Vodacom, Deloitte, PwC, KPMG, Discovery, Sasol, Eskom, Anglo American, Transnet, Shoprite, Pick n Pay, Capitec, FNB, Woolworths, Nedbank.

Respond with a JSON object in this exact format:
{ "jobs": [ { "id": "ai_1", "title": "...", "company": "...", "location": "City, Province", "type": "Internship|WIL|Graduate|Junior|Entry Level", "duration": "e.g. 12 months", "url": "https://...", "description": "One sentence about the role." }, ... ] }

Include 20 diverse results across different industries and types. Use real company career page URLs where possible.`;

export const OPENAI_NEWS_PROMPT = `Generate a list of realistic South African career news articles and announcements for 2025, covering graduate programmes, learnerships, job market trends, career tips, tech jobs, finance and engineering opportunities for students and recent graduates.

Respond with a JSON object in this exact format:
{ "articles": [ { "id": "n1", "title": "Article headline", "source": "Careers24|BusinessTech|MyBroadband|IOL Business|Daily Maverick|Graduate Placements", "category": "Career Tips|Graduate|Learnerships|Tech|Finance|Engineering", "date": "2025-07-01", "readTime": "4 min", "summary": "2-3 sentence summary of the article.", "url": "https://..." }, ... ] }

Include 12 articles with realistic, varied content. Use plausible article URLs from real South African news sources.`;

// ── Core helper ───────────────────────────────────────────────────────────────

/**
 * Calls the OpenAI Chat Completions API with json_object response format.
 * Extracts and returns the first array found in the parsed JSON object.
 *
 * @param {string} prompt  – Full user prompt to send
 * @returns {Promise<Array|null>}  – Parsed array, or null when no API key set
 * @throws {Error}  – On HTTP error or malformed response
 */
export async function openAIWebSearch(prompt) {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) return null; // no key → caller uses curated fallback

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that always responds with valid JSON only. Never include explanatory text outside the JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI API error ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  // json_object mode wraps results in a key e.g. { "jobs": [...] }
  if (Array.isArray(parsed)) return parsed;
  const arrayValue = Object.values(parsed).find(v => Array.isArray(v));
  if (arrayValue) return arrayValue;
  throw new Error("OpenAI response had no array of results");
}

// ── Future: Claude AI recommendation engine ───────────────────────────────────
// TODO: implement when Claude API integration is added
//
// export async function matchStudentsWithClaude(students, internships) {
//   const prompt = buildMatchingPrompt(students, internships);
//   const res    = await fetch("https://api.anthropic.com/v1/messages", {
//     method:  "POST",
//     headers: {
//       "x-api-key":         import.meta.env.VITE_CLAUDE_API_KEY,
//       "anthropic-version": "2023-06-01",
//       "content-type":      "application/json",
//     },
//     body: JSON.stringify({
//       model:      "claude-opus-4-8",
//       max_tokens: 4096,
//       messages:   [{ role: "user", content: prompt }],
//     }),
//   });
//   const data = await res.json();
//   return JSON.parse(data.content[0].text);
// }
