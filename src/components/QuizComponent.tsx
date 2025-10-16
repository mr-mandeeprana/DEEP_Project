import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Trophy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Lightbulb
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correct_answer: string | number;
  explanation?: string;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts: number;
  shuffle_questions: boolean;
  show_answers: boolean;
}

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number, totalQuestions: number, passed: boolean) => void;
  onClose: () => void;
}

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number, totalQuestions: number, passed: boolean) => void;
  onClose: () => void;
}

export function QuizComponent({ quiz, onComplete, onClose }: QuizComponentProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Timer effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !quizCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, quizCompleted]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowHint(false);
    }
  };

  const handleSubmitQuiz = () => {
    setQuizCompleted(true);

    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passing_score;

    setShowResults(true);

    toast({
      title: passed ? "Quiz Completed! 🎉" : "Quiz Completed",
      description: `You scored ${score}% (${correctAnswers}/${quiz.questions.length} correct)`,
      variant: passed ? "default" : "destructive",
    });
  };

  const handleFinishQuiz = () => {
    const correctAnswers = quiz.questions.reduce((count, question) => {
      return count + (answers[question.id] === question.correct_answer ? 1 : 0);
    }, 0);

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passing_score;

    onComplete(score, quiz.questions.length, passed);
    onClose();
  };

  const getAnswerStatus = (questionId: string, answerIndex: number) => {
    if (!showResults) return 'default';

    const correctAnswer = quiz.questions.find(q => q.id === questionId)?.correct_answer;
    const userAnswer = answers[questionId];

    if (answerIndex === correctAnswer) return 'correct';
    if (answerIndex === userAnswer && userAnswer !== correctAnswer) return 'incorrect';
    return 'default';
  };

  if (showResults) {
    const correctAnswers = quiz.questions.reduce((count, question) => {
      return count + (answers[question.id] === question.correct_answer ? 1 : 0);
    }, 0);

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passing_score;

    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className={`w-6 h-6 ${passed ? 'text-yellow-500' : 'text-gray-500'}`} />
            Assessment Results
          </DialogTitle>
          <DialogDescription>
            {passed
              ? "Congratulations! You passed the quiz."
              : "Keep studying and try again to improve your score."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Overview */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold mb-2">{score}%</div>
              <p className="text-muted-foreground">
                {correctAnswers} out of {quiz.questions.length} correct
              </p>
              <Badge variant={passed ? "default" : "destructive"} className="mt-3">
                {passed ? "Passed" : "Failed"}
              </Badge>
            </CardContent>
          </Card>

          {/* Question Review */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold">Question Review</h3>
            {quiz.questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correct_answer;

              return (
                <Card key={question.id} className={`p-4 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">Question {index + 1}: {question.question}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your answer: {question.options[userAnswer] || 'Not answered'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-700 mb-2">
                          Correct answer: {question.options[question.correct_answer]}
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-sm bg-white p-2 rounded border">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleFinishQuiz} className="flex-1">
              Complete Quiz
            </Button>
            <Button variant="outline" onClick={() => setShowResults(false)}>
              Review Again
            </Button>
          </div>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>{quiz.title}</span>
          {timeRemaining !== null && (
            <Badge variant={timeRemaining < 300 ? "destructive" : "secondary"}>
              {formatTime(timeRemaining)}
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription>{quiz.description}</DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion.question}
            </CardTitle>
            {/* Remove category badge for now as it's not in the database schema */}
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id]?.toString() || ""}
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    showResults
                      ? getAnswerStatus(currentQuestion.id, index) === 'correct'
                        ? 'border-green-500 bg-green-50'
                        : getAnswerStatus(currentQuestion.id, index) === 'incorrect'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200'
                      : 'border-gray-200 hover:bg-accent'
                  }`}
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    disabled={quizCompleted}
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer text-base"
                  >
                    {option}
                  </Label>
                  {showResults && index === currentQuestion.correct_answer && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {showResults && index === answers[currentQuestion.id] && index !== currentQuestion.correct_answer && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              ))}
            </RadioGroup>

            {/* Hint - temporarily disabled as not in database schema */}
            {/* TODO: Add hint support when database schema includes hints */}

            {/* Explanation (shown after answering) */}
            {showResults && currentQuestion.explanation && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(answers).length < quiz.questions.length}
                className="bg-gradient-hero hover:opacity-90"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] && answers[currentQuestion.id] !== 0}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-3">Jump to question:</p>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestionIndex === index ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentQuestionIndex(index);
                  setShowHint(false);
                }}
                className={`w-10 h-10 ${
                  answers[quiz.questions[index].id] !== undefined
                    ? 'bg-green-100 border-green-300'
                    : ''
                }`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}