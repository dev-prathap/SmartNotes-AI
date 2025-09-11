// Advanced Embedding Search System for SmartNotes AI

import OpenAI from 'openai';
import { query } from '@/lib/database';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  content_text: string;
  subject_id: string;
  similarity: number;
  is_chunk?: boolean;
  chunk_index?: number;
}

export interface AdvancedSearchOptions {
  userId: string;
  subjectId?: string;
  minSimilarity?: number;
  maxResults?: number;
  conversationContext?: Array<{ question: string; answer: string }>;
}

/**
 * Generate embedding vector for a given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return embedding.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Convert embedding array to PostgreSQL vector format
 */
export function embeddingToVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Search documents using advanced embedding similarity with context awareness
 */
export async function searchDocumentsByEmbedding(
  question: string,
  options: AdvancedSearchOptions
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);
    const questionVector = embeddingToVector(questionEmbedding);
    
    // Build base query with similarity calculation
    let queryText = `
      SELECT id, title, description, content_text, subject_id,
             (1 - (vector_embedding::vector <=> $2::vector)) AS similarity
      FROM documents 
      WHERE user_id = $1 AND processing_status = 'completed' AND vector_embedding IS NOT NULL
    `;
    
    const queryParams = [options.userId, questionVector];
    
    // Add subject filter if specified
    if (options.subjectId) {
      queryText += ' AND subject_id = $3';
      queryParams.push(options.subjectId);
    }
    
    // Add similarity threshold (default 0.5)
    const minSimilarity = options.minSimilarity ?? 0.5;
    queryText += ' AND (1 - (vector_embedding::vector <=> $2::vector)) > $' + (queryParams.length + 1);
    queryParams.push(minSimilarity.toString());
    
    // Order by similarity and limit results (default 5)
    const maxResults = options.maxResults ?? 5;
    queryText += ' ORDER BY vector_embedding::vector <=> $2::vector ASC LIMIT $' + (queryParams.length + 1);
    queryParams.push(maxResults.toString());
    
    // Execute search query
    const result = await query(queryText, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error searching documents by embedding:', error);
    throw error;
  }
}

/**
 * Search document chunks using advanced embedding similarity
 */
export async function searchDocumentChunksByEmbedding(
  question: string,
  options: AdvancedSearchOptions
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);
    const questionVector = embeddingToVector(questionEmbedding);
    
    // Build query for document chunks
    let queryText = `
      SELECT dc.id, d.title, d.description, dc.content_text, d.subject_id,
             (1 - (dc.vector_embedding::vector <=> $2::vector)) AS similarity,
             true AS is_chunk,
             dc.chunk_index
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE d.user_id = $1 AND d.processing_status = 'completed' AND dc.vector_embedding IS NOT NULL
    `;
    
    const queryParams = [options.userId, questionVector];
    
    // Add subject filter if specified
    if (options.subjectId) {
      queryText += ' AND d.subject_id = $3';
      queryParams.push(options.subjectId);
    }
    
    // Add similarity threshold (default 0.5)
    const minSimilarity = options.minSimilarity ?? 0.5;
    queryText += ' AND (1 - (dc.vector_embedding::vector <=> $2::vector)) > $' + (queryParams.length + 1);
    queryParams.push(minSimilarity.toString());
    
    // Order by similarity and limit results (default 5)
    const maxResults = options.maxResults ?? 5;
    queryText += ' ORDER BY dc.vector_embedding::vector <=> $2::vector ASC LIMIT $' + (queryParams.length + 1);
    queryParams.push(maxResults.toString());
    
    // Execute search query
    const result = await query(queryText, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error searching document chunks by embedding:', error);
    return [];
  }
}

/**
 * Search documents with conversation context awareness
 */
export async function searchDocumentsWithContext(
  question: string,
  options: AdvancedSearchOptions
): Promise<SearchResult[]> {
  try {
    // If we have conversation context, combine it with the question for better search
    let searchQuery = question;
    if (options.conversationContext && options.conversationContext.length > 0) {
      const contextText = options.conversationContext
        .map(item => `Previous Question: ${item.question}\nPrevious Answer: ${item.answer}`)
        .join('\n\n');
      
      searchQuery = `${contextText}\n\nCurrent Question: ${question}`;
    }
    
    // Search documents first
    const documents = await searchDocumentsByEmbedding(searchQuery, options);
    
    // Always search document chunks to ensure comprehensive results
    const chunks = await searchDocumentChunksByEmbedding(searchQuery, options);
    
    // Combine documents and chunks, sort by similarity, and limit results
    return [...documents, ...chunks]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.maxResults || 5);
  } catch (error) {
    console.error('Error searching documents with context:', error);
    throw error;
  }
}

/**
 * Get conversation context for better search results
 */
export async function getConversationContext(userId: string, limit: number = 3): Promise<Array<{ question: string; answer: string }>> {
  try {
    const historyQuery = `
      SELECT question, answer
      FROM chat_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const historyResult = await query(historyQuery, [userId, limit.toString()]);
    return historyResult.rows.reverse(); // Reverse to chronological order
  } catch (error) {
    console.error('Error getting conversation context:', error);
    return [];
  }
}
