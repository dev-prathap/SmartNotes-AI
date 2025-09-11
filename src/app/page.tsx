
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
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6 animate-pulse">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Learning</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Study Smarter, Not Harder
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your learning experience with intelligent document processing, 
            AI-generated quizzes, and collaborative study features designed for modern students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => router.push('/auth')} className="text-lg px-8 py-6 hover:scale-105 transition-transform">
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:scale-105 transition-transform">
              Watch Demo
            </Button>
          </div>
          
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-lg blur-xl opacity-75 animate-pulse"></div>
            <div className="relative bg-card border rounded-lg p-4 hover:shadow-xl transition-shadow">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">AI</p>
                  <p className="text-xs text-muted-foreground mt-1">Smart Processing</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">98%</p>
                  <p className="text-xs text-muted-foreground mt-1">Accuracy</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">24/7</p>
                  <p className="text-xs text-muted-foreground mt-1">Availability</p>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-sm">Learning Analytics</h4>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Concept Mastery</span>
                    <span>87%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-4/5"></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Knowledge Gaps</span>
                    <span>13%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full w-1/5"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>AI-Powered Insights</span>
                <span>Real-time Processing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful AI features designed to enhance your learning and boost academic performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <BookOpen className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Smart Document Processing</h3>
              <p className="text-muted-foreground">
                Upload PDFs, notes, and study materials. Our AI automatically extracts, 
                indexes, and structures your content for easy searching and learning.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Intelligent Q&A System</h3>
              <p className="text-muted-foreground">
                Ask questions about your materials and get contextual answers with 
                real-world examples and follow-up questions to deepen understanding.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Automated Quiz Generation</h3>
              <p className="text-muted-foreground">
                Generate custom quizzes from your study materials with adjustable 
                difficulty levels and detailed explanations for each answer.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Collaborative Learning</h3>
              <p className="text-muted-foreground">
                Share notes, create study groups, and collaborate with classmates 
                in real-time study sessions with synchronized content.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <Star className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your learning progress with detailed analytics, achievement 
                badges, and personalized study recommendations.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
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
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of students who are already using SmartNotes AI to 
            improve their academic performance and study more effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={() => router.push('/auth')}>
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Schedule a Demo
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-75">No credit card required • Free forever for students</p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Students</h2>
            <p className="text-xl text-muted-foreground">See what learners are saying about SmartNotes AI</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-1 mb-4">
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">
                "SmartNotes AI helped me prepare for my finals in half the time. The adaptive quizzes identified exactly what I needed to study."
              </p>
              <div className="flex items-center">
                <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center mr-3">
                  <span className="font-semibold">JD</span>
                </div>
                <div>
                  <p className="font-semibold">John Davis</p>
                  <p className="text-sm text-muted-foreground">Computer Science Major</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-1 mb-4">
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">
                "The collaborative features made group study sessions so much more productive. We could all access the same materials and quiz each other in real-time."
              </p>
              <div className="flex items-center">
                <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center mr-3">
                  <span className="font-semibold">SR</span>
                </div>
                <div>
                  <p className="font-semibold">Sarah Rodriguez</p>
                  <p className="text-sm text-muted-foreground">Biology Student</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-1 mb-4">
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
                <Star className="h-5 w-5 fill-primary text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">
                "I went from struggling with chemistry concepts to acing my exams. The real-world examples make everything click!"
              </p>
              <div className="flex items-center">
                <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center mr-3">
                  <span className="font-semibold">MP</span>
                </div>
                <div>
                  <p className="font-semibold">Michael Park</p>
                  <p className="text-sm text-muted-foreground">Chemistry Major</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Dashboard Preview */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience the Intelligent Dashboard</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our advanced AI-powered interface transforms how college students study and learn
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="bg-card border rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">AI-Powered Study Insights</h3>
                <p className="text-muted-foreground">
                  SmartNotes AI analyzes your documents and provides intelligent insights to accelerate learning
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg mt-1">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Knowledge Mapping</h4>
                    <p className="text-sm text-muted-foreground">
                      Visualize connections between concepts across all your study materials
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg mt-1">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Smart Recommendations</h4>
                    <p className="text-sm text-muted-foreground">
                      Get personalized study suggestions based on your progress and knowledge gaps
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg mt-1">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Interactive Content</h4>
                    <p className="text-sm text-muted-foreground">
                      Transform static notes into dynamic, explorable learning materials
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-lg blur-xl opacity-75"></div>
              <div className="relative bg-card border rounded-lg p-4 min-h-[400px]">
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Biology Study Guide</h4>
                    <div className="flex gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-primary/10 p-3 rounded text-center">
                      <p className="text-2xl font-bold">87%</p>
                      <p className="text-xs text-muted-foreground">Concept Mastery</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded text-center">
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-xs text-muted-foreground">Active Quizzes</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded text-center">
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-xs text-muted-foreground">Study Groups</p>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-4/5"></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Cell Biology progress</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Recent Activity</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                        <p className="text-sm">Quiz completed - 92%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm">Document processed</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm">Study session joined</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">AI Suggestions</h4>
                    <div className="space-y-2">
                      <p className="text-sm">Review Cell Division concepts</p>
                      <p className="text-sm">Take Photosynthesis quiz</p>
                      <p className="text-sm">Join study group for Genetics</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">Smart dashboard with AI-powered learning insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced AI Capabilities</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by cutting-edge artificial intelligence to transform your study materials
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Natural Language Processing</h3>
              <p className="text-muted-foreground">
                Advanced NLP algorithms understand context, extract key concepts, and identify learning objectives from your documents.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Adaptive Learning</h3>
              <p className="text-muted-foreground">
                AI models adjust to your learning pace and style, providing personalized quizzes and study recommendations.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Knowledge Graph</h3>
              <p className="text-muted-foreground">
                Visualize connections between concepts across subjects with our intelligent knowledge mapping system.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Collaborative Intelligence</h3>
              <p className="text-muted-foreground">
                Shared insights and collective learning enhance individual understanding through group study dynamics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built with Modern Technology</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Leveraging the latest tools and frameworks for an exceptional learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Frontend Excellence</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Next.js 15 with App Router</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>TypeScript for type safety</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Tailwind CSS v4</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>shadcn/ui components</span>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">AI & Backend Power</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>GPT-4 Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Supabase PostgreSQL</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Row Level Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Real-time Collaboration</span>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Security & Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>JWT Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>End-to-end Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Cloud Infrastructure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>99.9% Uptime Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">Everything you need to know about SmartNotes AI</p>
          </div>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">How does the AI-powered quiz generation work?</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your uploaded documents and automatically generates quizzes tailored to your content. 
                You can adjust difficulty levels and focus areas to match your study needs.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Is my data secure with SmartNotes AI?</h3>
              <p className="text-muted-foreground">
                Absolutely. We use industry-standard encryption and never share your data with third parties. 
                Your documents and study materials are private and secure.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Can I collaborate with classmates?</h3>
              <p className="text-muted-foreground">
                Yes! Create study groups, share documents, and quiz each other in real-time. 
                Our collaborative features make group studying more effective and engaging.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">What types of documents can I upload?</h3>
              <p className="text-muted-foreground">
                We support PDFs, text files, and images. Our AI can process academic papers, 
                lecture notes, textbooks, and handwritten notes to create interactive study materials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Learning Journey Today</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of students who are already using SmartNotes AI to 
            improve their academic performance and study more effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={() => router.push('/auth')}>
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Schedule a Demo
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-75">No credit card required • Free forever for students</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-background">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">SmartNotes AI</span>
              </div>
              <p className="text-muted-foreground text-sm">
                An intelligent study companion for college students.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Academic Features</h4>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>AI-Powered Quiz Generation</li>
                <li>Document Intelligence Processing</li>
                <li>Collaborative Study Tools</li>
                <li>Learning Analytics</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Project Information</h4>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>Developed by Kaviya & Madhanika Kaviya R</li>
                <li>College Final Year Project</li>
                <li>AI & Machine Learning Application</li>
                <li>2025 Academic Year</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 border-t border-border text-center text-muted-foreground text-sm">
            <p>&copy; 2025 SmartNotes AI. Academic Project Submission.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
