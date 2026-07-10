import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { sendEmail } from '@/lib/email'

// Public, unauthenticated by necessity — this is the one endpoint every
// RefreshWeb client site (a separate origin) posts to. No cookie/session
// exists for an anonymous visitor on a client's site, so auth isn't an
// option here; CORS + honeypot + rate-limit are the mitigations instead.

const HOURLY_LIMIT = 10 // per client — bounds worst-case damage to one client's inbox
const MESSAGE_MAX = 4000

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get('origin'))

  try {
    const body = await req.json()
    const { clientId, name, contact, message, page, hp } = body ?? {}

    // Honeypot: real visitors never see or fill this field. Pretend success
    // so a bot gets no signal that it was caught.
    if (hp) {
      return NextResponse.json({ success: true }, { headers })
    }

    if (!clientId || !name || !contact) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers })
    }
    if (typeof message === 'string' && message.length > MESSAGE_MAX) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400, headers })
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, name, email, form_email')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Unknown client' }, { status: 404, headers })
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte('created_at', hourAgo)

    if ((count ?? 0) >= HOURLY_LIMIT) {
      return NextResponse.json(
        { error: 'Too many submissions right now — please try again later.' },
        { status: 429, headers }
      )
    }

    const { error: insertError } = await supabaseAdmin.from('contact_submissions').insert({
      client_id: clientId,
      name: String(name).trim().slice(0, 200),
      contact: String(contact).trim().slice(0, 200),
      message: typeof message === 'string' ? message.trim().slice(0, MESSAGE_MAX) : null,
      page: typeof page === 'string' ? page.trim().slice(0, 200) : null,
    })

    if (insertError) {
      console.error('[client-contact] insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500, headers })
    }

    const to = client.form_email || client.email
    if (to) {
      const looksLikeEmail = /.+@.+\..+/.test(contact)
      await sendEmail({
        to,
        subject: `New website inquiry from ${name}`,
        replyTo: looksLikeEmail ? contact : undefined,
        html: `<p><strong>${name}</strong> submitted your site's contact form.</p>
<p><strong>Contact:</strong> ${contact}</p>
${message ? `<p><strong>Message:</strong><br>${String(message).replace(/\n/g, '<br>')}</p>` : ''}
<p style="color:#94a3b8;font-size:12px;">Sent via RefreshWeb</p>`,
      })
    }

    return NextResponse.json({ success: true }, { headers })
  } catch (err: any) {
    console.error('[client-contact] error:', err)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500, headers })
  }
}
