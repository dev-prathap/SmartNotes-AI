
"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { subjectsStorage, documentsStorage, quizzesStorage, quizAttemptsStorage } from '@/lib/storage';
import { Subject, Document, Quiz, QuizAttempt } from '@/types';
import { 
  BookOpen, 
  FileText, 
  Brain, 
  Trophy, 
  TrendingUp, 
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    averageScore: 0,
    streakDays: 0,
    documentsProcessed: 0,
  });

  useEffect(() => {
    if (user) {
      // Load user data
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
      const userDocuments = documentsStorage.getAll().filter(d => d.userId === user.id);
      const userQuizzes = quizzesStorage.getAll().filter(q => q.userId === user.id);
      const userAttempts = quizAttemptsStorage.getByUser(user.id).slice(0, 5);

      setSubjects(userSubjects);
      setDocuments(userDocuments);
      setQuizzes(userQuizzes);
      setRecentAttempts(userAttempts);

      // Calculate stats
      const avgScore = userAttempts.length > 0 
        ? userAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / userAttempts.length
        : 0;

      setStats({
        totalStudyTime: Math.floor(Math.random() * 120) + 30, // Mock data
        averageScore: Math.round(avgScore),
        streakDays: Math.floor(Math.random() * 15) + 1, // Mock data
        documentsProcessed: userDocuments.filter(d => d.isProcessed).length,
      });
    }
  }, [user]);

  const quickStats = [
    {
      title: 'Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'text-blue-600',
      href: '/dashboard/subjects',
    },
    {
      title: 'Documents',
      value: documents.length,
      icon: FileText,
      color: 'text-green-600',
      href: '/dashboard/documents',
    },
    {
      title: 'Quizzes Taken',
      value: recentAttempts.length,
      icon: Brain,
      color: 'text-purple-600',
      href: '/dashboard/quizzes',
    },
    {
      title: 'Study Streak',
      value: `${stats.streakDays} days`,
      icon: Trophy,
      color: 'text-orange-600',
      href: '/dashboard/progress',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground mt-1">
              Ready to continue your learning journey?
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/documents/upload">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest quiz attempts and study sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttempts.length > 0 ? (
                <div className="space-y-4">
                  {recentAttempts.map((attempt) => {
                    const quiz = quizzes.find(q => q.id === attempt.quizId);
                    return (
                      <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{quiz?.title || 'Quiz'}</p>
                          <p className="text-sm text-muted-foreground">
                            Score: {attempt.score}% • {new Date(attempt.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            attempt.score >= 80 ? 'text-green-600' : 
                            attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {attempt.score >= 80 ? 'Excellent' : 
                             attempt.score >= 60 ? 'Good' : 'Needs Work'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Link href="/dashboard/progress">
                    <Button variant="outline" className="w-full">
                      View All Activity
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No recent activity</p>
                  <Link href="/dashboard/quizzes">
                    <Button>Take Your First Quiz</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Study Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Study Progress
              </CardTitle>
              <CardDescription>
                Your learning statistics and achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Average Quiz Score</span>
                  <span>{stats.averageScore}%</span>
                </div>
                <Progress value={stats.averageScore} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Documents Processed</span>
                  <span>{stats.documentsProcessed}/{documents.length}</span>
                </div>
                <Progress 
                  value={documents.length > 0 ? (stats.documentsProcessed / documents.length) * 100 : 0} 
                  className="h-2" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.totalStudyTime}h</p>
                  <p className="text-sm text-muted-foreground">Study Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.streakDays}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>

              <Link href="/dashboard/progress">
                <Button variant="outline" className="w-full">
                  View Detailed Progress
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump into your most common tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/ai-chat">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Brain className="h-6 w-6" />
                  Ask AI Question
                </Button>
              </Link>
              <Link href="/dashboard/documents/upload">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  Upload Document
                </Button>
              </Link>
              <Link href="/dashboard/study-sessions">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <BookOpen className="h-6 w-6" />
                  Start Study Session
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
