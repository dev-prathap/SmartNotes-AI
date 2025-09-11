// Script to test subjects API endpoint
import { query } from './database';
import { generateAccessToken } from './jwt';

async function testSubjectsAPI() {
  try {
    // Create a test JWT token for the user
    const token = generateAccessToken({ 
      id: '8c2c305a-960e-402f-a0d4-586202dfa0cf',
      email: 'test@example.com',
      name: 'Test User',
      role: 'student'
    } as any);
    
    console.log('Test token:', token);
    
    // Test the API endpoint using curl
    console.log('Testing subjects API endpoint...');
    const curlCommand = `curl -H "Authorization: Bearer ${token}" http://localhost:3003/api/subjects`;
    console.log('Run this command to test the API:');
    console.log(curlCommand);
    
  } catch (error) {
    console.error('Error testing subjects API:', error);
  }
}

testSubjectsAPI();
