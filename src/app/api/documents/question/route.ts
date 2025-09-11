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
      minSimilarity: 0.5,
      maxResults: 5,
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
Content: ${doc.content_text.substring(0, 4000)}`
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
          content: `You are SmartNotes AI, an advanced educational assistant specialized in helping students learn and understand complex topics within specific subjects. Your role is to:

1. **Subject Mastery**: Focus exclusively on the documents within the specified subject
2. **Progressive Learning**: Adapt your responses based on the student's learning progress
3. **Knowledge Reinforcement**: Help students understand not just "what" but "why" and "how"
4. **Visual Learning**: Generate mermaid diagrams when users ask for "diagram", "visual", "flowchart", or "mermaid"
5. **Context Memory**: Use the recent conversation context to maintain continuity and build upon previous answers
6. **Study Optimization**: Suggest personalized learning strategies based on the content

When answering:
- Use only the document context from the specified subject
- Reference the recent conversation context when relevant to maintain continuity
- Provide comprehensive explanations that build on previous knowledge
- Keep explanations clear, structured, and educational
- Focus on direct, concise answers to user questions
- Reference previous conversation points when relevant for continuity
- Use the similarity scores to prioritize more relevant documents in your response

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
          content: `**Subject Context:**
${contextText}${historyContext}

**Student Question:** ${question}

Provide a clear, direct educational response. If the question asks for diagrams, visuals, flowcharts, or mermaid diagrams, include a proper mermaid diagram with correct syntax. Reference previous conversation points when relevant for continuity.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
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
