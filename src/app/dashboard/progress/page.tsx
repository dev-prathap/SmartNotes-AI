
"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  subjectsStorage, 
  documentsStorage, 
  quizzesStorage,
  quizAttemptsStorage, 
  progressStorage 
} from '@/lib/storage';
import { Subject, QuizAttempt, ProgressData } from '@/types';
import { 
  TrendingUp, 
  BookOpen, 
  Brain, 
  Clock, 
  Trophy, 
  Target,
  Calendar,
  BarChart3
} from 'lucide-react';

export default function ProgressPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [progressData, setProgressData] = useState<Record<string, ProgressData>>({});
  const [overallStats, setOverallStats] = useState({
    totalStudyTime: 0,
    documentsRead: 0,
    quizzesCompleted: 0,
    averageScore: 0,
    streakDays: 0,
    weeklyGoal: 100,
  });

  useEffect(() => {
    if (user) {
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
      const userAttempts = quizAttemptsStorage.getByUser(user.id);
      const userDocuments = documentsStorage.getAll().filter(d => d.userId === user.id);
      
      setSubjects(userSubjects);
      setAttempts(userAttempts);

      // Calculate progress for each subject
      const subjectProgress: Record<string, ProgressData> = {};
      userSubjects.forEach(subject => {
        const subjectAttempts = userAttempts.filter(a => {
          // Find quiz and check if it belongs to this subject
          const quiz = quizzesStorage.getAll().find(q => q.id === a.quizId);
          return quiz?.subjectId === subject.id;
        });
        
        const subjectDocs = userDocuments.filter(d => d.subjectId === subject.id);
        
        subjectProgress[subject.id] = {
          userId: user.id,
          subjectId: subject.id,
          totalStudyTime: Math.floor(Math.random() * 50) + 10, // Mock data
          documentsRead: subjectDocs.filter(d => d.isProcessed).length,
          quizzesCompleted: subjectAttempts.length,
          averageScore: subjectAttempts.length > 0 
            ? Math.round(subjectAttempts.reduce((sum, a) => sum + a.score, 0) / subjectAttempts.length)
            : 0,
          streakDays: Math.floor(Math.random() * 10) + 1, // Mock data
          lastStudyDate: new Date().toISOString(),
          weeklyGoal: 100,
          achievements: [],
        };
      });
      
      setProgressData(subjectProgress);

      // Calculate overall stats
      const totalStudyTime = Object.values(subjectProgress).reduce((sum, p) => sum + p.totalStudyTime, 0);
      const totalDocsRead = Object.values(subjectProgress).reduce((sum, p) => sum + p.documentsRead, 0);
      const avgScore = userAttempts.length > 0 
        ? Math.round(userAttempts.reduce((sum, a) => sum + a.score, 0) / userAttempts.length)
        : 0;
      
      setOverallStats({
        totalStudyTime,
        documentsRead: totalDocsRead,
        quizzesCompleted: userAttempts.length,
        averageScore: avgScore,
        streakDays: Math.max(...Object.values(subjectProgress).map(p => p.streakDays), 0),
        weeklyGoal: 100,
      });
    }
  }, [user]);

  const getSubjectColor = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || 'bg-gray-500';
  };

  const getRecentAttempts = () => {
    return attempts
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 10);
  };

  const getWeeklyProgress = () => {
    const weeklyStudyTime = overallStats.totalStudyTime;
    return Math.min((weeklyStudyTime / overallStats.weeklyGoal) * 100, 100);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Progress & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your learning journey and achievements
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Study Time</p>
                  <p className="text-2xl font-bold">{overallStats.totalStudyTime}h</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documents Read</p>
                  <p className="text-2xl font-bold">{overallStats.documentsRead}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{overallStats.averageScore}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                  <p className="text-2xl font-bold">{overallStats.streakDays} days</p>
                </div>
                <Trophy className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">By Subject</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Weekly Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Weekly Goal Progress
                </CardTitle>
                <CardDescription>
                  Track your weekly study time goal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Study Time This Week</span>
                    <span>{overallStats.totalStudyTime}h / {overallStats.weeklyGoal}h</span>
                  </div>
                  <Progress value={getWeeklyProgress()} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {getWeeklyProgress() >= 100 
                      ? '🎉 Congratulations! You\'ve reached your weekly goal!' 
                      : `${Math.round(overallStats.weeklyGoal - overallStats.totalStudyTime)}h remaining to reach your goal`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Quizzes</span>
                      <span className="font-medium">{overallStats.quizzesCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Score</span>
                      <span className="font-medium">{overallStats.averageScore}%</span>
                    </div>
                    <Progress value={overallStats.averageScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Study Consistency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Current Streak</span>
                      <span className="font-medium">{overallStats.streakDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Documents Processed</span>
                      <span className="font-medium">{overallStats.documentsRead}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Last study session: Today
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            {subjects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No subjects yet</h3>
                  <p className="text-muted-foreground">
                    Create subjects to track your progress by topic
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map((subject) => {
                  const progress = progressData[subject.id];
                  if (!progress) return null;

                  return (
                    <Card key={subject.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${subject.color}`} />
                          {subject.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Study Time</p>
                              <p className="text-lg font-semibold">{progress.totalStudyTime}h</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Avg Score</p>
                              <p className="text-lg font-semibold">{progress.averageScore}%</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Documents Read</span>
                              <span>{progress.documentsRead}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Quizzes Completed</span>
                              <span>{progress.quizzesCompleted}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Study Streak</span>
                              <span>{progress.streakDays} days</span>
                            </div>
                          </div>

                          {progress.averageScore > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Performance</span>
                                <span>{progress.averageScore}%</span>
                              </div>
                              <Progress value={progress.averageScore} className="h-2" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quiz Attempts</CardTitle>
                <CardDescription>
                  Your latest quiz performances
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attempts.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No quiz attempts yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getRecentAttempts().map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">Quiz Attempt</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(attempt.completedAt).toLocaleDateString()} • 
                            {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={attempt.score >= 80 ? 'default' : attempt.score >= 60 ? 'secondary' : 'destructive'}
                          >
                            {attempt.score}%
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {attempt.totalQuestions} questions
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
