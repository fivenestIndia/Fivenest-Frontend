import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase configuration missing! Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

export const fetchUserWallet = async (userId: string) => {
  let profile = null;
  let wallet = null;

  // Retry up to 3 times with a 500ms delay to handle database trigger creation lag
  for (let i = 0; i < 3; i++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        profile = data;
        break;
      }
    } catch (e) {
      // Ignore error and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  try {
    const { data: walletData } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle to prevent exceptions if wallet doesn't exist yet
    wallet = walletData;
  } catch (error) {
    console.error("Error fetching user wallet:", error);
  }

  return {
    name: profile?.name || 'User',
    balance: wallet?.balance ? parseFloat(wallet.balance) : 0.00
  };
};
