'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Plus, Sparkles, BookOpen, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { flashcardsService } from '@/lib/flashcards-service';
import { Flashcard, FlashcardDeck } from '@/types';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function FlashcardsPage() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'cards' | 'decks'>('cards');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardsData, decksData] = await Promise.all([
        flashcardsService.getFlashcards(),
        flashcardsService.getDecks()
      ]);
      setFlashcards(cardsData);
      setDecks(decksData);
    } catch (error) {
      toast.error('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8" />
            Flashcards
          </h1>
          <p className="text-muted-foreground">Master your subjects with active recall</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGenerateDialog(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
          <Button onClick={() => router.push('/dashboard/flashcards/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Card
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={view === 'cards' ? 'default' : 'outline'}
          onClick={() => setView('cards')}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          All Cards ({flashcards.length})
        </Button>
        <Button
          variant={view === 'decks' ? 'default' : 'outline'}
          onClick={() => setView('decks')}
        >
          <Filter className="w-4 h-4 mr-2" />
          Decks ({decks.length})
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : view === 'cards' ? (
        <FlashcardsView flashcards={flashcards} />
      ) : (
        <DecksView decks={decks} onReload={loadData} />
      )}

      {showGenerateDialog && (
        <GenerateFlashcardsDialog
          onClose={() => setShowGenerateDialog(false)}
          onSuccess={() => {
            setShowGenerateDialog(false);
            loadData();
          }}
        />
      )}
      </div>
    </DashboardLayout>
  );
}

function FlashcardsView({ flashcards }: { flashcards: Flashcard[] }) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
          <p className="text-muted-foreground">Create or generate flashcards to start studying</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {flashcards.map((card) => (
        <Card
          key={card.id}
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => toggleFlip(card.id)}
        >
          <CardContent className="p-6 min-h-[200px] flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-lg">
                {flippedCards.has(card.id) ? card.backText : card.frontText}
              </p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Badge variant={
                card.difficulty === 'easy' ? 'default' :
                card.difficulty === 'hard' ? 'destructive' : 'secondary'
              }>
                {card.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {flippedCards.has(card.id) ? 'Click to flip back' : 'Click to reveal'}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DecksView({ decks, onReload }: { decks: FlashcardDeck[]; onReload: () => void }) {
  const router = useRouter();

  if (decks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No decks yet</h3>
          <p className="text-muted-foreground">Create a deck to organize your flashcards</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck) => (
        <Card
          key={deck.id}
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push(`/dashboard/flashcards/decks/${deck.id}`)}
        >
          <CardHeader>
            <CardTitle>{deck.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {deck.description || 'No description'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {deck.cardCount || 0} cards
              </span>
              {deck.isPublic && <Badge>Public</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GenerateFlashcardsDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      toast.error('Failed to load documents');
    }
  };

  const handleGenerate = async () => {
    if (!selectedDoc) {
      toast.error('Please select a document');
      return;
    }

    try {
      setLoading(true);
      await flashcardsService.generateFlashcards(selectedDoc, count, difficulty);
      toast.success(`Generated ${count} flashcards successfully!`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate Flashcards with AI
          </CardTitle>
          <CardDescription>Create flashcards automatically from your documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Document *</label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="">Choose a document...</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Number of Cards</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 10)}
              min="5"
              max="50"
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading} className="flex-1">
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
