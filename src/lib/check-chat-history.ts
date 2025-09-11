// Script to check if chat_history table exists and create it if not
import { query } from './database';

async function checkAndCreateChatHistoryTable() {
  try {
    // Check if chat_history table exists
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'chat_history'
    `);
    
    if (result.rows.length > 0) {
      console.log('Chat history table already exists');
      // Check columns
      const columns = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'chat_history'
        ORDER BY ordinal_position
      `);
      console.table(columns.rows);
    } else {
      console.log('Chat history table does not exist, creating it...');
      // Create chat_history table
      await query(`
        CREATE TABLE chat_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          sources JSONB,
          confidence NUMERIC(3,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('Chat history table created successfully');
    }
  } catch (error) {
    console.error('Error checking/creating chat history table:', error);
  }
}

checkAndCreateChatHistoryTable();
