// Script to check the latest uploaded document
import { query } from './database';

async function checkLatestDocument() {
  try {
    const result = await query(`
      SELECT id, title, file_name, file_type, processing_status, created_at, vector_embedding IS NOT NULL as has_embedding
      FROM documents 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const doc = result.rows[0];
      console.log('Latest document:');
      console.log(`ID: ${doc.id}`);
      console.log(`Title: ${doc.title}`);
      console.log(`File Name: ${doc.file_name}`);
      console.log(`File Type: ${doc.file_type}`);
      console.log(`Processing Status: ${doc.processing_status}`);
      console.log(`Created At: ${doc.created_at}`);
      console.log(`Has Vector Embedding: ${doc.has_embedding}`);
    } else {
      console.log('No documents found');
    }
  } catch (error) {
    console.error('Error checking latest document:', error);
  }
}

checkLatestDocument();
