"use client";

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Send, Loader2, BookOpen, MessageSquare, Lightbulb, Sparkles, Target, TrendingUp, Clock, User, Copy, Check, Trash2, Download, History, RotateCcw, Edit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import { documentsService } from '@/lib/documents-service';
import { subjectsService } from '@/lib/subjects-service';
import chatHistoryService, { ChatHistoryItem } from '@/lib/chat-history-service';
import chatSessionService, { ChatSession } from '@/lib/chat-session-service';
import { AIResponse } from '@/types';
import { Subject } from '@/lib/subjects-service';
import { Document } from '@/lib/documents-service';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  aiResponse?: AIResponse;
  isEditing?: boolean;
  originalContent?: string;
}

// Mermaid Diagram Component
const MermaidDiagram = ({ code }: { code: string }) => {
  const [diagramId] = useState(() => `mermaid_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
  const [copied, setCopied] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        // Initialize mermaid with proper config
        mermaid.initialize({ 
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          }
        });

        // Clean the code and generate SVG
        const cleanCode = code.trim();
        const { svg } = await mermaid.render(diagramId, cleanCode);
        setSvgContent(svg);
        setError('');
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        setError('Failed to render diagram');
        setSvgContent('');
      }
    };

    if (code.trim()) {
      renderDiagram();
    }
  }, [code, diagramId]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 p-4 bg-background border rounded-lg overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Mermaid Diagram</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      
      {error ? (
        <div className="text-center py-4">
          <p className="text-red-500 text-sm mb-2">{error}</p>
          <pre className="text-xs p-3 bg-muted rounded text-left overflow-x-auto">
            {code}
          </pre>
        </div>
      ) : svgContent ? (
        <div 
          className="mermaid-diagram text-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div className="text-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Rendering diagram...</p>
        </div>
      )}
    </div>
  );
};

// Code Block Component with Syntax Highlighting
const CodeBlock = ({ language, children }: { language?: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4">
      <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg">
        <span className="text-xs font-medium text-muted-foreground">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-6 w-6 p-0"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          fontSize: '0.875rem',
        }}
        showLineNumbers
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

export default function AIChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [groupedChatHistory, setGroupedChatHistory] = useState<[string, any][]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string>(crypto.randomUUID());
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSubjectsAndDocuments = async () => {
      if (user) {
        try {
          const userSubjects = await subjectsService.getSubjects();
          const userDocuments = await documentsService.getDocuments();
          const userChatHistory = await chatHistoryService.getChatHistory();
          setSubjects(userSubjects);
          setDocuments(userDocuments);
          setChatHistory(userChatHistory);
          
          // Set default subject to first available subject
          if (userSubjects.length > 0 && selectedSubject === 'all') {
            setSelectedSubject(userSubjects[0].id);
          }
          
          // Initialize with first subject if none selected
          if (userSubjects.length > 0 && !selectedSubject) {
            setSelectedSubject(userSubjects[0].id);
          }
        } catch (error) {
          console.error('Error fetching subjects and documents:', error);
        }
      }
    };

    fetchSubjectsAndDocuments();
  }, [user, selectedSubject]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const getRelevantDocuments = (question: string, subjectId?: string) => {
    let relevantDocs = documents.filter(doc => doc.processing_status === 'completed');
    
    if (subjectId && subjectId !== 'all') {
      relevantDocs = relevantDocs.filter(doc => doc.subject_id === subjectId);
    }

    // Simple keyword matching for demo
    const keywords = question.toLowerCase().split(' ').filter(word => word.length > 3);
    if (keywords.length > 0) {
      relevantDocs = relevantDocs.filter(doc => 
        keywords.some(keyword => 
          doc.title.toLowerCase().includes(keyword) ||
          doc.file_name.toLowerCase().includes(keyword)
        )
      );
    }

    return relevantDocs.slice(0, 5); // Limit to 5 most relevant documents
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare the request payload
      const payload = {
        question: inputMessage,
        subjectId: selectedSubject !== 'all' ? selectedSubject : undefined,
        conversationId
      };

      // Get stored auth token
      const storedAuth = localStorage.getItem('smartnotes_auth');
      if (!storedAuth) {
        throw new Error('Not authenticated');
      }

      const { accessToken } = JSON.parse(storedAuth);

      // Call the question answering API with streaming
      const response = await fetch('/api/documents/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';
      let aiMessageId = crypto.randomUUID();
      
      // Create initial AI message
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date().toISOString(),
        aiResponse: {
          id: crypto.randomUUID(),
          question: inputMessage.trim(),
          answer: '',
          context: [],
          followUpQuestions: [],
          examples: [],
          confidence: 0,
          sources: [],
          createdAt: new Date().toISOString(),
        },
      };

      setMessages(prev => [...prev, aiMessage]);

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = JSON.parse(line.slice(6));
                  if (jsonData.content) {
                    fullAnswer += jsonData.content;
                    
                    // Update the message with streaming content
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === aiMessageId 
                          ? { 
                              ...msg, 
                              content: fullAnswer,
                              aiResponse: msg.aiResponse ? {
                                ...msg.aiResponse,
                                answer: fullAnswer
                              } : undefined
                            }
                          : msg
                      )
                    );
                  }
                  
                  if (jsonData.done) {
                    // Final update with complete data
                    setMessages(prev => {
                      const updatedMessages = prev.map(msg => 
                        msg.id === aiMessageId 
                          ? { 
                              ...msg, 
                              content: fullAnswer,
                              aiResponse: msg.aiResponse ? {
                                ...msg.aiResponse,
                                answer: fullAnswer,
                                context: jsonData.context || [],
                                followUpQuestions: jsonData.followUpQuestions || [],
                                examples: jsonData.examples || [],
                                confidence: jsonData.confidence || 0,
                                sources: jsonData.sources || [],
                              } : undefined
                            }
                          : msg
                      );
                      
                      // Save session after completion
                      saveChatSession(updatedMessages);
                      return updatedMessages;
                    });
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      // Auto-scroll to bottom during streaming
      const scrollToBottom = () => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      };
      
      // Initial scroll
      setTimeout(scrollToBottom, 100);
      
      // Periodic scroll during streaming
      const scrollInterval = setInterval(scrollToBottom, 500);
      setTimeout(() => clearInterval(scrollInterval), 10000); // Stop after 10 seconds
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isEditing: true, originalContent: msg.content, content } 
          : msg
      )
    );
  };

  const handleSaveEdit = async (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId && msg.isEditing
          ? { ...msg, isEditing: false, originalContent: undefined } 
          : msg
      )
    );
  };

  const handleCancelEdit = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId && msg.isEditing
          ? { ...msg, isEditing: false, content: msg.originalContent || msg.content, originalContent: undefined } 
          : msg
      )
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleExportChat = () => {
    const chatContent = messages.map(msg => 
      `${msg.type === 'user' ? 'Student' : 'AI'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartnotes-chat-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveChatSession = async (sessionMessages: ChatMessage[]) => {
    if (sessionMessages.length === 0) return;
    
    try {
      const title = sessionMessages.find(m => m.type === 'user')?.content?.substring(0, 50) + '...' || 'New Chat';
      
      // Save to backend database
      await chatSessionService.saveChatSession(conversationId, title, sessionMessages);
      
      // Also save to localStorage as fallback
      const existingSessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
      const sessionIndex = existingSessions.findIndex((session: any) => session.conversationId === conversationId);
      
      const sessionData = {
        conversationId,
        messages: sessionMessages,
        title,
        createdAt: sessionMessages[0]?.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (sessionIndex >= 0) {
        existingSessions[sessionIndex] = sessionData;
      } else {
        existingSessions.unshift(sessionData);
      }
      
      const limitedSessions = existingSessions.slice(0, 20);
      localStorage.setItem('chat_sessions', JSON.stringify(limitedSessions));
    } catch (error) {
      console.error('Failed to save chat session:', error);
      // Fallback to localStorage only if backend fails
      const existingSessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
      const sessionData = {
        conversationId,
        messages: sessionMessages,
        title: sessionMessages.find(m => m.type === 'user')?.content?.substring(0, 50) + '...' || 'New Chat',
        createdAt: sessionMessages[0]?.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      existingSessions.unshift(sessionData);
      localStorage.setItem('chat_sessions', JSON.stringify(existingSessions.slice(0, 20)));
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    // Start a new conversation
    setConversationId(crypto.randomUUID());
  };

  const handleLoadHistory = async () => {
    try {
      // Try to load from backend first
      let sessions: any[] = [];
      
      try {
        const backendSessions = await chatSessionService.getChatSessions();
        sessions = backendSessions.map(session => ({
          conversationId: session.conversationId,
          messages: session.messages,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        }));
      } catch (backendError) {
        console.warn('Backend sessions unavailable, falling back to localStorage:', backendError);
        // Fallback to localStorage
        sessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
      }
      
      // Convert sessions to grouped format for display
      const groupedSessions: [string, any][] = sessions.map((session: any) => [
        session.conversationId,
        session
      ]);
      
      setGroupedChatHistory(groupedSessions);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleUseHistoryItem = (item: ChatHistoryItem) => {
    setInputMessage(item.question);
    setShowHistory(false);
  };
  
  const handleLoadConversation = async (conversationId: string) => {
    try {
      // Try to load from backend first
      let session: any = null;
      
      try {
        const backendSessions = await chatSessionService.getChatSessions();
        session = backendSessions.find(s => s.conversationId === conversationId);
      } catch (backendError) {
        console.warn('Backend unavailable, falling back to localStorage:', backendError);
        // Fallback to localStorage
        const sessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
        session = sessions.find((s: any) => s.conversationId === conversationId);
      }
      
      if (session && session.messages) {
        setMessages(session.messages);
        setConversationId(conversationId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFollowUpQuestion = (question: string) => {
    setInputMessage(question);
  };

  const suggestedQuestions = [
    "Explain the main concepts from my recent uploads",
    "Create a summary of my notes",
    "What are the key points I should remember for my exam?",
    "Generate practice questions from my study materials",
    "Show me learning insights for this subject",
    "What should I focus on next?",
  ];

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] p-6 gap-6">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <CardTitle>AI Assistant</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLoadHistory}
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    History
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportChat}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearChat}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-48 bg-background border border-primary/20">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                            {subject.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 h-full">
                    <div className="mb-6 p-4 bg-primary/10 rounded-full">
                      <Brain className="h-16 w-16 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-center">SmartNotes AI Assistant</h3>
                    <p className="text-muted-foreground mb-8 text-center max-w-md">
                      I can help you understand your study materials, generate quizzes, and answer questions.
                    </p>
                    <div className="w-full max-w-2xl space-y-4">
                      <h4 className="text-lg font-semibold text-left">Try asking me:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {suggestedQuestions.map((question, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="text-left h-auto p-4 justify-start shadow-sm hover:shadow-md transition-shadow rounded-lg"
                            onClick={() => setInputMessage(question)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            <span className="text-sm">{question}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                      <p>Select a subject above to get started with your study materials</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          } relative group`}
                        >
                          {message.type === 'user' && user?.name && (
                            <div className="text-xs font-medium text-primary-foreground/80 mb-1">
                              {user.name}
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            {message.type === 'user' ? (
                              <User className="h-4 w-4 text-primary-foreground mt-0.5 flex-shrink-0" />
                            ) : (
                              <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              {message.isEditing ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={message.content}
                                    onChange={(e) => setMessages(prev => 
                                      prev.map(msg => 
                                        msg.id === message.id 
                                          ? { ...msg, content: e.target.value } 
                                          : msg
                                      )
                                    )}
                                    className="min-h-[100px]"
                                  />
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleSaveEdit(message.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleCancelEdit(message.id)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="prose prose-sm max-w-none break-words">
                                  {/* Hover actions for user messages */}
                                 
                                  <ReactMarkdown
                                    components={{
                                      h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-6 mb-4 first:mt-0" {...props} />,
                                      h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-5 mb-3 first:mt-0" {...props} />,
                                      h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-4 mb-2 first:mt-0" {...props} />,
                                      h4: ({ node, ...props }) => <h4 className="text-sm font-semibold mt-3 mb-2 first:mt-0" {...props} />,
                                      ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                                      ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                                      li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                                      p: ({ node, ...props }) => <p className="mb-4 leading-relaxed last:mb-0" {...props} />,
                                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground" {...props} />,
                                      table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-border" {...props} /></div>,
                                      th: ({ node, ...props }) => <th className="border border-border px-3 py-2 bg-muted font-semibold text-left" {...props} />,
                                      td: ({ node, ...props }) => <td className="border border-border px-3 py-2" {...props} />,
                                      code: ({ node, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const code = String(children).replace(/\n$/, '');
                                        
                                        if (match) {
                                          const language = match[1];
                                          if (language === 'mermaid') {
                                            return <MermaidDiagram code={code} />;
                                          }
                                          return <CodeBlock language={language}>{code}</CodeBlock>;
                                        }
                                        return <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>{children}</code>;
                                      },
                                      pre: ({ node, ...props }) => <pre className="my-4 p-3 bg-muted rounded overflow-x-auto text-sm" {...props} />,
                                      strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                                      a: ({ node, ...props }) => <a className="text-primary hover:underline" {...props} />,
                                      hr: ({ node, ...props }) => <hr className="my-6 border-border" {...props} />,
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                              
                              {!message.isEditing && (
                                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {message.type === 'user' && (
                                    <>
                                      <Button 
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 p-1 text-muted-foreground hover:text-primary hover:bg-muted rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditMessage(message.id, message.content);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteMessage(message.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                              
                              {message.aiResponse && (
                                <div className="mt-4 space-y-3">
                                  {/* Follow-up questions */}
                                  {message.aiResponse.followUpQuestions.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Follow-up questions:</p>
                                      <div className="space-y-1">
                                        {message.aiResponse.followUpQuestions.map((question, index) => (
                                          <Button
                                            key={index}
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-2 text-left justify-start"
                                            onClick={() => handleFollowUpQuestion(question)}
                                          >
                                            <MessageSquare className="h-3 w-3 mr-2" />
                                            {question}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Examples */}
                                  {message.aiResponse.examples.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Examples:</p>
                                      <div className="space-y-2">
                                        {message.aiResponse.examples.map((example, index) => (
                                          <div key={index} className="bg-background/50 rounded p-2 text-sm">
                                            <Lightbulb className="h-3 w-3 inline mr-1" />
                                            {example}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Sources */}
                                  {message.aiResponse.sources.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Sources:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {message.aiResponse.sources.map((source, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs">
                                            <BookOpen className="h-3 w-3 mr-1" />
                                            {source}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                 
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              {/* Input Area */}
              <div className="border-t p-4 bg-background flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about your study materials..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isLoading || !inputMessage.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with learning insights */}
        <div className="w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Learning Focus
              </CardTitle>
              <CardDescription>
                {selectedSubject === 'all' 
                  ? 'Select a subject to see insights' 
                  : `AI-powered assistance for ${subjects.find(s => s.id === selectedSubject)?.name || 'this subject'}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Available Documents</p>
                <p className="text-2xl font-bold text-primary">
                  {documents.filter(d => d.processing_status === 'completed' && 
                    (selectedSubject === 'all' || d.subject_id === selectedSubject)).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Processed documents ready for AI analysis
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Active Subject</p>
                <Badge variant="outline" className="flex items-center gap-2">
                  {selectedSubject === 'all' 
                    ? 'All Subjects' 
                    : (
                      <>
                        <div className={`w-3 h-3 rounded-full ${subjects.find(s => s.id === selectedSubject)?.color || 'bg-gray-400'}`} />
                        {subjects.find(s => s.id === selectedSubject)?.name || 'Unknown'}
                      </>
                    )
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Chat History
              </CardTitle>
              <CardDescription>
                Your recent conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[300px] overflow-y-auto space-y-3">
                {groupedChatHistory.map(([conversationId, session]: [string, any]) => {
                  const messageCount = session.messages?.length || 0;
                  
                  return (
                    <div 
                      key={conversationId}
                      className="p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleLoadConversation(conversationId)}
                    >
                      <p className="text-sm font-medium line-clamp-1">{session.title}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground">
                          {messageCount} message{messageCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {groupedChatHistory.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No chat history yet. Start a conversation to see it here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
