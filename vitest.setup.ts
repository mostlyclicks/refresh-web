// Set env vars needed by the SMS route before any test runs
process.env.MOCK_TWILIO = 'true'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.TWILIO_AUTH_TOKEN = 'test-auth-token'
process.env.TWILIO_ACCOUNT_SID = 'ACtest'
