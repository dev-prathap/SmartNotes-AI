// Document Chunking System for SmartNotes AI

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content_text: string;
  vector_embedding: string | null;
  created_at: string;
}

/**
 * Split a large document into smaller chunks for better processing and search
 * @param contentText The full text content of the document
 * @param chunkSize The maximum size of each chunk in characters (default: 4000)
 * @param overlap The overlap between chunks in characters (default: 200)
 * @returns Array of document chunks
 */
export function chunkDocument(
  contentText: string,
  chunkSize: number = 4000,
  overlap: number = 200
): string[] {
  if (!contentText || contentText.length <= chunkSize) {
    return [contentText];
  }

  const chunks: string[] = [];
  let position = 0;

  while (position < contentText.length) {
    // Get chunk with overlap from previous chunk
    const start = Math.max(0, position - (position > 0 ? overlap : 0));
    const end = Math.min(contentText.length, start + chunkSize);
    const chunk = contentText.substring(start, end);
    
    chunks.push(chunk);
    
    // Move position forward by chunkSize, but subtract overlap for next iteration
    position += chunkSize - overlap;
    
    // If we're near the end, make sure we don't create tiny chunks
    if (position + overlap >= contentText.length) {
      break;
    }
  }

  // Handle remaining text if any
  if (position < contentText.length) {
    const start = Math.max(0, position - (position > 0 ? overlap : 0));
    const chunk = contentText.substring(start);
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

/**
 * Generate a unique ID for document chunks
 */
export function generateChunkId(documentId: string, chunkIndex: number): string {
  return `${documentId}-chunk-${chunkIndex}`;
}
