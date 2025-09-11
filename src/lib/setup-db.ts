// Database initialization script for SmartNotes AI
// SERVER-SIDE ONLY - Run with: bun run setup-db

import { testConnection } from './database.js';
import { initializeDatabase } from './schema.js';

async function setupDatabase() {
  try {
    console.log('🔄 Testing database connection...');
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Database connection failed. Please check your DATABASE_URL in .env');
      process.exit(1);
    }

    console.log('✅ Database connection successful');
    console.log('🔄 Initializing database schema...');

    await initializeDatabase();

    console.log('🎉 Database setup complete!');
    console.log('📝 You can now run your application with: bun run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();

export { setupDatabase };
