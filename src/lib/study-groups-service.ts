// Study Groups Service
import { StudyGroup, StudyGroupMember, GroupChatMessage } from '@/types';

const API_BASE = '/api/study-groups';

export const studyGroupsService = {
  // Get all study groups
  async getGroups(type: 'my' | 'public' | 'all' = 'my'): Promise<StudyGroup[]> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}?type=${type}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch study groups');
    }

    const data = await response.json();
    return data.groups;
  },

  // Get group details
  async getGroup(groupId: string) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch group details');
    }

    return response.json();
  },

  // Create a new study group
  async createGroup(data: {
    name: string;
    description?: string;
    subjectId?: string;
    isPrivate?: boolean;
    maxMembers?: number;
  }): Promise<StudyGroup> {
    const token = localStorage.getItem('accessToken');
    
    console.log('Service: Sending data to API:', data);
    
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    console.log('Service: API response status:', response.status);

    if (!response.ok) {
      throw new Error('Failed to create study group');
    }

    const result = await response.json();
    return result.group;
  },

  // Update study group
  async updateGroup(groupId: string, data: {
    name?: string;
    description?: string;
    isPrivate?: boolean;
    maxMembers?: number;
  }): Promise<StudyGroup> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update study group');
    }

    const result = await response.json();
    return result.group;
  },

  // Delete study group
  async deleteGroup(groupId: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/${groupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete study group');
    }
  },

  // Join a study group
  async joinGroup(groupId: string, inviteCode?: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ inviteCode })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join study group');
    }
  },

  // Get group messages
  async getMessages(groupId: string, limit: number = 50, offset: number = 0): Promise<GroupChatMessage[]> {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found. Please login again.');
      }

      const response = await fetch(`${API_BASE}/${groupId}/messages?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('You are not a member of this group.');
        } else if (response.status === 404) {
          throw new Error('Group not found.');
        } else {
          throw new Error(errorData.error || `Failed to fetch messages (${response.status})`);
        }
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Get messages error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch messages. Please try again.');
    }
  },

  // Send a message
  async sendMessage(groupId: string, message: string, messageType: string = 'text', metadata?: any): Promise<GroupChatMessage> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/${groupId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message, messageType, metadata })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const result = await response.json();
    return result.data;
  }
};
