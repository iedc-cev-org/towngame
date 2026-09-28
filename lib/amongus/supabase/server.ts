import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_AMONGUS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.AMONGUS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// This client bypasses RLS entirely.
// Never use this client in public API routes or expose it to the browser.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
