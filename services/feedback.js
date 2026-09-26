import { supabase } from './supabase';

export async function submitFeedback(userId, category, message) {
  const { error } = await supabase
    .from('feedback')
    .insert({ user_id: userId, category, message });
  if (error) throw error;
}
