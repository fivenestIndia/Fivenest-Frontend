import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req: any, res: any) {
  // CORS Configuration - Allows Photoshop to talk to your server
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { key, hwid, os } = req.body;

  if (!key) {
    return res.status(400).json({ success: false, message: 'License key is required' });
  }

  try {
    const client = await connectToDatabase();
    // Use your actual MongoDB database name here
    const db = client.db('fivenest_db'); 
    const licensesCollection = db.collection('licenses');

    const license = await licensesCollection.findOne({ key: key.trim() });

    if (!license) {
      return res.status(404).json({ success: false, message: 'Invalid License Key.' });
    }

    if (license.status !== 'active') {
      return res.status(403).json({ success: false, message: 'License is suspended or expired.' });
    }

    // Hardware ID locking mechanism
    if (!license.hwid) {
      await licensesCollection.updateOne(
        { _id: license._id },
        { $set: { hwid: hwid, activatedAt: new Date(), os: os } }
      );
    } else if (license.hwid !== hwid) {
      return res.status(403).json({ success: false, message: 'Key already used on another computer.' });
    }

    return res.status(200).json({ success: true, message: 'License Verified!' });

  } catch (error) {
    console.error('Database Error:', error);
    return res.status(500).json({ success: false, message: 'Server database connection error.' });
  }
}