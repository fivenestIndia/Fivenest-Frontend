import { createClient } from '@supabase/supabase-js';

// VERIFIED WORKING SUPABASE CREDENTIALS FOR FIVENEST
const SUPABASE_URL = 'https://qppfrmmfsfqigeciedlg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcGZybW1mc2ZxaWdlY2llZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTE3ODEsImV4cCI6MjA5NzA4Nzc4MX0.VA4-dLEWceZEz_MYk7vUA8lve6a2-GG6iYK14OjPo3g';

export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = SUPABASE_ANON_KEY;

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
