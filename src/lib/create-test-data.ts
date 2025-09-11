// Script to create test subject and document
import { query } from './database';

async function createTestData() {
  try {
    // First create a test subject
    const subjectResult = await query(`
      INSERT INTO subjects (user_id, name, description, color, icon)
      VALUES ('8c2c305a-960e-402f-a0d4-586202dfa0cf', 'Test Subject', 'A subject for testing document uploads', '#FF0000', 'book')
      RETURNING id
    `);
    
    const subjectId = subjectResult.rows[0].id;
    console.log('Created test subject with ID:', subjectId);
    
    // Then create a test document
    const documentResult = await query(`
      INSERT INTO documents (
        user_id, subject_id, title, description, file_name, file_path,
        file_size, file_type, mime_type, content_text, processing_status
      ) VALUES (
        '8c2c305a-960e-402f-a0d4-586202dfa0cf', 
        $1, 
        'Test Document', 
        'A test document for upload functionality', 
        'test.txt', 
        '/uploads/test.txt',
        1024, 
        'txt', 
        'text/plain', 
        'This is test content for the document', 
        'completed'
      ) RETURNING id
    `, [subjectId]);
    
    const documentId = documentResult.rows[0].id;
    console.log('Created test document with ID:', documentId);
    
    console.log('✅ Test data created successfully!');
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestData();
