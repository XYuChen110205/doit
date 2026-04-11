import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://muswwjoilcvncfldeptw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11c3d3am9pbGN2bmNmbGRlcHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzA4MjAsImV4cCI6MjA5MTMwNjgyMH0.UQ9PX_onG27G2gXSCQ9hlL2PJCmMGx3dfsNZpVsLY8Q'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
