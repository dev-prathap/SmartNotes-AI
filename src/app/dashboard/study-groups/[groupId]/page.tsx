'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, Users, FileText, Trophy, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { studyGroupsService } from '@/lib/study-groups-service';
import { GroupChatMessage, StudyGroupMember } from '@/types';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function StudyGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<StudyGroupMember[]>([]);
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  useEffect(() => {
    if (isMember) {
      const interval = setInterval(loadMessages, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isMember]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const data = await studyGroupsService.getGroup(groupId);
      setGroup(data.group);
      setMembers(data.members);
      setIsMember(data.isMember);
      
      if (data.isMember) {
        await loadMessages();
      }
    } catch (error) {
      toast.error('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('Loading messages for group:', groupId);
      const data = await studyGroupsService.getMessages(groupId);
      console.log('Loaded messages:', data);
      setMessages(data);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      // Show error message for debugging
      if (error.message?.includes('not a member')) {
        toast.error('You are not a member of this group');
        router.push('/dashboard/study-groups');
      } else {
        toast.error(`Failed to load messages: ${error.message}`);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const message = await studyGroupsService.sendMessage(groupId, newMessage);
      setMessages(prev => [...prev, message]);
      
      // Check if message mentions AI (@ai, @assistant, @bot)
      const aiMentions = /@(ai|assistant|bot|help)/i.test(newMessage);
      if (aiMentions) {
        // Trigger AI response
        setTimeout(async () => {
          try {
            const aiResponse = await fetch(`/api/study-groups/${groupId}/ai-assistant`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              },
              body: JSON.stringify({
                userMessage: newMessage,
                context: {
                  groupId,
                  subjectId: group?.subjectId,
                  recentMessages: messages.slice(-5) // Last 5 messages for context
                }
              })
            });
            
            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              setMessages(prev => [...prev, aiData.data]);
            }
          } catch (error) {
            console.error('AI response failed:', error);
          }
        }, 1000); // Small delay to make it feel natural
      }
      
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleJoinGroup = async () => {
    try {
      await studyGroupsService.joinGroup(groupId);
      toast.success('Successfully joined the group!');
      loadGroupData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to join group');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout>
        <div className="p-6">Group not found</div>
      </DashboardLayout>
    );
  }

  if (!isMember) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Members</span>
                <Badge>{group.member_count} members</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge>{group.is_private ? 'Private' : 'Public'}</Badge>
              </div>
              <Button onClick={handleJoinGroup} className="w-full">
                Join This Group
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/study-groups')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Groups
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground">{group.description}</p>
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="documents">Shared Documents</TabsTrigger>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Group Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.messageType === 'ai_response' ? 'bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {msg.userId === 'ai-assistant' ? (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-xs">🤖</span>
                          </div>
                        ) : msg.userAvatar ? (
                          <img 
                            src={msg.userAvatar} 
                            alt={msg.userName} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {(msg.userName || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold text-sm ${msg.userId === 'ai-assistant' ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {msg.userName || 'Unknown User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {msg.createdAt ? 
                              new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 
                              'now'
                            }
                          </span>
                        </div>
                        <div className={`text-sm ${msg.messageType === 'ai_response' ? 'whitespace-pre-line' : ''}`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
              <CardDescription>{members.length} members in this group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {member.userName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{member.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Shared Documents</CardTitle>
              <CardDescription>Documents shared with the group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>No documents shared yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitions">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Competitions</CardTitle>
              <CardDescription>Compete with group members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4" />
                <p>No competitions yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
