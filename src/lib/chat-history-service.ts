// Chat History Service - Frontend API client for chat history operations

export interface ChatHistoryItem {
  id: string;
  conversationId: string;
  question: string;
  answer: string;
  sources: Array<{ id: string; title: string }>;
  confidence: number;
  createdAt: string;
}

class ChatHistoryService {
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

  // Get chat history for the current user
  async getChatHistory(limit: number = 50): Promise<ChatHistoryItem[]> {
    try {
      const response = await fetch('/api/chat/history', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch chat history');
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error;
    }
  }

  // Save a chat item to history
  async saveChatItem(conversationId: string, question: string, answer: string, sources: Array<{ id: string; title: string }>, confidence: number): Promise<ChatHistoryItem> {
    try {
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ conversationId, question, answer, sources, confidence }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save chat item');
      }

      const data = await response.json();
      return data.chatItem;
    } catch (error) {
      console.error('Save chat item error:', error);
      throw error;
    }
  }

  // Clear chat history
  async clearChatHistory(): Promise<void> {
    try {
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear chat history');
      }
    } catch (error) {
      console.error('Clear chat history error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const chatHistoryService = new ChatHistoryService();
export default chatHistoryService;
