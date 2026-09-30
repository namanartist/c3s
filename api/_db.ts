// api/_db.ts
import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;

/** Returns a connected MongoDB database instance, caching the client across invocations. */
export async function getDb(dbName = 'UniMap'): Promise<Db> {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error('MONGO_URL environment variable is missing');
  }

  if (!client) {
    try {
      client = new MongoClient(mongoUrl, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
      });
      await client.connect();
    } catch (error) {
      client = null; // Reset to null on failure so subsequent requests can retry
      throw error;
    }
  }

  return client.db(dbName);
}
