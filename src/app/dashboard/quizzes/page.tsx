
"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { quizzesStorage, quizAttemptsStorage, subjectsStorage } from '@/lib/storage';
import { Quiz, QuizAttempt, Subject } from '@/types';
import { Brain, Clock, Trophy, Play, Plus, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (user) {
      const userQuizzes = quizzesStorage.getAll().filter(q => q.userId === user.id);
      const userAttempts = quizAttemptsStorage.getByUser(user.id);
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
      
      setQuizzes(userQuizzes);
      setAttempts(userAttempts);
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

  const getQuizAttempts = (quizId: string) => {
    return attempts.filter(a => a.quizId === quizId);
  };

  const getBestScore = (quizId: string) => {
    const quizAttempts = getQuizAttempts(quizId);
    return quizAttempts.length > 0 ? Math.max(...quizAttempts.map(a => a.score)) : 0;
  };

  const getAverageScore = () => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quizzes</h1>
            <p className="text-muted-foreground mt-1">
              Test your knowledge with AI-generated quizzes
            </p>
          </div>
          <Link href="/dashboard/quizzes/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
                  <p className="text-2xl font-bold">{quizzes.length}</p>
                </div>
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Attempts</p>
                  <p className="text-2xl font-bold">{attempts.length}</p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{getAverageScore()}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Best Score</p>
                  <p className="text-2xl font-bold">
                    {attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0}%
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {quizzes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first quiz to start testing your knowledge
              </p>
              <Link href="/dashboard/quizzes/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const quizAttempts = getQuizAttempts(quiz.id);
              const bestScore = getBestScore(quiz.id);
              
              return (
                <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                        {quiz.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {quiz.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getSubjectColor(quiz.subjectId)}`} />
                          <span className="text-sm text-muted-foreground">
                            {getSubjectName(quiz.subjectId)}
                          </span>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-white ${getDifficultyColor(quiz.difficulty)}`}
                        >
                          {quiz.difficulty}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Brain className="h-4 w-4" />
                          {quiz.questions.length} questions
                        </div>
                        {quiz.timeLimit && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {quiz.timeLimit} min
                          </div>
                        )}
                      </div>

                      {quizAttempts.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Best Score</span>
                            <span className="font-medium">{bestScore}%</span>
                          </div>
                          <Progress value={bestScore} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {quizAttempts.length} attempt{quizAttempts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Link href={`/dashboard/quizzes/${quiz.id}/take`} className="flex-1">
                          <Button className="w-full">
                            <Play className="mr-2 h-4 w-4" />
                            {quizAttempts.length > 0 ? 'Retake' : 'Start Quiz'}
                          </Button>
                        </Link>
                        <Link href={`/dashboard/quizzes/${quiz.id}`}>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
