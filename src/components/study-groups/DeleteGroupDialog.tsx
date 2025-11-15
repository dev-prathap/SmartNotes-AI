'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudyGroup } from '@/types';

interface DeleteGroupDialogProps {
  group: StudyGroup;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteGroupDialog({ group, onClose, onConfirm }: DeleteGroupDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Study Group</CardTitle>
          <CardDescription>
            This action cannot be undone. This will permanently delete the group and all its data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold">{group.name}</p>
            <p className="text-sm text-muted-foreground">
              {group.memberCount || 0} members • Created {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">⚠️ Warning</p>
            <p className="text-sm text-muted-foreground mt-1">
              All group messages, shared documents, and member data will be permanently deleted.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Group'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
