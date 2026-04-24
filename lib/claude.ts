import Anthropic from '@anthropic-ai/sdk'
import { ClaudeResponse } from './types'

function getAnthropic() {
  if (!process.env.AI_API_KEY) throw new Error('AI_API_KEY is not set')
  return new Anthropic({ apiKey: process.env.AI_API_KEY })
}

const SYSTEM_PROMPT = `You are a web code assistant helping manage updates to client websites.

Your job:
1. Understand the client's natural language request (which may include multiple changes)
2. Map each change to the specific HTML/CSS/JS file and location
3. Generate safe, minimal code changes
4. Flag any risks

Input:
- Client request (text)
- All website files (HTML, CSS, JS) — each labeled with its filename
- Attached files (use these exact URLs when the client is providing replacement media)

Output (JSON only, no markdown):
{
  "understood": true/false,
  "request_summary": "one-liner summarising all changes made",
  "changes": [
    {
      "target_file": "index.html",
      "target_section": "hero section",
      "old_code": "the exact code being replaced",
      "new_code": "the replacement code"
    }
  ],
  "risk_level": "low" | "medium" | "high",
  "risk_description": "why any of these changes might break things",
  "confidence": 0.0-1.0,
  "notes": "anything Carlos should know"
}

Constraints:
- Return one entry in "changes" per distinct code change needed
- Each change must target a different location — never return two changes to the same old_code
- Only modify HTML/CSS/JS in the deployed website
- Never modify configuration files or build scripts
- Always preserve structure (don't delete parent divs)
- Suggest minimal changes (don't refactor unnecessarily)
- If unclear, set understood to false and explain in notes`

export async function parseRequest(
  requestText: string,
  siteFiles: Record<string, string>,
  attachments: { url: string; name: string; type: string }[] = []
): Promise<ClaudeResponse> {
  const attachmentSection = attachments.length > 0
    ? `\nAttached files (use these exact URLs in new_code when referencing uploaded media):\n${attachments.map(a => `- ${a.name}: ${a.url}`).join('\n')}\n`
    : ''

  // Format all site files for the prompt
  const filesSection = Object.entries(siteFiles)
    .map(([name, content]) => `=== ${name} ===\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  const message = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Client request: ${requestText}
${attachmentSection}
Website files:
${filesSection}

Analyze this request and return the JSON response.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  // Strip markdown code fences if the model wraps the JSON
  const raw = content.text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  const parsed = JSON.parse(raw) as ClaudeResponse

  // Normalise: if old format (single change at top level), migrate to changes array
  if (!parsed.changes && (parsed as any).old_code) {
    const legacy = parsed as any
    parsed.changes = [{
      target_file:    legacy.target_file,
      target_section: legacy.target_section,
      old_code:       legacy.old_code,
      new_code:       legacy.new_code,
    }]
  }

  if (!Array.isArray(parsed.changes)) parsed.changes = []

  return parsed
}
