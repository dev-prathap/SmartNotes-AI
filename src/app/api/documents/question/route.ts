// API Route: /api/documents/question
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';
import { searchDocumentsWithContext, getConversationContext } from '@/lib/embedding-search';
import { AIResponse } from '@/types';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { question, subjectId, conversationId } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Get conversation context for better search results
    const conversationContext = await getConversationContext(decoded.userId, 5);

    // Search both documents and document chunks using advanced embedding similarity
    const searchOptions = {
      userId: decoded.userId,
      subjectId: subjectId || undefined,
      minSimilarity: 0.3,
      maxResults: 8,
      conversationContext
    };

    const documents = await searchDocumentsWithContext(question, searchOptions);

    if (documents.length === 0) {
      return NextResponse.json(
        { 
          answer: "I couldn't find any processed documents to answer your question. Please upload and process some documents first.",
          sources: [],
          confidence: 0
        }
      );
    }

    // Generate answer using OpenAI with document context
    const contextText = documents.map((doc: { title: string; similarity: number; content_text: string }) => 
      `Document: ${doc.title}
Similarity Score: ${Math.round(doc.similarity * 100)}%
Content: ${doc.content_text.substring(0, 8000)}`
    ).join('\n\n');

    // Add chat history context if available
    let historyContext = '';
    if (conversationContext.length > 0) {
      historyContext = `
**Recent Conversation Context:**
` + 
        conversationContext.map((item: { question: string; answer: string }) => 
          `Previous Question: ${item.question}
Previous Answer: ${item.answer}`
        ).join('\n---\n');
    }

    // Check if OpenAI client is configured
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are SmartNotes AI, an advanced educational assistant specialized in helping students learn from their uploaded documents.

**CRITICAL RULES:**
1. **ONLY use information from the provided document context** - Never use external knowledge
2. **Quote directly from documents** when answering - Use exact phrases and sentences from the content
3. **If the answer is not in the documents, say so clearly** - Don't make up information
4. **Cite document names** when referencing information
5. **Use ALL relevant content** from the provided documents - Don't ignore important details

**Your Responsibilities:**
- Extract and present information EXACTLY as it appears in the documents
- Explain concepts using ONLY the terminology and definitions from the documents
- When multiple documents are relevant, synthesize information from all of them
- Maintain accuracy - if something is unclear in the documents, acknowledge it
- Use similarity scores to prioritize which documents to reference first

**Response Guidelines:**
- Start with the most relevant document (highest similarity score)
- Quote key phrases directly from the documents
- Explain in the context of what the documents actually say
- If documents contradict each other, mention both perspectives
- Keep explanations clear and educational

**MERMAID DIAGRAM RULES:**
When users request diagrams (using words like "diagram", "visual", "flowchart", "mermaid", "show me", "illustrate"), create proper mermaid diagrams using this syntax:

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[Action 1]
    C -->|No| E[Action 2]
\`\`\`

For flowcharts use: graph TD, graph LR
For sequences use: sequenceDiagram
For class diagrams use: classDiagram
For mind maps use: mindmap

Always provide working mermaid syntax with proper node connections and clear labels.

**RESPONSE FORMAT:**
- Give direct answers without unnecessary phrases like "I understand" or "Let me help"
- Remove "Personalized Learning Insights" sections
- Remove excessive follow-up questions
- Focus on the core answer with one mermaid diagram when requested
- Reference previous conversation points when relevant for continuity
- Mention the most relevant document titles when citing information`
        },
        {
          role: 'user',
          content: `**Available Documents (sorted by relevance):**
${contextText}${historyContext}

**Student Question:** ${question}

**Instructions:**
1. Read ALL the provided document content carefully
2. Answer ONLY using information from these documents
3. Quote exact phrases from the documents when possible
4. Cite which document(s) you're referencing
5. If the answer isn't in the documents, clearly state that
6. If asked for diagrams, create proper mermaid syntax diagrams

Provide a comprehensive, accurate answer based strictly on the document content above.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    let fullAnswer = '';

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullAnswer += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          
          // Send end signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          
          // Save to database after streaming
          try {
            // Generate a conversation ID if not provided
            const convId = conversationId || crypto.randomUUID();
            
            await query(
              `INSERT INTO chat_history (user_id, conversation_id, question, answer, sources, confidence) 
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [decoded.userId, convId, question, fullAnswer, JSON.stringify(documents.map((doc: any) => ({ id: doc.id, title: doc.title }))), 0.9]
            );
          } catch (error) {
            console.error('Error saving chat history:', error);
          }
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Question answering error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
