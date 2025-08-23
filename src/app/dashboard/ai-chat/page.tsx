
"use client";

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { documentsStorage, subjectsStorage, aiResponsesStorage } from '@/lib/storage';
import { AIService } from '@/lib/ai-service';
import { Document, Subject, AIResponse } from '@/types';
import { Brain, Send, Loader2, BookOpen, Lightbulb, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  aiResponse?: AIResponse;
}

export default function AIChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
      const userDocuments = documentsStorage.getAll().filter(d => d.userId === user.id);
      setSubjects(userSubjects);
      setDocuments(userDocuments);
    }
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getRelevantDocuments = (question: string, subjectId?: string) => {
    let relevantDocs = documents.filter(doc => doc.isProcessed);
    
    if (subjectId && subjectId !== 'all') {
      relevantDocs = relevantDocs.filter(doc => doc.subjectId === subjectId);
    }

    // Simple keyword matching for demo
    const keywords = question.toLowerCase().split(' ').filter(word => word.length > 3);
    if (keywords.length > 0) {
      relevantDocs = relevantDocs.filter(doc => 
        keywords.some(keyword => 
          doc.title.toLowerCase().includes(keyword) ||
          doc.content.toLowerCase().includes(keyword) ||
          doc.extractedText?.toLowerCase().includes(keyword)
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
      // Get relevant documents for context
      const relevantDocs = getRelevantDocuments(
        inputMessage, 
        selectedSubject !== 'all' ? selectedSubject : undefined
      );

      // Generate AI response
      const aiResponse = await AIService.generateAnswer(
        inputMessage,
        relevantDocs,
        'medium'
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.answer,
        timestamp: new Date().toISOString(),
        aiResponse,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
    "Create a summary of my Computer Science notes",
    "What are the key points I should remember for my exam?",
    "Generate practice questions from my study materials",
  ];

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] p-6 gap-6">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <CardTitle>AI Assistant</CardTitle>
                </div>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
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
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Ask me anything!</h3>
                    <p className="text-muted-foreground mb-6">
                      I can help you understand your study materials, generate quizzes, and answer questions.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                      {suggestedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="text-left h-auto p-3"
                          onClick={() => setInputMessage(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.type === 'ai' && (
                              <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              
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
                                  
                                  {/* Confidence */}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Confidence: {Math.round(message.aiResponse.confidence * 100)}%</span>
                                  </div>
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
              <div className="border-t p-4">
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

        {/* Sidebar with context info */}
        <div className="w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Available Documents</p>
                <p className="text-2xl font-bold text-primary">
                  {documents.filter(d => d.isProcessed).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Processed documents ready for AI analysis
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Active Subject</p>
                <Badge variant="outline">
                  {selectedSubject === 'all' 
                    ? 'All Subjects' 
                    : subjects.find(s => s.id === selectedSubject)?.name || 'Unknown'
                  }
                </Badge>
              </div>
              
              {documents.length === 0 && (
                <div className="text-center py-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload documents to get better AI responses
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
