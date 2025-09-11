// Script to check if refresh_tokens table exists
import { query } from './database';

async function checkRefreshTable() {
  try {
    const result = await query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'refresh_tokens'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length > 0) {
      console.log('Refresh tokens table exists:');
      console.table(result.rows);
    } else {
      console.log('Refresh tokens table does not exist');
    }
  } catch (error) {
    console.error('Error checking refresh tokens table:', error);
  }
}

checkRefreshTable();
