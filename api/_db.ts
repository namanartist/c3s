// api/_db.ts
import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

/**
 * Extracts target database name from the connection string or defaults to provided fallback.
 */
function resolveDatabaseName(mongoUrl: string, defaultDb = 'UniMap'): string {
  try {
    const url = new URL(mongoUrl.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://'));
    const pathname = url.pathname.replace(/^\//, '').split('?')[0];
    if (pathname && pathname.length > 0) {
      return pathname;
    }
  } catch {
    // fallback
  }
  return defaultDb;
}

/**
 * Returns a connected MongoDB database instance, caching the client across serverless invocations.
 */
export async function getDb(preferredDb?: string): Promise<Db> {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error('MONGO_URL environment variable is missing. Configure it in .env or your deployment environment.');
  }

  const targetDbName = preferredDb || resolveDatabaseName(mongoUrl, 'UniMap');

  if (!client || !clientPromise) {
    client = new MongoClient(mongoUrl, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    clientPromise = client.connect().catch((err) => {
      client = null;
      clientPromise = null;
      throw err;
    });
  }

  const connectedClient = await clientPromise;
  return connectedClient.db(targetDbName);
}

/**
 * Diagnostic helper to ping database and retrieve health metadata.
 */
export async function checkDbConnection(): Promise<{
  connected: boolean;
  database: string;
  latencyMs: number;
  collections?: string[];
  error?: string;
}> {
  const start = Date.now();
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const collections = (await db.listCollections().toArray()).map((c) => c.name);
    return {
      connected: true,
      database: db.databaseName,
      latencyMs: Date.now() - start,
      collections,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      database: 'unknown',
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}
