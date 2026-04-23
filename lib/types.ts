export type ClientStatus = 'active' | 'paused' | 'archived'
export type ClientTier = 'basic' | 'professional' | 'custom'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'deployed'
export type RiskLevel = 'low' | 'medium' | 'high'
export type BillingStatus = 'paid' | 'failed' | 'upcoming'

export interface Client {
  id: string
  name: string
  email: string
  website_url: string | null
  created_at: string
  status: ClientStatus
  stripe_customer_id: string | null
  tier: ClientTier
}

export interface Website {
  id: string
  client_id: string
  name: string
  github_repo_url: string | null
  deployed_url: string | null
  vercel_project_id: string | null
  created_at: string
}

export interface Attachment {
  url: string
  name: string
  type: string
  size: number
}

export interface Request {
  id: string
  client_id: string
  website_id: string
  message_text: string
  created_at: string
  status: RequestStatus
  attachments: Attachment[]
}

export interface ClaudeResponse {
  understood: boolean
  request_summary: string
  target_file: string
  target_section: string
  old_code: string
  new_code: string
  risk_level: RiskLevel
  risk_description: string
  confidence: number
  notes: string
}

export interface Suggestion {
  id: string
  request_id: string
  claude_response: ClaudeResponse
  target_file: string
  old_code: string
  new_code: string
  risk_level: RiskLevel
  confidence: number
  created_at: string
  approved_at: string | null
  approved_by: string | null
}

export interface Change {
  id: string
  suggestion_id: string
  website_id: string
  git_commit_hash: string
  deployed_at: string
  deployed_url: string
}

export interface BillingRecord {
  id: string
  client_id: string
  stripe_invoice_id: string
  amount_cents: number
  billing_date: string
  status: BillingStatus
}
