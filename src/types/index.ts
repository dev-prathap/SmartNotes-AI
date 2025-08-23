
// Core types for SmartNotes AI application

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'admin';
    avatar?: string;
    createdAt: string;
    lastLoginAt: string;
  }
  
  export interface Subject {
    id: string;
    name: string;
    description?: string;
    color: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Document {
    id: string;
    title: string;
    content: string;
    type: 'pdf' | 'note' | 'study-guide';
    subjectId: string;
    userId: string;
    fileUrl?: string;
    extractedText?: string;
    isProcessed: boolean;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Question {
    id: string;
    question: string;
    answer: string;
    documentId: string;
    subjectId: string;
    userId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'multiple-choice' | 'short-answer' | 'essay';
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    createdAt: string;
  }
  
  export interface Quiz {
    id: string;
    title: string;
    description?: string;
    subjectId: string;
    userId: string;
    questions: Question[];
    timeLimit?: number;
    difficulty: 'easy' | 'medium' | 'hard';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface QuizAttempt {
    id: string;
    quizId: string;
    userId: string;
    answers: Record<string, string>;
    score: number;
    totalQuestions: number;
    timeSpent: number;
    completedAt: string;
    createdAt: string;
  }
  
  export interface StudySession {
    id: string;
    title: string;
    subjectId: string;
    userId: string;
    participants: string[];
    isActive: boolean;
    sharedDocuments: string[];
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    message: string;
    type: 'text' | 'document' | 'question';
    timestamp: string;
  }
  
  export interface AIResponse {
    id: string;
    question: string;
    answer: string;
    context: string[];
    followUpQuestions: string[];
    examples: string[];
    confidence: number;
    sources: string[];
    createdAt: string;
  }
  
  export interface ProgressData {
    userId: string;
    subjectId: string;
    totalStudyTime: number;
    documentsRead: number;
    quizzesCompleted: number;
    averageScore: number;
    streakDays: number;
    lastStudyDate: string;
    weeklyGoal: number;
    achievements: Achievement[];
  }
  
  export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
    category: 'study' | 'quiz' | 'collaboration' | 'streak';
  }
  
  export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      studyReminders: boolean;
      quizDeadlines: boolean;
    };
    aiSettings: {
      responseLength: 'short' | 'medium' | 'detailed';
      includeExamples: boolean;
      difficultyPreference: 'adaptive' | 'easy' | 'medium' | 'hard';
    };
  }
  