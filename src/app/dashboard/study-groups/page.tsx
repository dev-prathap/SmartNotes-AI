'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Lock, Globe, Search, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studyGroupsService } from '@/lib/study-groups-service';
import { StudyGroup } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { DeleteGroupDialog } from '@/components/study-groups/DeleteGroupDialog';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function StudyGroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'my' | 'public'>('my');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<StudyGroup | null>(null);

  useEffect(() => {
    loadGroups();
  }, [viewType]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await studyGroupsService.getGroups(viewType);
      setGroups(data);
    } catch (error) {
      toast.error('Failed to load study groups');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteGroup = (group: StudyGroup, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setGroupToDelete(group);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      await studyGroupsService.deleteGroup(groupToDelete.id);
      toast.success(`Group "${groupToDelete.name}" deleted successfully!`);
      setShowDeleteDialog(false);
      setGroupToDelete(null);
      loadGroups(); // Refresh the list
    } catch (error: any) {
      console.error('Delete group error:', error);
      toast.error(error.message || 'Failed to delete group');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground">Collaborate and learn together</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
            <Users className="w-4 h-4 mr-2" />
            Join Group
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={viewType === 'my' ? 'default' : 'outline'}
          onClick={() => setViewType('my')}
        >
          My Groups
        </Button>
        <Button
          variant={viewType === 'public' ? 'default' : 'outline'}
          onClick={() => setViewType('public')}
        >
          Public Groups
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No study groups found</h3>
            <p className="text-muted-foreground mb-4">
              {viewType === 'my' 
                ? 'Create or join a study group to get started'
                : 'No public groups available at the moment'}
            </p>
            {viewType === 'my' && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <Card
              key={group.id}
              className="hover:shadow-lg transition-shadow cursor-pointer relative"
              onClick={() => router.push(`/dashboard/study-groups/${group.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {group.name}
                      {group.isPrivate ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {group.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  
                  {/* Delete button - show for all groups in development */}
                  {(user?.id === group.createdBy || process.env.NODE_ENV === 'development') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteGroup(group, e)}
                      title={user?.id === group.createdBy ? 'Delete group' : 'Debug: Delete button (you are not the creator)'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  
                  
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{group.memberCount || 0} members</span>
                    </div>
                    <Badge variant={group.isPrivate ? "secondary" : "default"}>
                      {group.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                  </div>
                  
                  {group.createdBy && (
                    <div className="text-xs text-muted-foreground">
                      Created by {group.creator_name || 'Unknown'}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </div>
                  
                  {group.isPrivate && viewType === 'my' && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Invite Code: <span className="font-mono bg-muted px-1 rounded">{group.inviteCode}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateGroupDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadGroups();
          }}
        />
      )}
      
      {showJoinDialog && (
        <JoinGroupDialog
          onClose={() => setShowJoinDialog(false)}
          onSuccess={() => {
            setShowJoinDialog(false);
            loadGroups();
          }}
        />
      )}
      
      {showDeleteDialog && groupToDelete && (
        <DeleteGroupDialog
          group={groupToDelete}
          onClose={() => {
            setShowDeleteDialog(false);
            setGroupToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
      </div>
    </DashboardLayout>
  );
}

// Create Group Dialog Component
function CreateGroupDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load subjects when dialog opens
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch('/api/subjects', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSubjects(data.subjects || []);
        }
      } catch (error) {
        console.error('Failed to load subjects:', error);
      }
    };
    loadSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      setLoading(true);
      
      const groupData = {
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
        subjectId: selectedSubject || undefined
      };
      
      console.log('Creating group with data:', groupData);
      console.log('isPrivate value:', isPrivate, typeof isPrivate);
      
      const result = await studyGroupsService.createGroup(groupData);
      console.log('Group created result:', result);
      toast.success('Study group created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Create group error:', error);
      toast.error(error.message || 'Failed to create study group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Study Group</CardTitle>
          <CardDescription>Start a new collaborative learning space</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Group Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Computer Science Batch 2025"
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will your group study? (Optional)"
                className="w-full min-h-[80px] px-3 py-2 border rounded-md resize-none"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {description.length}/500 characters
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Subject (Optional)</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-muted-foreground mt-1">
                Choose a subject to help organize your study group
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="isPrivate" className="text-sm font-medium cursor-pointer">
                    Make this group private
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Private groups require an invite code to join. You'll get a unique code to share.
                  </p>
                </div>
              </div>
              {/* Debug info */}
              <div className={`text-xs p-2 rounded font-medium ${isPrivate ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                Current setting: {isPrivate ? '🔒 Private Group' : '🌍 Public Group'}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Join Group Dialog Component
function JoinGroupDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Invite code is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/study-groups/join-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() })
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Failed to join group';
        
        if (response.status === 404) {
          errorMessage = 'Invalid invite code. Please check and try again.';
        } else if (response.status === 400) {
          errorMessage = data.error || 'Unable to join group';
        } else if (response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else {
          errorMessage = data.error || 'Failed to join group';
        }
        
        toast.error(errorMessage);
        return; // Don't throw, just return
      }

      toast.success(`Successfully joined "${data.group.name}"!`);
      onSuccess();
    } catch (error: any) {
      console.error('Join group error:', error);
      
      // Handle network errors gracefully
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Study Group</CardTitle>
          <CardDescription>Enter the invite code to join a private group</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Invite Code *</label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC12345"
                required
                maxLength={20}
                className="font-mono"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Ask the group admin for the invite code. Or create your own group first to get an invite code.
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !inviteCode.trim()} className="flex-1">
                {loading ? 'Joining...' : 'Join Group'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
