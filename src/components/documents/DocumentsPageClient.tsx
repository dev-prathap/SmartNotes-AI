"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { documentsService, Document } from '@/lib/documents-service';
import { subjectsService, Subject } from '@/lib/subjects-service';
import {
  Upload,
  FileText,
  File,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Eye,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const FILE_TYPES = {
  'pdf': { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
  'doc': { icon: File, color: 'text-blue-500', bg: 'bg-blue-50' },
  'docx': { icon: File, color: 'text-blue-500', bg: 'bg-blue-50' },
  'txt': { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50' },
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  processing: { icon: AlertCircle, color: 'text-orange-500', label: 'Processing' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Ready for AI' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
};

function DocumentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const selectedSubjectId = searchParams.get('subject');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(selectedSubjectId || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Dialog states
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  // Form states
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    subjectId: '',
  });
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    subjectId: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading documents and subjects...');

      const [documentsData, subjectsData] = await Promise.all([
        documentsService.getDocuments().catch(error => {
          console.error('Failed to load documents:', error);
          return []; // Return empty array on error
        }),
        subjectsService.getActiveSubjects().catch(error => {
          console.error('Failed to load subjects:', error);
          return []; // Return empty array on error
        }),
      ]);

      console.log('Loaded documents:', documentsData.length);
      console.log('Loaded subjects:', subjectsData.length);

      setDocuments(documentsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title.trim()) {
      toast.error('Please select a file and enter a title');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const uploadData = {
        file: uploadForm.file,
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim() || undefined,
        subjectId: uploadForm.subjectId || undefined,
      };

      await documentsService.uploadDocument(uploadData);
      toast.success('Document uploaded successfully! AI processing in progress...');

      setIsUploadDialogOpen(false);
      resetUploadForm();
      loadData();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = async () => {
    if (!editingDocument || !editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await documentsService.updateDocument({
        id: editingDocument.id,
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        subjectId: editForm.subjectId || undefined,
      });

      toast.success('Document updated successfully!');
      setIsEditDialogOpen(false);
      setEditingDocument(null);
      loadData();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await documentsService.deleteDocument(documentId);
      toast.success('Document deleted successfully!');
      loadData();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  const openEditDialog = (document: Document) => {
    setEditingDocument(document);
    setEditForm({
      title: document.title,
      description: document.description || '',
      subjectId: '', // We'll need to get subject ID from document
    });
    setIsEditDialogOpen(true);
  };

  const resetUploadForm = () => {
    setUploadForm({
      file: null,
      title: '',
      description: '',
      subjectId: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedSubject === 'all' || doc.subject_id === selectedSubject || doc.subject_name === selectedSubject;
    const matchesStatus = selectedStatus === 'all' || doc.processing_status === selectedStatus;

    return matchesSearch && matchesSubject && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage your study documents with AI-powered vector processing
            </p>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a document to extract text and generate AI embeddings for better search and analysis.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">File *</Label>
                  <Input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Supported formats: PDF, Word (.doc/.docx), Text (.txt) - Max 10MB
                  </p>
                </div>
                <div>
                  <Label htmlFor="upload-title">Title *</Label>
                  <Input
                    id="upload-title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Document title"
                  />
                </div>
                <div>
                  <Label htmlFor="upload-description">Description</Label>
                  <Textarea
                    id="upload-description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Subject (Optional)</Label>
                  <Select
                    value={uploadForm.subjectId}
                    onValueChange={(value: string) => setUploadForm(prev => ({ ...prev, subjectId: value }))}
                    disabled={subjects.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={subjects.length === 0 ? "No subjects available" : "Select subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subject</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subjects.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No subjects found. Create subjects first to organize your documents.
                    </p>
                  )}
                </div>
                {uploading && (
                  <div className="space-y-2">
                    <Label>Processing with AI...</Label>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Processing...' : 'Upload Document'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Ready for AI</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {documents.length === 0 ? 'No documents yet' : 'No documents found'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {documents.length === 0
                  ? 'Upload your first document to start with AI-powered study materials.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {documents.length === 0 && (
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredDocuments.map((document) => {
              const fileType = document.file_type.toLowerCase();
              const fileTypeConfig = FILE_TYPES[fileType as keyof typeof FILE_TYPES] || FILE_TYPES.txt;
              const statusConfig = STATUS_CONFIG[document.processing_status];

              return (
                <Card key={document.id} className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-border/50 hover:border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${fileTypeConfig.bg} flex-shrink-0 shadow-sm`}>
                          <fileTypeConfig.icon className={`w-6 h-6 ${fileTypeConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2 leading-tight" title={document.title}>
                            {document.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-1 text-xs mt-1" title={document.description || document.file_name}>
                            {document.description || document.file_name}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(document)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                          title="Edit document"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              title="Delete document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{document.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(document.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="space-y-4">
                      {/* Status and File Size */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={document.processing_status === 'completed' ? "default" : "secondary"}
                          className="text-xs px-2 py-1"
                        >
                          <statusConfig.icon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatFileSize(document.file_size)}
                        </span>
                      </div>
                      
                      {/* Subject */}
                      {document.subject_name && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: document.subject_color }}
                          />
                          <span className="text-sm text-muted-foreground truncate" title={document.subject_name}>
                            {document.subject_name}
                          </span>
                        </div>
                      )}
                      
                      {/* File Details */}
                      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">File Name:</span>
                          <span className="font-mono truncate max-w-32" title={document.file_name}>
                            {document.file_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium uppercase">
                            {document.file_type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Uploaded:</span>
                          <span className="font-medium">
                            {new Date(document.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      {/* Processing Status */}
                      {document.processing_status === 'failed' && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                          <p className="text-xs text-destructive font-medium mb-1">Processing Failed</p>
                          <p className="text-xs text-destructive/80">
                            Document processing encountered an error. Please try re-uploading.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>
                Update document information and subject assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Select value={editForm.subjectId} onValueChange={(value: string) => setEditForm(prev => ({ ...prev, subjectId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subject</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>
                Update Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function DocumentsPageClient() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <DocumentsContent />
    </Suspense>
  );
}
