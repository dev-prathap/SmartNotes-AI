// Subjects Service - Frontend API client for subjects CRUD operations

export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateSubjectData {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

class SubjectsService {
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

  // Get all subjects for the current user
  async getSubjects(): Promise<Subject[]> {
    try {
      const response = await fetch('/api/subjects', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch subjects');
      }

      const data = await response.json();
      return data.subjects || [];
    } catch (error) {
      console.error('Get subjects error:', error);
      throw error;
    }
  }

  // Create a new subject
  async createSubject(subjectData: CreateSubjectData): Promise<Subject> {
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(subjectData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subject');
      }

      const data = await response.json();
      return data.subject;
    } catch (error) {
      console.error('Create subject error:', error);
      throw error;
    }
  }

  // Update an existing subject
  async updateSubject(subjectData: UpdateSubjectData): Promise<Subject> {
    try {
      const response = await fetch('/api/subjects', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(subjectData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update subject');
      }

      const data = await response.json();
      return data.subject;
    } catch (error) {
      console.error('Update subject error:', error);
      throw error;
    }
  }

  // Delete a subject
  async deleteSubject(subjectId: string): Promise<void> {
    try {
      const response = await fetch(`/api/subjects?id=${subjectId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete subject');
      }
    } catch (error) {
      console.error('Delete subject error:', error);
      throw error;
    }
  }

  // Toggle subject active status
  async toggleSubjectStatus(subjectId: string, isActive: boolean): Promise<Subject> {
    try {
      return await this.updateSubject({
        id: subjectId,
        is_active: isActive,
      });
    } catch (error) {
      console.error('Toggle subject status error:', error);
      throw error;
    }
  }

  // Get active subjects only
  async getActiveSubjects(): Promise<Subject[]> {
    try {
      const subjects = await this.getSubjects();
      return subjects.filter(subject => subject.is_active);
    } catch (error) {
      console.error('Get active subjects error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const subjectsService = new SubjectsService();
export default subjectsService;
