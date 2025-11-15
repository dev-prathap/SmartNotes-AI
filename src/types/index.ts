
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

  // Study Groups
  export interface StudyGroup {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    creator_name?: string;
    creator_email?: string;
    subjectId?: string;
    isPrivate: boolean;
    inviteCode: string;
    maxMembers: number;
    memberCount?: number;
    createdAt: string;
    updatedAt: string;
  }

  export interface StudyGroupMember {
    id: string;
    groupId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    role: 'admin' | 'moderator' | 'member';
    joinedAt: string;
  }

  export interface GroupChatMessage {
    id: string;
    groupId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    message: string;
    messageType: 'text' | 'file' | 'quiz' | 'announcement' | 'ai_response';
    metadata?: any;
    createdAt: string;
  }

  export interface GroupSharedDocument {
    id: string;
    groupId: string;
    documentId: string;
    documentTitle: string;
    sharedBy: string;
    sharedByName: string;
    sharedAt: string;
  }

  export interface GroupQuizCompetition {
    id: string;
    groupId: string;
    quizId: string;
    createdBy: string;
    title: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    isActive: boolean;
    participantCount?: number;
    createdAt: string;
  }

  export interface GroupQuizParticipant {
    id: string;
    competitionId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    score: number;
    timeTakenSeconds?: number;
    completedAt?: string;
  }

  // Flashcards
  export interface Flashcard {
    id: string;
    userId: string;
    documentId?: string;
    subjectId?: string;
    frontText: string;
    backText: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }

  export interface FlashcardDeck {
    id: string;
    userId: string;
    name: string;
    description?: string;
    subjectId?: string;
    isPublic: boolean;
    cardCount?: number;
    createdAt: string;
    updatedAt: string;
  }

  export interface FlashcardDeckItem {
    id: string;
    deckId: string;
    flashcardId: string;
    flashcard?: Flashcard;
    position: number;
    addedAt: string;
  }

  export interface FlashcardReview {
    id: string;
    userId: string;
    flashcardId: string;
    quality: number; // 0-5 (SM-2 algorithm)
    easinessFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: string;
    reviewedAt: string;
  }

  // Document Summaries
  export interface DocumentSummary {
    id: string;
    documentId: string;
    userId: string;
    summaryType: 'short' | 'medium' | 'long' | 'key_points';
    summaryText: string;
    wordCount: number;
    createdAt: string;
  }
  