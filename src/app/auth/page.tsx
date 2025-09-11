
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, BookOpen, Users, Zap } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding and features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative">
              <Brain className="h-12 w-12" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <Zap className="h-3 w-3 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">SmartNotes AI</h1>
          </div>
          
          <h2 className="text-2xl font-semibold mb-6">
            Your Intelligent Study Companion
          </h2>
          
          <p className="text-primary-foreground/90 mb-8">
            Transform your study materials into interactive learning experiences with our advanced AI-powered platform.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary-foreground/20 p-2 rounded-lg flex-shrink-0">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Smart Document Processing</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Upload PDFs and notes. Our AI extracts, indexes, and structures your content automatically using advanced NLP techniques.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary-foreground/20 p-2 rounded-lg flex-shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Intelligent Q&A System</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Ask questions about your materials and get contextual answers with real-world examples powered by GPT-4.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary-foreground/20 p-2 rounded-lg flex-shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Collaborative Learning</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Share notes, create study groups, and learn together with your classmates in real-time.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary-foreground/20 p-2 rounded-lg flex-shrink-0">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Adaptive Quiz Generation</h3>
                <p className="text-primary-foreground/80 text-sm">
                  AI generates personalized quizzes based on your learning progress and knowledge gaps.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-primary-foreground/10 rounded-lg border border-primary-foreground/20">
            <p className="text-sm text-primary-foreground/90">
              "SmartNotes AI has transformed how I study. The AI-generated quizzes and real-world examples make learning so much more effective!"
            </p>
            <p className="text-xs text-primary-foreground/70 mt-2">
              - kaviya, Computer Science Student
            </p>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-primary-foreground/60">
              Join thousands of students enhancing their learning with AI
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">SmartNotes AI</h1>
            </div>
            <p className="text-muted-foreground">Your AI-Powered Study Companion</p>
          </div>

          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
