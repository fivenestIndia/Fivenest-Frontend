import { createClient } from '@supabase/supabase-js';

// REAL VERIFIED SUPABASE CREDENTIALS FOR FIVENEST
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

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
