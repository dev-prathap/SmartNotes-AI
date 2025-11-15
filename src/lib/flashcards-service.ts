// Flashcards Service
import { Flashcard, FlashcardDeck, DocumentSummary } from '@/types';

const API_BASE = '/api/flashcards';

export const flashcardsService = {
  // Get all flashcards
  async getFlashcards(filters?: {
    subjectId?: string;
    documentId?: string;
    difficulty?: string;
  }): Promise<Flashcard[]> {
    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams();
    
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.documentId) params.append('documentId', filters.documentId);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);

    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch flashcards');
    }

    const data = await response.json();
    return data.flashcards;
  },

  // Create a manual flashcard
  async createFlashcard(data: {
    frontText: string;
    backText: string;
    difficulty?: string;
    subjectId?: string;
    documentId?: string;
    tags?: string[];
  }): Promise<Flashcard> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to create flashcard');
    }

    const result = await response.json();
    return result.flashcard;
  },

  // Generate flashcards from document using AI
  async generateFlashcards(documentId: string, count: number = 10, difficulty: string = 'medium'): Promise<Flashcard[]> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ documentId, count, difficulty })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate flashcards');
    }

    const result = await response.json();
    return result.flashcards;
  },

  // Get all decks
  async getDecks(): Promise<FlashcardDeck[]> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/decks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch decks');
    }

    const data = await response.json();
    return data.decks;
  },

  // Create a new deck
  async createDeck(data: {
    name: string;
    description?: string;
    subjectId?: string;
    isPublic?: boolean;
  }): Promise<FlashcardDeck> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/decks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to create deck');
    }

    const result = await response.json();
    return result.deck;
  },

  // Review a flashcard (for spaced repetition)
  async reviewFlashcard(flashcardId: string, quality: number): Promise<void> {
    const token = localStorage.getItem('accessToken');
    
    // Calculate next review using SM-2 algorithm
    const response = await fetch(`${API_BASE}/${flashcardId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quality })
    });

    if (!response.ok) {
      throw new Error('Failed to record review');
    }
  }
};

export const summaryService = {
  // Generate summary for a document
  async generateSummary(documentId: string, summaryType: 'short' | 'medium' | 'long' | 'key_points'): Promise<DocumentSummary> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/documents/${documentId}/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ summaryType })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate summary');
    }

    const result = await response.json();
    return result.summary;
  },

  // Get existing summaries for a document
  async getSummaries(documentId: string): Promise<DocumentSummary[]> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/documents/${documentId}/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch summaries');
    }

    const data = await response.json();
    return data.summaries;
  }
};
