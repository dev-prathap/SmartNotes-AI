// Script to check documents in database
import { query } from './database';

async function checkDocuments() {
  try {
    const result = await query('SELECT * FROM documents');
    console.log('Documents in database:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error checking documents:', error);
  }
}

checkDocuments();
