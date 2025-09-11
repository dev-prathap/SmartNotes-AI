// Chat Session Service - Frontend API client for session-based chat operations

export interface ChatSession {
  id: string;
  conversationId: string;
  title: string;
  messages: any[];
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

class ChatSessionService {
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

  // Get chat sessions for the current user
  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch chat sessions';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (jsonError) {
          console.warn('Failed to parse error response as JSON:', jsonError);
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        return [];
      }

      try {
        const data = JSON.parse(responseText);
        return data.sessions || [];
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError, 'Response:', responseText);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Get chat sessions error:', error);
      throw error;
    }
  }

  // Save a chat session
  async saveChatSession(conversationId: string, title: string, messages: any[]): Promise<ChatSession> {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ conversationId, title, messages }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save chat session';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (jsonError) {
          console.warn('Failed to parse error response as JSON:', jsonError);
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      try {
        const data = JSON.parse(responseText);
        return data.session;
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError, 'Response:', responseText);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Save chat session error:', error);
      throw error;
    }
  }

  // Delete a chat session
  async deleteChatSession(conversationId?: string): Promise<void> {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete chat session';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (jsonError) {
          console.warn('Failed to parse error response as JSON:', jsonError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Delete chat session error:', error);
      throw error;
    }
  }

  // Clear all chat sessions
  async clearAllSessions(): Promise<void> {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to clear chat sessions';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (jsonError) {
          console.warn('Failed to parse error response as JSON:', jsonError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Clear chat sessions error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const chatSessionService = new ChatSessionService();
export default chatSessionService;
