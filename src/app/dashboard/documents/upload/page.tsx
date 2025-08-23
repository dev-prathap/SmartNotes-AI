
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { documentsStorage, subjectsStorage } from '@/lib/storage';
import { AIService } from '@/lib/ai-service';
import { Document, Subject } from '@/types';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';

export default function UploadDocumentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSubject = searchParams.get('subject');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'note' as 'pdf' | 'note' | 'study-guide',
    subjectId: preselectedSubject || '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
      setSubjects(userSubjects);
      
      if (preselectedSubject && userSubjects.find(s => s.id === preselectedSubject)) {
        setFormData(prev => ({ ...prev, subjectId: preselectedSubject }));
      }
    }
  }, [user, preselectedSubject]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!formData.title) {
        setFormData(prev => ({ 
          ...prev, 
          title: selectedFile.name.replace(/\.[^/.]+$/, '') 
        }));
      }
      
      // Set type based on file extension
      if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setFormData(prev => ({ ...prev, type: 'pdf' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.subjectId) {
        throw new Error('Please select a subject');
      }
      if (!formData.content.trim() && !file) {
        throw new Error('Please provide content or upload a file');
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Create document
      const newDocument: Document = {
        id: Date.now().toString(),
        title: formData.title,
        content: formData.content || `Uploaded file: ${file?.name}`,
        type: formData.type,
        subjectId: formData.subjectId,
        userId: user.id,
        fileUrl: file ? URL.createObjectURL(file) : undefined,
        isProcessed: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save document
      documentsStorage.add(newDocument);
      setUploadProgress(100);

      // Process document with AI (simulate)
      setTimeout(async () => {
        try {
          const processedDocument = await AIService.processDocument(newDocument);
          documentsStorage.update(processedDocument.id, processedDocument);
        } catch (error) {
          console.error('Error processing document:', error);
        }
      }, 1000);

      clearInterval(progressInterval);
      
      // Redirect to documents page
      setTimeout(() => {
        router.push('/dashboard/documents');
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (subjects.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-6">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No subjects found</h3>
              <p className="text-muted-foreground mb-6">
                You need to create at least one subject before uploading documents.
              </p>
              <Button onClick={() => router.push('/dashboard/subjects')}>
                Create Subject
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Upload Document</h1>
          <p className="text-muted-foreground mt-1">
            Add a new document to your study materials
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>
              Provide information about your document for better organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isUploading && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Uploading document... {uploadProgress}%
                    {uploadProgress === 100 && (
                      <span className="flex items-center gap-2 mt-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Upload complete! Processing with AI...
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Document Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter document title"
                    required
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Document Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'pdf' | 'note' | 'study-guide') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                    disabled={isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="study-guide">Study Guide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={formData.subjectId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file">Upload File (Optional)</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  disabled={isUploading}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT
                </p>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter document content or notes..."
                  rows={8}
                  disabled={isUploading}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {file ? 'Optional: Add additional notes about the uploaded file' : 'Required if no file is uploaded'}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isUploading} className="flex-1">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
