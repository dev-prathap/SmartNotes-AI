
"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { subjectsService } from '@/lib/subjects-service';
import { documentsService } from '@/lib/documents-service';
// import quizzesService from '@/lib/quizzes-service';
import { chatSessionService } from '@/lib/chat-session-service';
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
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    averageScore: 0,
    streakDays: 0,
    documentsProcessed: 0,
    totalQuizzes: 0,
    chatSessions: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Load real data from services
        const [userSubjects, userDocuments, sessions] = await Promise.all([
          subjectsService.getSubjects(),
          documentsService.getDocuments(),
          chatSessionService.getChatSessions().catch(() => [])
        ]);

        // Mock quiz data for now
        const userQuizzes: Quiz[] = [];
        const allAttempts: QuizAttempt[] = [];
        const recentAttempts = allAttempts.slice(0, 5);

        setSubjects(userSubjects as any);
        setDocuments(userDocuments as any);
        setQuizzes(userQuizzes);
        setRecentAttempts(recentAttempts);
        setChatSessions(sessions);

        // Calculate real stats
        const avgScore = allAttempts.length > 0 
          ? allAttempts.reduce((sum: number, attempt: any) => sum + attempt.score, 0) / allAttempts.length
          : 0;

        const processedDocs = userDocuments.filter((d: any) => d.processing_status === 'completed').length;
        const totalStudyTime = calculateStudyTime(allAttempts, sessions);
        const streakDays = calculateStreakDays(allAttempts);

        setStats({
          totalStudyTime,
          averageScore: Math.round(avgScore),
          streakDays,
          documentsProcessed: processedDocs,
          totalQuizzes: userQuizzes.length,
          chatSessions: sessions.length,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const calculateStudyTime = (attempts: QuizAttempt[], sessions: any[]) => {
    // Calculate from quiz attempts (assume 2 minutes per question on average)
    const quizTime = attempts.reduce((total, attempt) => {
      return total + ((attempt as any).timeTakenSeconds || 120) / 3600; // Convert to hours
    }, 0);
    
    // Estimate from chat sessions (assume 5 minutes per session)
    const chatTime = sessions.length * 0.083; // 5 minutes in hours
    
    return Math.round(quizTime + chatTime);
  };

  const calculateStreakDays = (attempts: QuizAttempt[]) => {
    if (attempts.length === 0) return 0;
    
    const today = new Date();
    const sortedAttempts = attempts.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const attempt of sortedAttempts) {
      const attemptDate = new Date(attempt.completedAt);
      const daysDiff = Math.floor((currentDate.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        streak++;
        currentDate = attemptDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const quickStats = [
    {
      title: 'Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'text-blue-600',
      href: '/dashboard/subjects',
      description: 'Active subjects'
    },
    {
      title: 'Documents',
      value: documents.length,
      icon: FileText,
      color: 'text-green-600',
      href: '/dashboard/documents',
      description: `${stats.documentsProcessed} processed`
    },
    {
      title: 'Quizzes',
      value: stats.totalQuizzes,
      icon: Brain,
      color: 'text-purple-600',
      href: '/dashboard/quizzes',
      description: `${recentAttempts.length} attempts`
    },
    {
      title: 'Chat Sessions',
      value: stats.chatSessions,
      icon: Trophy,
      color: 'text-orange-600',
      href: '/dashboard/ai-chat',
      description: 'AI conversations'
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : (
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
        )} {/* Quick Actions */}
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
