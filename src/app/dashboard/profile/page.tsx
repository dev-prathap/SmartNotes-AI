"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { subjectsService } from '@/lib/subjects-service';
import { documentsService } from '@/lib/documents-service';
import { quizzesService } from '@/lib/quizzes-service';
import { Subject, Document } from '@/types';
import { User, Mail, Calendar, Award, BookOpen, FileText, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    bio: '',
    avatar: '',
  });
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        router.push('/auth');
        return;
      }
      
      try {
        // Load user data
        const [userSubjects, userDocuments, userQuizzes] = await Promise.all([
          subjectsService.getSubjects(),
          documentsService.getDocuments(),
          quizzesService.getQuizzes(),
        ]);
        
        setProfile({
          name: user.name || '',
          email: user.email || '',
          
          avatar: user.avatar || '',
        });
        
        setSubjects(userSubjects as any);
        setDocuments(userDocuments as any);
        setQuizzes(userQuizzes);
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, router]);
  
  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real implementation, this would save to the backend
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Your email"
                      disabled
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setProfile({
                      name: user?.name || '',
                      email: user?.email || '',
           
                      avatar: user?.avatar || '',
                    })}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Account Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Statistics
                </CardTitle>
                <CardDescription>
                  Overview of your learning activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">{subjects.length}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Subjects</p>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">{documents.length}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Documents</p>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Brain className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">{quizzes.length}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Quizzes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Upload a new profile image
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mx-auto mb-4">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full">
                  Change Picture
                </Button>
              </CardContent>
            </Card>
            
            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Manage your account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/dashboard/settings')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
