// Database connection for SmartNotes AI - PostgreSQL + JWT Implementation
// SERVER-SIDE ONLY - DO NOT IMPORT IN CLIENT COMPONENTS

import { Pool } from 'pg';

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased from 2000 to 10000ms
  maxUses: 7500, // Close connections after 7500 queries to prevent stale connections
  allowExitOnIdle: true,
  // Additional connection options for better reliability
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// Create connection pool
let pool: Pool | null = null;

// Initialize pool only on server
if (typeof window === 'undefined') {
  pool = new Pool(dbConfig);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 Closing database connection pool...');
    await pool?.end();
    console.log('✅ Database connection pool closed');
  });

  process.on('SIGINT', async () => {
    console.log('🛑 Closing database connection pool...');
    await pool?.end();
    console.log('✅ Database connection pool closed');
  });
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  if (!pool) {
    console.error('❌ Database pool not initialized');
    return false;
  }

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Query helper function
export async function query(text: string, params?: any[]): Promise<any> {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export pool for advanced usage (server-side only)
export { pool };
