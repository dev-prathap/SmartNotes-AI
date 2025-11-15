
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings, 
  Plus,
  Home,
  Upload,
  HelpCircle,
  Trophy,
  UsersRound,
  Layers
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'My Subjects',
    href: '/dashboard/subjects',
    icon: BookOpen,
  },
  {
    name: 'Documents',
    href: '/dashboard/documents',
    icon: FileText,
  },
  {
    name: 'AI Assistant',
    href: '/dashboard/ai-chat',
    icon: Brain,
  },
  {
    name: 'Quizzes',
    href: '/dashboard/quizzes',
    icon: HelpCircle,
  },
  {
    name: 'Flashcards',
    href: '/dashboard/flashcards',
    icon: Layers,
  },
  {
    name: 'Study Groups',
    href: '/dashboard/study-groups',
    icon: UsersRound,
  },
  {
    name: 'Progress',
    href: '/dashboard/progress',
    icon: BarChart3,
  },
  {
    name: 'Achievements',
    href: '/dashboard/achievements',
    icon: Trophy,
  },
];

const quickActions = [
  {
    name: 'Upload Document',
    href: '/dashboard/documents/upload',
    icon: Upload,
  },
  {
    name: 'Ask AI Question',
    href: '/dashboard/ai-chat',
    icon: MessageSquare,
  },
  {
    name: 'Create Quiz',
    href: '/dashboard/quizzes/create',
    icon: Plus,
  },
  {
    name: 'Generate Flashcards',
    href: '/dashboard/flashcards',
    icon: Layers,
  },
  {
    name: 'Join Study Group',
    href: '/dashboard/study-groups',
    icon: UsersRound,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <Brain className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">SmartNotes AI</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main
          </h3>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-10',
                    isActive && 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Quick Actions
          </h3>
          {quickActions.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Settings */}
        <div className="space-y-1">
          <Link href="/dashboard/settings">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 h-10',
                pathname === '/dashboard/settings' && 'bg-secondary text-secondary-foreground'
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </ScrollArea>
    </div>
  );
}
