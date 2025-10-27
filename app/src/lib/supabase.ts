import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yaxnoxulndieokgcprbx.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheG5veHVsbmRpZW9rZ2NwcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTExNzgsImV4cCI6MjA3NDY4NzE3OH0.IVtY6KCRubhty9l2HBHVOmfkOGaS6Fa0DLiexNsdsIs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表类型定义
export interface UserProfile {
  phone: string
  password: string
  created_at: string
  updated_at: string
}

export interface UserProgress {
  user_id: string
  collected_fish_ids: string
  updated_at: string
}

export interface UserMark {
  id: string
  user_id: string
  fish_id: string
  address: string
  recorded_at: string
  created_at: string
}

export interface UserFeedback {
  id: string
  user_id: string
  content: string
  reply_content: string | null
  created_at: string
  replied_at: string | null
}
