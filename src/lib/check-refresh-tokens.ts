// Script to check refresh tokens in database
import { query } from './database';

async function checkRefreshTokens() {
  try {
    const result = await query('SELECT * FROM refresh_tokens');
    console.log('Refresh tokens in database:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error checking refresh tokens:', error);
  }
}

checkRefreshTokens();
