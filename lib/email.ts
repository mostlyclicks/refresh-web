// Email sending via Resend's HTTP API (no SDK dependency).
// Design rule: email must never break the calling flow — all failures are
// logged and returned as { sent: false }, never thrown.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export interface SendEmailArgs {
  to: string
  subject: string
  html: string
}

export interface SendEmailResult {
  sent: boolean
  id?: string
  error?: string
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email:', subject)
    return { sent: false, error: 'RESEND_API_KEY not set' }
  }

  const from = process.env.EMAIL_FROM || 'RefreshWeb <notifications@refreshweb.io>'
  const replyTo = process.env.EMAIL_REPLY_TO

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[email] Resend API error ${res.status}:`, body)
      return { sent: false, error: `Resend API error ${res.status}` }
    }

    const data = await res.json()
    return { sent: true, id: data.id }
  } catch (err: any) {
    console.error('[email] Send failed:', err)
    return { sent: false, error: err.message ?? 'Send failed' }
  }
}

export function updateLiveEmailHtml({
  clientName,
  summary,
  siteUrl,
}: {
  clientName: string
  summary: string
  siteUrl: string | null
}): string {
  const siteButton = siteUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr><td style="border-radius:10px;background:#3B82F6;">
          <a href="${siteUrl}" target="_blank"
             style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
            View your site &rarr;
          </a>
        </td></tr>
      </table>`
    : ''

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#0F172A;padding:24px 32px;">
            <span style="font-size:18px;font-weight:700;color:#ffffff;">Refresh<span style="color:#3B82F6;">Web</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#0F172A;">Your update is live &#10003;</h1>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#334155;">Hi ${clientName},</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
              The change you requested has been reviewed, approved, and deployed to your website:
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:0 0 4px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#0F172A;font-weight:500;">${summary}</p>
            </div>
            ${siteButton}
            <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
              Need another change? Just reply to this email or send a new request from your portal.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">RefreshWeb &middot; refreshweb.io</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendUpdateLiveEmail({
  to,
  clientName,
  summary,
  siteUrl,
}: {
  to: string
  clientName: string
  summary: string
  siteUrl: string | null
}): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: 'Your website update is live',
    html: updateLiveEmailHtml({ clientName, summary, siteUrl }),
  })
}
