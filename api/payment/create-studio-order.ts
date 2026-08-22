const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_StiBeOur982wHu';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'PBGKY5ev8UTWeKjXYwJFDowA';

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

  const { amount, userId, email } = req.body || {};

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid recharge amount' });
  }

  try {
    const amountInPaise = Math.round(Number(amount) * 100);
    const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${userId ? userId.slice(0, 10) : 'user'}_${Date.now()}`,
        notes: {
          userId: userId || 'anonymous',
          email: email || '',
          desc: 'FiveNest Design Studio Wallet Recharge'
        }
      })
    });

    const order = await razorpayRes.json();

    if (!razorpayRes.ok || !order.id) {
      console.error('Razorpay Order Error:', order);
      return res.status(500).json({ error: order.error?.description || 'Failed to create Razorpay order' });
    }

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while creating payment order' });
  }
}
