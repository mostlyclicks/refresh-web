import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { validateRequest as twilioValidate } from 'twilio'
import { supabaseAdmin } from '@/lib/db'
import { parseRequest } from '@/lib/claude'
import { normaliseRepo, listGitHubFiles, fetchAllSiteFiles } from '@/lib/github'
import { Attachment } from '@/lib/types'

function twiml(message: string): NextResponse {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

function validateSignature(req: NextRequest, params: Record<string, string>): boolean {
  if (process.env.MOCK_TWILIO === 'true') return true

  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    console.warn('[SMS] TWILIO_AUTH_TOKEN not set — skipping signature validation')
    return true
  }

  const signature = req.headers.get('x-twilio-signature') ?? ''
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('host') ?? ''
  const url = `${proto}://${host}${req.nextUrl.pathname}`

  return twilioValidate(authToken, signature, url, params)
}

async function downloadMediaToSupabase(
  mediaUrl: string,
  contentType: string,
  clientId: string
): Promise<Attachment> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  const headers: HeadersInit = {}
  if (accountSid && authToken) {
    headers['Authorization'] = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  }

  const res = await fetch(mediaUrl, { headers })
  if (!res.ok) throw new Error(`Failed to download Twilio media: ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
  const filename = `sms-${Date.now()}.${ext}`
  const storagePath = `${clientId}/${Date.now()}-${filename}`

  const { error } = await supabaseAdmin.storage
    .from('request-attachments')
    .upload(storagePath, buffer, { contentType, upsert: false })

  if (error) throw new Error(`Supabase upload failed: ${error.message}`)

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/request-attachments/${storagePath}`
  return { url: publicUrl, name: filename, type: contentType, size: buffer.length }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const body = new URLSearchParams(rawBody)

    // Build params map for signature validation
    const params: Record<string, string> = {}
    body.forEach((value, key) => { params[key] = value })

    if (!validateSignature(req, params)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const from = params['From'] ?? ''
    const messageText = (params['Body'] ?? '').trim()
    const numMedia = parseInt(params['NumMedia'] ?? '0', 10)

    if (!from) return twiml('Unable to process your message.')

    // Match phone number to an active client
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, tier')
      .eq('mobile_number', from)
      .eq('status', 'active')
      .single()

    if (!client) {
      return twiml("This number isn't registered. Visit webrefresh.io to get started.")
    }

    // Text-message updates are a Professional plan feature
    if (client.tier !== 'professional') {
      return twiml("Text updates are part of the Professional plan. You can send this same request from your online portal — or reply UPGRADE and we'll reach out about unlimited updates by text.")
    }

    // Get client's website
    const { data: website } = await supabaseAdmin
      .from('websites')
      .select('*')
      .eq('client_id', client.id)
      .single()

    if (!website?.github_repo_url) {
      return twiml("Got your message — we'll follow up shortly.")
    }

    // Download any MMS media and re-host to Supabase
    const attachments: Attachment[] = []
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = params[`MediaUrl${i}`]
      const contentType = params[`MediaContentType${i}`]
      if (mediaUrl && contentType) {
        try {
          attachments.push(await downloadMediaToSupabase(mediaUrl, contentType, client.id))
        } catch (err) {
          console.error(`[SMS] Media download failed for index ${i}:`, err)
        }
      }
    }

    if (!messageText && attachments.length === 0) {
      return twiml("We couldn't process that message. Please send text or a photo.")
    }

    const effectiveText = messageText || `[${attachments.length} image(s) attached via SMS]`

    // Save request immediately so the approval queue shows it right away
    const { data: request, error: reqError } = await supabaseAdmin
      .from('requests')
      .insert({
        client_id:    client.id,
        website_id:   website.id,
        message_text: effectiveText,
        status:       'pending',
        attachments,
        source:       'sms',
      })
      .select()
      .single()

    if (reqError || !request) {
      console.error('[SMS] Failed to save request:', reqError)
      return twiml("Got your message — we'll follow up shortly.")
    }

    // Parse with Claude in the background — Twilio gets a fast reply
    after(async () => {
      try {
        const repoPath = normaliseRepo(website.github_repo_url!)
        const fileList = await listGitHubFiles(repoPath)
        const siteFiles = await fetchAllSiteFiles(repoPath, fileList)
        const { suggestion, usage } = await parseRequest(effectiveText, siteFiles, attachments)

        const firstChange = suggestion.changes?.[0]
        await supabaseAdmin.from('suggestions').insert({
          request_id:      request.id,
          claude_response: suggestion,
          target_file:     firstChange?.target_file ?? '',
          old_code:        firstChange?.old_code    ?? '',
          new_code:        firstChange?.new_code    ?? '',
          risk_level:      suggestion.risk_level,
          confidence:      suggestion.confidence,
          input_tokens:    usage.input_tokens,
          output_tokens:   usage.output_tokens,
        })
      } catch (err) {
        console.error('[SMS] Background parse failed:', err)
      }
    })

    return twiml("Got it — we'll review and update your site shortly.")
  } catch (err: any) {
    console.error('[SMS] Webhook error:', err)
    return twiml('Something went wrong. Please try again.')
  }
}
