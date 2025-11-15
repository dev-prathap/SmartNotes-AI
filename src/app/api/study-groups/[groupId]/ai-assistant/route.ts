import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { query } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
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

    const { groupId } = params;
    const { userMessage, context } = await request.json();

    // Check if user is a member
    const memberResult = await query(
      `SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, decoded.userId]
    );

    if (memberResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    const memberId = memberResult.rows[0].id;

    // Get group and subject info for context
    const groupResult = await query(
      `SELECT sg.*, s.name as subject_name 
       FROM study_groups sg
       LEFT JOIN subjects s ON sg.subject_id = s.id
       WHERE sg.id = $1`,
      [groupId]
    );

    const group = groupResult.rows[0];
    
    // Generate AI response based on the message
    const aiResponse = await generateAIResponse(userMessage, {
      ...context,
      groupName: group?.name,
      subjectName: group?.subject_name
    });

    // Insert AI message into database
    const messageResult = await query(
      `INSERT INTO group_chat_messages (group_id, user_id, message, message_type, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        groupId,
        decoded.userId,
        aiResponse,
        'text',
        JSON.stringify({
          trigger_message: userMessage,
          response_type: getResponseType(userMessage),
          sender: 'ai-assistant'
        })
      ]
    );

    // Map response to frontend format
    const rawMessage = messageResult.rows[0];
    const metadata = typeof rawMessage.metadata === 'string'
      ? JSON.parse(rawMessage.metadata)
      : rawMessage.metadata;

    const mappedMessage = {
      id: messageResult.rows[0].id,
      groupId: messageResult.rows[0].group_id,
      userId: 'ai-assistant',
      userName: '🤖 AI Assistant',
      userAvatar: null,
      message: rawMessage.message,
      messageType: 'ai_response',
      metadata,
      createdAt: rawMessage.created_at,
      updatedAt: rawMessage.updated_at
    };

    return NextResponse.json({
      message: 'AI response generated',
      data: mappedMessage
    });

  } catch (error) {
    console.error('AI assistant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAIResponse(userMessage: string, context: any): Promise<string> {
  const message = userMessage.toLowerCase();
  
  // Quiz generation
  if (message.includes('quiz') || message.includes('test') || message.includes('question')) {
    return generateQuizResponse(userMessage, context);
  }
  
  // Study help
  if (message.includes('help') || message.includes('explain') || message.includes('how')) {
    return generateStudyHelpResponse(userMessage, context);
  }
  
  // Subject-specific responses
  if (context.subjectName) {
    return generateSubjectResponse(userMessage, context);
  }
  
  // General responses
  return generateGeneralResponse(userMessage, context);
}

function generateQuizResponse(userMessage: string, context: any): string {
  const quizTypes = [
    "📝 **Quick Quiz Time!**\n\n**Question:** What is the main concept we've been discussing?\n\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\n\n*Reply with A, B, C, or D!*",
    
    "🎯 **Pop Quiz!**\n\n**True or False:** The topic we're studying is fundamental to understanding the subject.\n\n*Reply with True or False!*",
    
    "🧠 **Think About This:**\n\n**Question:** Can you explain the key difference between the concepts we discussed?\n\n*Share your thoughts below!*"
  ];
  
  return quizTypes[Math.floor(Math.random() * quizTypes.length)];
}

function generateStudyHelpResponse(userMessage: string, context: any): string {
  const helpResponses = [
    `📚 **Study Tips for ${context.subjectName || 'this subject'}:**\n\n1. **Break it down** - Divide complex topics into smaller parts\n2. **Practice regularly** - Consistent practice beats cramming\n3. **Teach others** - Explaining concepts helps solidify understanding\n4. **Use multiple resources** - Different perspectives enhance learning\n\nWhat specific topic would you like help with?`,
    
    "🎯 **Learning Strategy:**\n\n**Active Recall** - Test yourself regularly instead of just re-reading notes\n**Spaced Repetition** - Review material at increasing intervals\n**Elaborative Interrogation** - Ask yourself 'why' and 'how' questions\n\nNeed help with a specific concept?",
    
    "💡 **Study Group Tips:**\n\n• **Discuss concepts** together\n• **Quiz each other** regularly\n• **Share different perspectives**\n• **Explain difficult topics** to group members\n\nHow can I help you study better?"
  ];
  
  return helpResponses[Math.floor(Math.random() * helpResponses.length)];
}

function generateSubjectResponse(userMessage: string, context: any): string {
  return `📖 **${context.subjectName} Study Assistant**\n\nI'm here to help with your ${context.subjectName} studies! I can:\n\n• Generate practice questions\n• Explain concepts\n• Provide study tips\n• Create quizzes\n\nWhat would you like to work on today? Try asking:\n• "@ai create a quiz about [topic]"\n• "@ai explain [concept]"\n• "@ai help with [problem]"`;
}

function generateGeneralResponse(userMessage: string, context: any): string {
  const generalResponses = [
    "👋 **Hi there!** I'm your AI study assistant. I can help you with:\n\n• Creating quizzes and practice questions\n• Explaining concepts\n• Providing study tips\n• Generating discussion topics\n\nJust mention me with @ai and ask away!",
    
    "🤖 **AI Assistant at your service!**\n\nI'm here to make your study group more productive. Try these commands:\n\n• `@ai quiz` - Generate a quick quiz\n• `@ai help` - Get study tips\n• `@ai explain [topic]` - Get explanations\n\nWhat can I help you learn today?",
    
    "✨ **Ready to learn together!**\n\nI can assist your study group with interactive learning. Some things I can do:\n\n📝 Create custom quizzes\n🧠 Generate practice questions\n💡 Provide study strategies\n🎯 Explain difficult concepts\n\nHow can I help your group succeed?"
  ];
  
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

function getResponseType(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  if (message.includes('quiz') || message.includes('test')) return 'quiz';
  if (message.includes('help') || message.includes('explain')) return 'help';
  if (message.includes('question')) return 'question';
  
  return 'general';
}
