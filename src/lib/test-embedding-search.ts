#!/usr/bin/env bun
// Test script for embedding search functionality

import { searchDocumentsWithContext, getConversationContext } from '@/lib/embedding-search';

async function testSearch() {
  try {
    // Test with a sample question
    const question = "What are the main concepts in this subject?";
    const userId = "test-user-id";
    
    // Get conversation context
    const conversationContext = await getConversationContext(userId, 3);
    console.log('Conversation context:', conversationContext);
    
    // Search documents with context
    const searchOptions = {
      userId: userId,
      minSimilarity: 0.5,
      maxResults: 5,
      conversationContext
    };
    
    const results = await searchDocumentsWithContext(question, searchOptions);
    console.log('Search results:', results);
  } catch (error) {
    console.error('Test search error:', error);
  }
}

testSearch();
