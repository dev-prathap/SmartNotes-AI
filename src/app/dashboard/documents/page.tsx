
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { documentsStorage, subjectsStorage } from '@/lib/storage';
import { Document, Subject } from '@/types';
import { FileText, Upload, Search, Filter, Eye, Trash2, Download } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const selectedSubjectId = searchParams.get('subject');
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>(selectedSubjectId || 'all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (user) {
      const userDocuments = documentsStorage.getAll().filter(d => d.userId === user.id);
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
      setDocuments(userDocuments);
      setSubjects(userSubjects);
    }
  }, [user]);

  useEffect(() => {
    let filtered = documents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by subject
    if (filterSubject !== 'all') {
      filtered = filtered.filter(doc => doc.subjectId === filterSubject);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.type === filterType);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, filterSubject, filterType]);

  const handleDelete = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      documentsStorage.remove(documentId);
      const userDocuments = documentsStorage.getAll().filter(d => d.userId === user?.id);
      setDocuments(userDocuments);
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getSubjectColor = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || 'bg-gray-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'note':
        return '📝';
      case 'study-guide':
        return '📚';
      default:
        return '📄';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-1">
              Manage your study materials and documents
            </p>
          </div>
          <Link href="/dashboard/documents/upload">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="study-guide">Study Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {filteredDocuments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {documents.length === 0 
                  ? 'Upload your first document to get started with AI-powered learning'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {documents.length === 0 && (
                <Link href="/dashboard/documents/upload">
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Your First Document
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTypeIcon(document.type)}</span>
                      <div>
                        <CardTitle className="text-lg line-clamp-2">{document.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(document.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSubjectColor(document.subjectId)}`} />
                      <span className="text-sm text-muted-foreground">
                        {getSubjectName(document.subjectId)}
                      </span>
                    </div>
                    
                    {document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {document.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {document.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{document.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Badge variant={document.isProcessed ? 'default' : 'secondary'}>
                        {document.isProcessed ? 'Processed' : 'Processing...'}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link href={`/dashboard/documents/${document.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
