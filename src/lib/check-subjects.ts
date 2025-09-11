// Script to check subjects in database
import { query } from './database';

async function checkSubjects() {
  try {
    const result = await query('SELECT * FROM subjects');
    console.log('Subjects in database:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error checking subjects:', error);
  }
}

checkSubjects();
