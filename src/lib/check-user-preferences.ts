// Script to check if user_preferences table exists and create it if not
import { query } from './database';

async function checkAndCreateUserPreferencesTable() {
  try {
    // Check if user_preferences table exists
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_preferences'
    `);
    
    if (result.rows.length > 0) {
      console.log('User preferences table already exists');
      // Check columns
      const columns = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_preferences'
        ORDER BY ordinal_position
      `);
      console.table(columns.rows);
    } else {
      console.log('User preferences table does not exist, creating it...');
      // Create user_preferences table
      await query(`
        CREATE TABLE user_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          preference_key VARCHAR(255) NOT NULL,
          preference_value JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('User preferences table created successfully');
    }
  } catch (error) {
    console.error('Error checking/creating user preferences table:', error);
  }
}

checkAndCreateUserPreferencesTable();
