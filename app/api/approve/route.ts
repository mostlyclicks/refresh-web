import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { CodeChange } from '@/lib/types'

// Edited changes arrive from the approval UI — validate before they reach the deploy pipeline.
// old_code must be non-empty (deploy is find-and-replace); new_code may be empty (deletion).
function validateChanges(raw: unknown): { changes?: CodeChange[]; error?: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: 'changes must be a non-empty array' }
  }
  const changes: CodeChange[] = []
  for (const c of raw) {
    if (typeof c?.target_file !== 'string' || !c.target_file.trim()) {
      return { error: 'Each change needs a target_file' }
    }
    if (typeof c?.old_code !== 'string' || c.old_code.length === 0) {
      return { error: 'Each change needs a non-empty old_code (the exact code to replace)' }
    }
    if (typeof c?.new_code !== 'string') {
      return { error: 'Each change needs a new_code string' }
    }
    changes.push({
      target_file: c.target_file.trim(),
      target_section: typeof c.target_section === 'string' ? c.target_section : '',
      old_code: c.old_code,
      new_code: c.new_code,
    })
  }
  return { changes }
}

export async function POST(req: NextRequest) {
  try {
    const { requestId, suggestionId, action, changes: editedChanges } = await req.json()

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Persist inline edits BEFORE touching request status — the deploy route reads the
    // suggestion from the DB, and a validation failure should leave everything pending.
    if (action === 'approve' && suggestionId && editedChanges !== undefined) {
      const { changes, error: validationError } = validateChanges(editedChanges)
      if (validationError || !changes) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }

      const { data: existing } = await supabaseAdmin
        .from('suggestions')
        .select('claude_response')
        .eq('id', suggestionId)
        .single()

      const claude_response = {
        ...(existing?.claude_response ?? {}),
        changes,
        manually_edited: true,
      }

      const { error: updateError } = await supabaseAdmin
        .from('suggestions')
        .update({
          claude_response,
          target_file: changes[0].target_file,
          old_code: changes[0].old_code,
          new_code: changes[0].new_code,
        })
        .eq('id', suggestionId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to save edited changes' }, { status: 500 })
      }
    }

    const newStatus = action === 'approve' ? 'approved'
      : action === 'reject' ? 'rejected'
      : 'pending' // clarify keeps it pending

    // Update request status
    const { error: reqError } = await supabaseAdmin
      .from('requests')
      .update({ status: newStatus })
      .eq('id', requestId)

    if (reqError) {
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    // If approving, stamp the suggestion
    if (action === 'approve' && suggestionId) {
      await supabaseAdmin
        .from('suggestions')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: 'carlos',
        })
        .eq('id', suggestionId)

      // Trigger deployment pipeline
      const deployRes = await fetch(new URL('/api/deploy', req.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId }),
      })

      if (!deployRes.ok) {
        const deployErr = await deployRes.json().catch(() => ({}))
        console.error('Deploy failed:', deployErr)

        // Revert to pending so the request stays in the approval queue —
        // Carlos can edit the changes inline and retry instead of it
        // stranding as "approved but never deployed".
        await supabaseAdmin
          .from('requests')
          .update({ status: 'pending' })
          .eq('id', requestId)

        return NextResponse.json(
          {
            success: false,
            deployed: false,
            error: deployErr?.error ?? 'Deploy failed — request kept in the queue',
          },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({ success: true, action, newStatus })
  } catch (err: any) {
    console.error('approve error:', err)
    return NextResponse.json({ error: err.message || 'Failed to process approval' }, { status: 500 })
  }
}
