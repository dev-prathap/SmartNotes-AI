// Script to test pdf-parse functionality
import pdfParse from 'pdf-parse';
import { readFile } from 'fs/promises';
import { join } from 'path';

async function testPdfParse() {
  try {
    console.log('Testing pdf-parse with a simple text buffer...');
    
    // Create a simple buffer with text content
    const buffer = Buffer.from('This is a test PDF content');
    const data = await pdfParse(buffer);
    console.log('PDF parse result:', data);
    
  } catch (error) {
    console.error('Error testing pdf-parse:', error);
  }
}

testPdfParse();
