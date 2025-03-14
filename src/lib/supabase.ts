import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const submitGameResult = async (
  success: boolean,
  attempts: number,
  linesUsed: number
) => {
  try {
    const { error } = await supabase
      .from('game_results')
      .insert({
        date: new Date().toISOString().split('T')[0],
        success,
        attempts,
        lines_used: linesUsed
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error submitting game result:', err);
    return false;
  }
};