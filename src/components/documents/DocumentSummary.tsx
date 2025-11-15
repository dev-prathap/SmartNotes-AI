'use client';

import { useState, useEffect } from 'react';
import { FileText, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { summaryService } from '@/lib/flashcards-service';
import { DocumentSummary } from '@/types';
import { toast } from 'sonner';

interface DocumentSummaryProps {
  documentId: string;
  documentTitle: string;
}

export function DocumentSummaryComponent({ documentId, documentTitle }: DocumentSummaryProps) {
  const [summaries, setSummaries] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadSummaries();
  }, [documentId]);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const data = await summaryService.getSummaries(documentId);
      setSummaries(data);
    } catch (error) {
      console.error('Failed to load summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (type: 'short' | 'medium' | 'long' | 'key_points') => {
    try {
      setGenerating(true);
      const summary = await summaryService.generateSummary(documentId, type);
      setSummaries(prev => [...prev, summary]);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} summary generated!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const copySummary = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Summary copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy summary');
    }
  };

  const getSummaryTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      short: 'Brief Summary',
      medium: 'Standard Summary',
      long: 'Detailed Summary',
      key_points: 'Key Points'
    };
    return labels[type] || type;
  };

  const getSummaryTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      short: 'bg-blue-100 text-blue-800',
      medium: 'bg-green-100 text-green-800',
      long: 'bg-purple-100 text-purple-800',
      key_points: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const hasSummaryType = (type: string) => {
    return summaries.some(s => s.summaryType === type);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Document Summaries
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            AI-generated summaries for {documentTitle}
          </p>
        </div>
      </div>

      {/* Generate Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate New Summary</CardTitle>
          <CardDescription>Choose the type of summary you want to create</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => generateSummary('short')}
              disabled={generating || hasSummaryType('short')}
              className="flex flex-col h-auto py-4"
            >
              <Sparkles className="w-5 h-5 mb-2" />
              <span className="font-semibold">Brief</span>
              <span className="text-xs text-muted-foreground">2-3 sentences</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => generateSummary('medium')}
              disabled={generating || hasSummaryType('medium')}
              className="flex flex-col h-auto py-4"
            >
              <Sparkles className="w-5 h-5 mb-2" />
              <span className="font-semibold">Standard</span>
              <span className="text-xs text-muted-foreground">150-200 words</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => generateSummary('long')}
              disabled={generating || hasSummaryType('long')}
              className="flex flex-col h-auto py-4"
            >
              <Sparkles className="w-5 h-5 mb-2" />
              <span className="font-semibold">Detailed</span>
              <span className="text-xs text-muted-foreground">300-400 words</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => generateSummary('key_points')}
              disabled={generating || hasSummaryType('key_points')}
              className="flex flex-col h-auto py-4"
            >
              <Sparkles className="w-5 h-5 mb-2" />
              <span className="font-semibold">Key Points</span>
              <span className="text-xs text-muted-foreground">Bullet list</span>
            </Button>
          </div>
          {generating && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Generating summary... This may take a moment.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Existing Summaries */}
      {loading ? (
        <div className="text-center py-8">Loading summaries...</div>
      ) : summaries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No summaries yet</h3>
            <p className="text-muted-foreground">
              Generate a summary using the buttons above
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {summaries.map((summary) => (
            <Card key={summary.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getSummaryTypeLabel(summary.summaryType)}
                      <Badge className={getSummaryTypeColor(summary.summaryType)}>
                        {summary.wordCount} words
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Generated on {new Date(summary.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copySummary(summary.summaryText, summary.id)}
                  >
                    {copiedId === summary.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {summary.summaryType === 'key_points' ? (
                    <div className="whitespace-pre-wrap">{summary.summaryText}</div>
                  ) : (
                    <p className="text-sm leading-relaxed">{summary.summaryText}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
