// Script to check if vector extension is enabled and how embeddings are stored
import { query } from './database';

async function checkVectorExtension() {
  try {
    // Check if vector extension is installed
    const result = await query(`
      SELECT name, default_version, installed_version 
      FROM pg_available_extensions 
      WHERE name = 'vector'
    `);
    
    if (result.rows.length > 0) {
      const extension = result.rows[0];
      console.log('Vector extension info:', extension);
      
      if (extension.installed_version) {
        console.log(' Vector extension is installed and enabled');
      } else {
        console.log(' Vector extension is available but not installed');
        console.log('To install, run: CREATE EXTENSION vector;');
      }
    } else {
      console.log(' Vector extension is not available');
    }
    
    // Test vector operations
    const testResult = await query(`
      SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector as distance
    `);
    
    console.log('Vector distance test result:', testResult.rows[0]);
  } catch (error) {
    console.error('Error checking vector extension:', error);
  }
}

checkVectorExtension();
