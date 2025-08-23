
// localStorage utilities for data persistence

import { User, Subject, Document, Quiz, QuizAttempt, StudySession, AIResponse, ProgressData, AppSettings } from '@/types';

// Storage keys
const STORAGE_KEYS = {
  USER: 'smartnotes_user',
  SUBJECTS: 'smartnotes_subjects',
  DOCUMENTS: 'smartnotes_documents',
  QUIZZES: 'smartnotes_quizzes',
  QUIZ_ATTEMPTS: 'smartnotes_quiz_attempts',
  STUDY_SESSIONS: 'smartnotes_study_sessions',
  AI_RESPONSES: 'smartnotes_ai_responses',
  PROGRESS: 'smartnotes_progress',
  SETTINGS: 'smartnotes_settings',
} as const;

// Generic storage functions
export function getFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}

// User management
export const userStorage = {
  get: (): User | null => getFromStorage<User>(STORAGE_KEYS.USER),
  set: (user: User) => saveToStorage(STORAGE_KEYS.USER, user),
  remove: () => removeFromStorage(STORAGE_KEYS.USER),
};

// Subjects management
export const subjectsStorage = {
  getAll: (): Subject[] => getFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS) || [],
  set: (subjects: Subject[]) => saveToStorage(STORAGE_KEYS.SUBJECTS, subjects),
  add: (subject: Subject) => {
    const subjects = subjectsStorage.getAll();
    subjects.push(subject);
    subjectsStorage.set(subjects);
  },
  update: (id: string, updates: Partial<Subject>) => {
    const subjects = subjectsStorage.getAll();
    const index = subjects.findIndex(s => s.id === id);
    if (index !== -1) {
      subjects[index] = { ...subjects[index], ...updates, updatedAt: new Date().toISOString() };
      subjectsStorage.set(subjects);
    }
  },
  remove: (id: string) => {
    const subjects = subjectsStorage.getAll().filter(s => s.id !== id);
    subjectsStorage.set(subjects);
  },
};

// Documents management
export const documentsStorage = {
  getAll: (): Document[] => getFromStorage<Document[]>(STORAGE_KEYS.DOCUMENTS) || [],
  getBySubject: (subjectId: string): Document[] => {
    return documentsStorage.getAll().filter(d => d.subjectId === subjectId);
  },
  set: (documents: Document[]) => saveToStorage(STORAGE_KEYS.DOCUMENTS, documents),
  add: (document: Document) => {
    const documents = documentsStorage.getAll();
    documents.push(document);
    documentsStorage.set(documents);
  },
  update: (id: string, updates: Partial<Document>) => {
    const documents = documentsStorage.getAll();
    const index = documents.findIndex(d => d.id === id);
    if (index !== -1) {
      documents[index] = { ...documents[index], ...updates, updatedAt: new Date().toISOString() };
      documentsStorage.set(documents);
    }
  },
  remove: (id: string) => {
    const documents = documentsStorage.getAll().filter(d => d.id !== id);
    documentsStorage.set(documents);
  },
};

// Quizzes management
export const quizzesStorage = {
  getAll: (): Quiz[] => getFromStorage<Quiz[]>(STORAGE_KEYS.QUIZZES) || [],
  getBySubject: (subjectId: string): Quiz[] => {
    return quizzesStorage.getAll().filter(q => q.subjectId === subjectId);
  },
  set: (quizzes: Quiz[]) => saveToStorage(STORAGE_KEYS.QUIZZES, quizzes),
  add: (quiz: Quiz) => {
    const quizzes = quizzesStorage.getAll();
    quizzes.push(quiz);
    quizzesStorage.set(quizzes);
  },
  update: (id: string, updates: Partial<Quiz>) => {
    const quizzes = quizzesStorage.getAll();
    const index = quizzes.findIndex(q => q.id === id);
    if (index !== -1) {
      quizzes[index] = { ...quizzes[index], ...updates, updatedAt: new Date().toISOString() };
      quizzesStorage.set(quizzes);
    }
  },
  remove: (id: string) => {
    const quizzes = quizzesStorage.getAll().filter(q => q.id !== id);
    quizzesStorage.set(quizzes);
  },
};

