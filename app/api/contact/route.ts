import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, email, business, plan, message } = await req.json()

    if (!name || !email || !business) {
      return NextResponse.json({ error: 'Name, email, and business are required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('leads').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      business: business.trim(),
      plan: plan || null,
      message: message?.trim() || null,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 })
  }
}
