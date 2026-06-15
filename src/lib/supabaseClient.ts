import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase configuration missing! Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const fetchUserWallet = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    const { data: wallet } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle to prevent exceptions if wallet doesn't exist yet

    return {
      name: profile?.name || 'User',
      balance: wallet?.balance ? parseFloat(wallet.balance) : 0.00
    };
  } catch (error) {
    console.error("Error fetching user wallet:", error);
    return {
      name: 'User',
      balance: 0.00
    };
  }
};