// Quiz attempts management
export const quizAttemptsStorage = {
  getAll: (): QuizAttempt[] => getFromStorage<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS) || [],
  getByUser: (userId: string): QuizAttempt[] => {
    return quizAttemptsStorage.getAll().filter(a => a.userId === userId);
  },
  getByQuiz: (quizId: string): QuizAttempt[] => {
    return quizAttemptsStorage.getAll().filter(a => a.quizId === quizId);
  },
  set: (attempts: QuizAttempt[]) => saveToStorage(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts),
  add: (attempt: QuizAttempt) => {
    const attempts = quizAttemptsStorage.getAll();
    attempts.push(attempt);
    quizAttemptsStorage.set(attempts);
  },
};

// Study sessions management
export const studySessionsStorage = {
  getAll: (): StudySession[] => getFromStorage<StudySession[]>(STORAGE_KEYS.STUDY_SESSIONS) || [],
  getByUser: (userId: string): StudySession[] => {
    return studySessionsStorage.getAll().filter(s => 
      s.userId === userId || s.participants.includes(userId)
    );
  },
  set: (sessions: StudySession[]) => saveToStorage(STORAGE_KEYS.STUDY_SESSIONS, sessions),
  add: (session: StudySession) => {
    const sessions = studySessionsStorage.getAll();
    sessions.push(session);
    studySessionsStorage.set(sessions);
  },
  update: (id: string, updates: Partial<StudySession>) => {
    const sessions = studySessionsStorage.getAll();
    const index = sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates, updatedAt: new Date().toISOString() };
      studySessionsStorage.set(sessions);
    }
  },
};

// AI responses management
export const aiResponsesStorage = {
  getAll: (): AIResponse[] => getFromStorage<AIResponse[]>(STORAGE_KEYS.AI_RESPONSES) || [],
  set: (responses: AIResponse[]) => saveToStorage(STORAGE_KEYS.AI_RESPONSES, responses),
  add: (response: AIResponse) => {
    const responses = aiResponsesStorage.getAll();
    responses.push(response);
    // Keep only last 100 responses to prevent storage bloat
    if (responses.length > 100) {
      responses.splice(0, responses.length - 100);
    }
    aiResponsesStorage.set(responses);
  },
};

// Progress management
export const progressStorage = {
  get: (userId: string, subjectId: string): ProgressData | null => {
    const allProgress = getFromStorage<ProgressData[]>('smartnotes_all_progress') || [];
    return allProgress.find(p => p.userId === userId && p.subjectId === subjectId) || null;
  },
  set: (progress: ProgressData) => {
    const allProgress = getFromStorage<ProgressData[]>('smartnotes_all_progress') || [];
    const index = allProgress.findIndex(p => p.userId === progress.userId && p.subjectId === progress.subjectId);
    
    if (index !== -1) {
      allProgress[index] = progress;
    } else {
      allProgress.push(progress);
    }
    
    saveToStorage('smartnotes_all_progress', allProgress);
  },
};

// Settings management
export const settingsStorage = {
  get: (): AppSettings => {
    return getFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS) || {
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        studyReminders: true,
        quizDeadlines: true,
      },
      aiSettings: {
        responseLength: 'medium',
        includeExamples: true,
        difficultyPreference: 'adaptive',
      },
    };
  },
  set: (settings: AppSettings) => saveToStorage(STORAGE_KEYS.SETTINGS, settings),
  update: (updates: Partial<AppSettings>) => {
    const current = settingsStorage.get();
    settingsStorage.set({ ...current, ...updates });
  },
};

// Utility function to clear all data (for logout or reset)
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeFromStorage(key);
  });
  removeFromStorage('smartnotes_all_progress');
}

// Initialize default data if needed
export function initializeDefaultData(): void {
  // This can be called on app startup to ensure basic data structure exists
  if (!getFromStorage(STORAGE_KEYS.SUBJECTS)) {
    saveToStorage(STORAGE_KEYS.SUBJECTS, []);
  }
  if (!getFromStorage(STORAGE_KEYS.DOCUMENTS)) {
    saveToStorage(STORAGE_KEYS.DOCUMENTS, []);
  }
  if (!getFromStorage(STORAGE_KEYS.QUIZZES)) {
    saveToStorage(STORAGE_KEYS.QUIZZES, []);
  }
}
