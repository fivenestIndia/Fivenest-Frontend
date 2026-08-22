import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'PBGKY5ev8UTWeKjXYwJFDowA';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qppfrmmfsfqigeciedlg.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcGZybW1mc2ZxaWdlY2llZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTE3ODEsImV4cCI6MjA5NzA4Nzc4MX0.VA4-dLEWceZEz_MYk7vUA8lve6a2-GG6iYK14OjPo3g';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount, currentBalance } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !amount) {
    return res.status(400).json({ error: 'Missing required payment verification details' });
  }

  try {
    // 1. Verify Razorpay HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }

    const rechargeAmt = parseFloat(amount);

    // 2. Record transaction in Supabase credit_transactions
    const { error: txError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: rechargeAmt,
      transaction_type: 'topup',
      description: `Razorpay Online Recharge: ₹${rechargeAmt} (Txn: ${razorpay_payment_id})`
    });

    if (txError) {
      console.warn('credit_transactions insert warning:', txError);
    }

    // 3. Ensure wallet balance is directly updated by adding to previous balance
    const { data: currentWallet } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    const existingBalance = (currentBalance !== undefined && !isNaN(Number(currentBalance)))
      ? Number(currentBalance)
      : (currentWallet?.balance ? parseFloat(currentWallet.balance) : 0);

    const newBalance = Math.round((existingBalance + rechargeAmt) * 100) / 100;

    await supabase
      .from('wallet')
      .upsert({ user_id: userId, balance: newBalance }, { onConflict: 'user_id' });

    return res.status(200).json({
      success: true,
      message: `Successfully added ₹${rechargeAmt} to wallet!`,
      newBalance
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: error.message || 'Payment verification processing error' });
  }
}
