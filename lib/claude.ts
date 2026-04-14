import Anthropic from '@anthropic-ai/sdk'
import { ClaudeResponse } from './types'

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const SYSTEM_PROMPT = `You are a web code assistant helping manage updates to client websites.

Your job:
1. Understand the client's natural language request
2. Map it to the specific HTML/CSS/JS file and location
3. Generate a safe, minimal code change
4. Flag any risks

Input:
- Client request (text)
- Website context (file structure, relevant code snippets)
- Current code (HTML/CSS/JS)

Output (JSON only, no markdown):
{
  "understood": true/false,
  "request_summary": "one-liner of what changed",
  "target_file": "index.html" or "styles.css" or "script.js",
  "target_section": "hero section" or "footer" or "specific line",
  "old_code": "the exact code being replaced",
  "new_code": "the new code",
  "risk_level": "low" | "medium" | "high",
  "risk_description": "why this might break things",
  "confidence": 0.0-1.0,
  "notes": "anything Carlos should know"
}

Constraints:
- Only modify HTML/CSS/JS in the deployed website
- Never modify configuration files or build scripts
- Always preserve structure (don't delete parent divs)
- Suggest minimal changes (don't refactor unnecessarily)
- If unclear, set understood to false and explain in notes`

export async function parseRequest(
  requestText: string,
  currentCode: string,
  fileStructure: string[]
): Promise<ClaudeResponse> {
  const message = await getAnthropic().messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Client request: ${requestText}

File structure:
${fileStructure.join('\n')}

Current code:
\`\`\`
${currentCode}
\`\`\`

Analyze this request and return the JSON response.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  return JSON.parse(content.text) as ClaudeResponse
}
