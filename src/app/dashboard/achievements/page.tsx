
"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { quizAttemptsStorage, documentsStorage, subjectsStorage } from '@/lib/storage';
import { Achievement } from '@/types';
import { Trophy, Star, Target, BookOpen, Brain, Users, Zap, Award } from 'lucide-react';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({
    documentsUploaded: 0,
    quizzesCompleted: 0,
    averageScore: 0,
    studyStreak: 0,
    subjectsCreated: 0,
  });

  useEffect(() => {
    if (user) {
      const userDocuments = documentsStorage.getAll().filter(d => d.userId === user.id);
      const userAttempts = quizAttemptsStorage.getByUser(user.id);
      const userSubjects = subjectsStorage.getAll().filter(s => s.userId === user.id);
      
      const avgScore = userAttempts.length > 0 
        ? Math.round(userAttempts.reduce((sum, a) => sum + a.score, 0) / userAttempts.length)
        : 0;

      setStats({
        documentsUploaded: userDocuments.length,
        quizzesCompleted: userAttempts.length,
        averageScore: avgScore,
        studyStreak: Math.floor(Math.random() * 15) + 1, // Mock data
        subjectsCreated: userSubjects.length,
      });

      // Generate achievements based on user progress
      const generatedAchievements = generateAchievements({
        documentsUploaded: userDocuments.length,
        quizzesCompleted: userAttempts.length,
        averageScore: avgScore,
        studyStreak: Math.floor(Math.random() * 15) + 1,
        subjectsCreated: userSubjects.length,
      });

      setAchievements(generatedAchievements);
    }
  }, [user]);

  const generateAchievements = (userStats: typeof stats): Achievement[] => {
    const achievements: Achievement[] = [];
    const now = new Date().toISOString();

    // Document upload achievements
    if (userStats.documentsUploaded >= 1) {
      achievements.push({
        id: 'first-upload',
        title: 'First Steps',
        description: 'Upload your first document',
        icon: '📄',
        unlockedAt: now,
        category: 'study',
      });
    }
    if (userStats.documentsUploaded >= 5) {
      achievements.push({
        id: 'document-collector',
        title: 'Document Collector',
        description: 'Upload 5 documents',
        icon: '📚',
        unlockedAt: now,
        category: 'study',
      });
    }
    if (userStats.documentsUploaded >= 10) {
      achievements.push({
        id: 'knowledge-hoarder',
        title: 'Knowledge Hoarder',
        description: 'Upload 10 documents',
        icon: '🗂️',
        unlockedAt: now,
        category: 'study',
      });
    }

    // Quiz achievements
    if (userStats.quizzesCompleted >= 1) {
      achievements.push({
        id: 'quiz-starter',
        title: 'Quiz Starter',
        description: 'Complete your first quiz',
        icon: '🧠',
        unlockedAt: now,
        category: 'quiz',
      });
    }
    if (userStats.quizzesCompleted >= 5) {
      achievements.push({
        id: 'quiz-enthusiast',
        title: 'Quiz Enthusiast',
        description: 'Complete 5 quizzes',
        icon: '🎯',
        unlockedAt: now,
        category: 'quiz',
      });
    }
    if (userStats.averageScore >= 80) {
      achievements.push({
        id: 'high-achiever',
        title: 'High Achiever',
        description: 'Maintain an 80% average score',
        icon: '⭐',
        unlockedAt: now,
        category: 'quiz',
      });
    }
    if (userStats.averageScore >= 90) {
      achievements.push({
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Maintain a 90% average score',
        icon: '💎',
        unlockedAt: now,
        category: 'quiz',
      });
    }

    // Study streak achievements
    if (userStats.studyStreak >= 3) {
      achievements.push({
        id: 'consistent-learner',
        title: 'Consistent Learner',
        description: 'Study for 3 days in a row',
        icon: '🔥',
        unlockedAt: now,
        category: 'streak',
      });
    }
    if (userStats.studyStreak >= 7) {
      achievements.push({
        id: 'week-warrior',
        title: 'Week Warrior',
        description: 'Study for 7 days in a row',
        icon: '⚡',
        unlockedAt: now,
        category: 'streak',
      });
    }

    // Subject achievements
    if (userStats.subjectsCreated >= 1) {
      achievements.push({
        id: 'organizer',
        title: 'Organizer',
        description: 'Create your first subject',
        icon: '📋',
        unlockedAt: now,
        category: 'study',
      });
    }
    if (userStats.subjectsCreated >= 3) {
      achievements.push({
        id: 'multi-disciplinary',
        title: 'Multi-disciplinary',
        description: 'Create 3 different subjects',
        icon: '🎓',
        unlockedAt: now,
        category: 'study',
      });
    }

    return achievements;
  };

  const upcomingAchievements = [
    {
      title: 'Speed Reader',
      description: 'Upload 20 documents',
      icon: '📖',
      progress: (stats.documentsUploaded / 20) * 100,
      category: 'study',
    },
    {
      title: 'Quiz Master',
      description: 'Complete 25 quizzes',
      icon: '🏆',
      progress: (stats.quizzesCompleted / 25) * 100,
      category: 'quiz',
    },
    {
      title: 'Study Streak Champion',
      description: 'Study for 30 days in a row',
      icon: '🏅',
      progress: (stats.studyStreak / 30) * 100,
      category: 'streak',
    },
    {
      title: 'Perfect Score',
      description: 'Get 100% on a quiz',
      icon: '💯',
      progress: stats.averageScore >= 100 ? 100 : 0,
      category: 'quiz',
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study':
        return BookOpen;
      case 'quiz':
        return Brain;
      case 'streak':
        return Zap;
      case 'collaboration':
        return Users;
      default:
        return Trophy;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study':
        return 'text-blue-600';
      case 'quiz':
        return 'text-purple-600';
      case 'streak':
        return 'text-orange-600';
      case 'collaboration':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-muted-foreground mt-1">
            Track your learning milestones and unlock new badges
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.documentsUploaded}</p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.quizzesCompleted}</p>
              <p className="text-sm text-muted-foreground">Quizzes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.averageScore}%</p>
              <p className="text-sm text-muted-foreground">Avg Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.studyStreak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{achievements.length}</p>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unlocked Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Unlocked Achievements
              </CardTitle>
              <CardDescription>
                Badges you've earned on your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No achievements yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start studying to unlock your first badge!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {achievements.map((achievement) => {
                    const IconComponent = getCategoryIcon(achievement.category);
                    return (
                      <div key={achievement.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <IconComponent className="h-3 w-3 mr-1" />
                              {achievement.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Upcoming Achievements
              </CardTitle>
              <CardDescription>
                Badges you can unlock next
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {upcomingAchievements.map((achievement, index) => {
                  const IconComponent = getCategoryIcon(achievement.category);
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl opacity-50">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <IconComponent className="h-3 w-3 mr-1" />
                          {achievement.category}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(achievement.progress)}%</span>
                        </div>
                        <Progress value={achievement.progress} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
