
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Brain, BookOpen, Users, Zap, ArrowRight, Star, CheckCircle } from 'lucide-react';

export default function HomePage() {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">SmartNotes AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/auth')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Your AI-Powered Study Companion
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your learning experience with intelligent document processing, 
            AI-generated quizzes, and collaborative study features designed for modern students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push('/auth')} className="text-lg px-8">
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful AI features designed to enhance your learning and boost academic performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg border">
              <BookOpen className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Smart Document Processing</h3>
              <p className="text-muted-foreground">
                Upload PDFs, notes, and study materials. Our AI automatically extracts, 
                indexes, and structures your content for easy searching and learning.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Intelligent Q&A System</h3>
              <p className="text-muted-foreground">
                Ask questions about your materials and get contextual answers with 
                real-world examples and follow-up questions to deepen understanding.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Automated Quiz Generation</h3>
              <p className="text-muted-foreground">
                Generate custom quizzes from your study materials with adjustable 
                difficulty levels and detailed explanations for each answer.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Collaborative Learning</h3>
              <p className="text-muted-foreground">
                Share notes, create study groups, and collaborate with classmates 
                in real-time study sessions with synchronized content.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <Star className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your learning progress with detailed analytics, achievement 
                badges, and personalized study recommendations.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <CheckCircle className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Real-World Examples</h3>
              <p className="text-muted-foreground">
                Connect theoretical concepts to practical applications with 
                AI-generated examples that make learning more engaging and memorable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already using SmartNotes AI to 
            improve their academic performance and study more effectively.
          </p>
          <Button size="lg" onClick={() => router.push('/auth')} className="text-lg px-8">
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 SmartNotes AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
