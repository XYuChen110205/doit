import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://muswwjoilcvncfldeptw.supabase.co'
const supabaseKey = 'sb_publishable_HE0sgMEhhWBHJxEB-F3oSg_zM2ippUk'

export const supabase = createClient(supabaseUrl, supabaseKey)
