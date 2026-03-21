import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url-aqui.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima-aqui'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Order = {
  id: string;
  created_at: string;
  origin: string;
  destination: string;
  volume_type: string;
  payment_method: string;
  price: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  observation?: string;
  change_for?: string;
}
