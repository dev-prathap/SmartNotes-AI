"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { quizzesService } from '@/lib/quizzes-service';
import { subjectsService } from '@/lib/subjects-service';
import { Subject } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export default function CreateQuizPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [subjectId, setSubjectId] = useState<string>('none');
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      question: '',
      options: ['', ''],
      correctAnswer: 0,
      explanation: '',
    }
  ]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Load subjects on mount
  useState(() => {
    const loadSubjects = async () => {
      if (user) {
        try {
          const userSubjects = await subjectsService.getSubjects();
          setSubjects(userSubjects as any);
        } catch (error) {
          console.error('Error loading subjects:', error);
        }
      }
    };
    
    loadSubjects();
  });
  
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: '',
        options: ['', ''],
        correctAnswer: 0,
        explanation: '',
      }
    ]);
  };
  
  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('At least one question is required');
      return;
    }
    
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };
  
  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => 
      prev.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    );
  };
  
  const addOption = (questionIndex: number) => {
    setQuestions(prev => 
      prev.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...q.options, ''] } 
          : q
      )
    );
  };
  
  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions(prev => 
      prev.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.filter((_, j) => j !== optionIndex),
              correctAnswer: optionIndex <= q.correctAnswer 
                ? Math.max(0, q.correctAnswer - 1) 
                : q.correctAnswer
            } 
          : q
      )
    );
  };
  
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => 
      prev.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.map((opt, j) => 
                j === optionIndex ? value : opt
              ) 
            } 
          : q
      )
    );
  };
  
  const setCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, 'correctAnswer', optionIndex);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Quiz title is required');
      return;
    }
    
    if (questions.some(q => !q.question.trim() || q.options.some(opt => !opt.trim()))) {
      toast.error('All questions and options must be filled');
      return;
    }
    
    setLoading(true);
    
    try {
      const quizData = {
        title,
        description,
        difficulty,
        subjectId: subjectId !== 'none' ? subjectId : undefined,
        questions: questions.map(q => ({
          id: crypto.randomUUID(),
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      };
      
      await quizzesService.createQuiz(quizData);
      toast.success('Quiz created successfully!');
      router.push('/dashboard/quizzes');
    } catch (error) {
      console.error('Create quiz error:', error);
      toast.error('Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Quiz</h1>
            <p className="text-muted-foreground mt-1">
              Build a new quiz to test your knowledge
            </p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard/quizzes')}
            variant="outline"
          >
            Back to Quizzes
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>
              Enter the basic information for your quiz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quiz-title">Title *</Label>
                  <Input
                    id="quiz-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter quiz title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quiz-description">Description</Label>
                  <Textarea
                    id="quiz-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter quiz description (optional)"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Difficulty</Label>
                    <Select 
                      value={difficulty} 
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Subject (Optional)</Label>
                    <Select 
                      value={subjectId} 
                      onValueChange={setSubjectId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No subject</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Questions</h2>
                  <Button 
                    type="button"
                    onClick={addQuestion}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {questions.map((question, questionIndex) => (
                    <Card key={questionIndex} className="border-border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Question {questionIndex + 1}
                          </CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(questionIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor={`question-${questionIndex}`}>Question *</Label>
                          <Textarea
                            id={`question-${questionIndex}`}
                            value={question.question}
                            onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                            placeholder="Enter your question"
                            rows={2}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Options *</Label>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant={question.correctAnswer === optionIndex ? "default" : "outline"}
                                  size="sm"
                                  className="shrink-0"
                                  onClick={() => setCorrectAnswer(questionIndex, optionIndex)}
                                >
                                  {question.correctAnswer === optionIndex ? '✓' : optionIndex + 1}
                                </Button>
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                {question.options.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => removeOption(questionIndex, optionIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button 
                            type="button"
                            onClick={() => addOption(questionIndex)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                        
                        <div>
                          <Label htmlFor={`explanation-${questionIndex}`}>Explanation (Optional)</Label>
                          <Textarea
                            id={`explanation-${questionIndex}`}
                            value={question.explanation}
                            onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                            placeholder="Explanation for the correct answer"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/quizzes')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Quiz'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
