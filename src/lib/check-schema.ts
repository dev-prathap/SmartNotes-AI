// Script to check database schema
import { query } from './database';

async function checkSchema() {
  try {
    // Check if documents table exists and its structure
    const documentsTable = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      ORDER BY ordinal_position
    `);
    
    console.log('Documents table columns:');
    console.table(documentsTable.rows);
    
    // Check if subjects table exists and its structure
    const subjectsTable = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subjects' 
      ORDER BY ordinal_position
    `);
    
    console.log('Subjects table columns:');
    console.table(subjectsTable.rows);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
