
"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { subjectsStorage, documentsStorage } from '@/lib/storage';
import { Subject } from '@/types';
import { BookOpen, Plus, Edit, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

const subjectColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
];

export default function SubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: subjectColors[0],
  });

  useEffect(() => {
    if (user) {
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
      setSubjects(userSubjects);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingSubject) {
      // Update existing subject
      subjectsStorage.update(editingSubject.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
      });
    } else {
      // Create new subject
      const newSubject: Subject = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        color: formData.color,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      subjectsStorage.add(newSubject);
    }

    // Refresh subjects
    const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
    setSubjects(userSubjects);

    // Reset form
    setFormData({ name: '', description: '', color: subjectColors[0] });
    setEditingSubject(null);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      color: subject.color,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (subjectId: string) => {
    if (confirm('Are you sure you want to delete this subject? This will also delete all associated documents.')) {
      subjectsStorage.remove(subjectId);
      // Also remove associated documents
      const documents = documentsStorage.getBySubject(subjectId);
      documents.forEach(doc => documentsStorage.remove(doc.id));
      
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user?.id);
      setSubjects(userSubjects);
    }
  };

  const getDocumentCount = (subjectId: string) => {
    return documentsStorage.getBySubject(subjectId).length;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Subjects</h1>
            <p className="text-muted-foreground mt-1">
              Organize your study materials by subject
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingSubject(null);
                setFormData({ name: '', description: '', color: subjectColors[0] });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Edit Subject' : 'Create New Subject'}
                </DialogTitle>
                <DialogDescription>
                  {editingSubject ? 'Update your subject details' : 'Add a new subject to organize your study materials'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Computer Science, Mathematics"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the subject"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Color Theme</Label>
                  <div className="flex gap-2 mt-2">
                    {subjectColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full ${color} ${
                          formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingSubject ? 'Update Subject' : 'Create Subject'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {subjects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No subjects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first subject to start organizing your study materials
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Subject
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${subject.color}`} />
                      <div>
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                        {subject.description && (
                          <CardDescription className="mt-1">
                            {subject.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(subject)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {getDocumentCount(subject.id)} documents
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/documents?subject=${subject.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Documents
                      </Button>
                    </Link>
                    <Link href={`/dashboard/documents/upload?subject=${subject.id}`}>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Link>
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
