// Documents Service - Frontend API client for documents CRUD operations

export interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  subject_id?: string;
  subject_name?: string;
  subject_color?: string;
  created_at: string;
}

export interface UploadDocumentData {
  file: File;
  title: string;
  description?: string;
  subjectId?: string;
}

export interface UpdateDocumentData {
  id: string;
  title?: string;
  description?: string;
  subjectId?: string;
}

class DocumentsService {
  private getAuthHeaders(): HeadersInit {
    const storedAuth = localStorage.getItem('smartnotes_auth');
    if (!storedAuth) {
      throw new Error('Not authenticated');
    }

    const { accessToken } = JSON.parse(storedAuth);
    return {
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  // Get all documents for the current user
  async getDocuments(subjectId?: string, status?: string): Promise<Document[]> {
    try {
      const params = new URLSearchParams();
      if (subjectId) params.append('subject', subjectId);
      if (status) params.append('status', status);

      const queryString = params.toString();
      const url = `/api/documents${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch documents');
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  }

  // Upload a new document
  async uploadDocument(uploadData: UploadDocumentData): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      if (uploadData.description) {
        formData.append('description', uploadData.description);
      }
      if (uploadData.subjectId) {
        formData.append('subjectId', uploadData.subjectId);
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload document');
        } catch (jsonError) {
          // If JSON parsing fails, throw a generic error
          throw new Error(`Upload failed with status ${response.status}`);
        }
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error('Server response was invalid. Please try again or contact support.');
      }
      
      return data.document;
    } catch (error: any) {
      console.error('Upload document error:', error);
      
      // Provide more helpful error messages
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  // Update an existing document
  async updateDocument(updateData: UpdateDocumentData): Promise<Document> {
    try {
      const response = await fetch('/api/documents', {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update document');
      }

      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Update document error:', error);
      throw error;
    }
  }

  // Delete a document
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  // Get documents by subject
  async getDocumentsBySubject(subjectId: string): Promise<Document[]> {
    try {
      return await this.getDocuments(subjectId);
    } catch (error) {
      console.error('Get documents by subject error:', error);
      throw error;
    }
  }

  // Get documents by processing status
  async getDocumentsByStatus(status: string): Promise<Document[]> {
    try {
      return await this.getDocuments(undefined, status);
    } catch (error) {
      console.error('Get documents by status error:', error);
      throw error;
    }
  }

  // Search documents (basic implementation)
  async searchDocuments(query: string): Promise<Document[]> {
    try {
      // For now, we'll get all documents and filter client-side
      // In a production system, you'd want server-side search
      const allDocuments = await this.getDocuments();
      const searchTerm = query.toLowerCase();

      return allDocuments.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.description?.toLowerCase().includes(searchTerm) ||
        doc.file_name.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Search documents error:', error);
      throw error;
    }
  }

  // Get document statistics
  async getDocumentStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    try {
      const documents = await this.getDocuments();

      const stats = {
        total: documents.length,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        totalSize: 0,
      };

      documents.forEach(doc => {
        // Count by status
        stats.byStatus[doc.processing_status] = (stats.byStatus[doc.processing_status] || 0) + 1;

        // Count by type
        const type = doc.file_type.toLowerCase();
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Sum file sizes
        stats.totalSize += doc.file_size;
      });

      return stats;
    } catch (error) {
      console.error('Get document stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const documentsService = new DocumentsService();
export default documentsService;
