
"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { studySessionsStorage, subjectsStorage } from '@/lib/storage';
import { StudySession, Subject } from '@/types';
import { Users, Plus, Clock, BookOpen, MessageSquare } from 'lucide-react';

export default function StudySessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (user) {
      const userSessions = studySessionsStorage.getByUser(user.id);
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
      setSessions(userSessions);
      setSubjects(userSubjects);
    }
  }, [user]);

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getSubjectColor = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || 'bg-gray-500';
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Study Sessions</h1>
            <p className="text-muted-foreground mt-1">
              Collaborate with classmates and join group study sessions
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
        </div>

        {sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No study sessions yet</h3>
              <p className="text-muted-foreground mb-6">
                Create or join study sessions to collaborate with your classmates
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={session.isActive ? 'default' : 'secondary'}>
                      {session.isActive ? 'Active' : 'Ended'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSubjectColor(session.subjectId)}`} />
                      <span className="text-sm text-muted-foreground">
                        {getSubjectName(session.subjectId)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {session.participants.length} participants
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {session.messages.length} messages
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      {session.sharedDocuments.length} shared documents
                    </div>

                    <Button 
                      variant={session.isActive ? 'default' : 'outline'} 
                      className="w-full mt-4"
                    >
                      {session.isActive ? 'Join Session' : 'View History'}
                    </Button>
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
