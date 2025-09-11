// Quizzes Service - Frontend API client for quiz operations

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  timeTakenSeconds?: number;
  completedAt: string;
}

class QuizzesService {
  private getAuthHeaders(): HeadersInit {
    const storedAuth = localStorage.getItem('smartnotes_auth');
    if (!storedAuth) {
      throw new Error('Not authenticated');
    }

    const { accessToken } = JSON.parse(storedAuth);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  // Get all quizzes for the current user
  async getQuizzes(): Promise<Quiz[]> {
    try {
      const response = await fetch('/api/quizzes', {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data = await response.json();
      return data.quizzes || [];
    } catch (error) {
      console.error('Get quizzes error:', error);
      return [];
    }
  }

  // Get quiz attempts for the current user
  async getQuizAttempts(): Promise<QuizAttempt[]> {
    try {
      const response = await fetch('/api/quizzes/attempts', {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz attempts');
      }

      const data = await response.json();
      return data.attempts || [];
    } catch (error) {
      console.error('Get quiz attempts error:', error);
      return [];
    }
  }

  // Create a new quiz
  async createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quiz> {
    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(quiz),
      });

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      const data = await response.json();
      return data.quiz;
    } catch (error) {
      console.error('Create quiz error:', error);
      throw error;
    }
  }

  // Submit quiz attempt
  async submitQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<QuizAttempt> {
    try {
      const response = await fetch(`/api/quizzes/${attempt.quizId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          answers: {}, // Placeholder for answers object
          timeTakenSeconds: attempt.timeTakenSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz attempt');
      }

      const data = await response.json();
      return {
        ...attempt,
        id: data.attempt.id,
        completedAt: data.attempt.completed_at,
      };
    } catch (error) {
      console.error('Submit quiz attempt error:', error);
      throw error;
    }
  }

  // Get specific quiz details
  async getQuizDetails(quizId: string): Promise<Quiz | null> {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz details');
      }

      const data = await response.json();
      return data.quiz;
    } catch (error) {
      console.error('Get quiz details error:', error);
      return null;
    }
  }

  // Update quiz
  async updateQuiz(quizId: string, quiz: Partial<Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Quiz> {
    try {
      const response = await fetch('/api/quizzes', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ id: quizId, ...quiz }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quiz');
      }

      const data = await response.json();
      return data.quiz;
    } catch (error) {
      console.error('Update quiz error:', error);
      throw error;
    }
  }

  // Delete quiz
  async deleteQuiz(quizId: string): Promise<void> {
    try {
      const response = await fetch(`/api/quizzes?id=${quizId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete quiz');
      }
    } catch (error) {
      console.error('Delete quiz error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const quizzesService = new QuizzesService();
export default quizzesService;
