import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  User,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackPageProps {
  sessionId?: string;
  mentorId?: string;
  mentorName?: string;
  mentorAvatar?: string;
  sessionDate?: Date;
  sessionTopic?: string;
  onFeedbackSubmitted?: (rating: number, feedback: string) => void;
  onCancel?: () => void;
}

export default function FeedbackPage({
  sessionId,
  mentorId,
  mentorName,
  mentorAvatar,
  sessionDate,
  sessionTopic,
  onFeedbackSubmitted,
  onCancel
}: FeedbackPageProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('Feedback Debug:', { sessionId, mentorId, mentorName, mentorAvatar, sessionDate, sessionTopic });

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a star rating for the session.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onFeedbackSubmitted?.(rating, feedback);
      toast({
        title: "Feedback Submitted!",
        description: `Thank you for your feedback on the session with ${mentorName}.`,
      });
    }, 1500);
  };

  const quickFeedbackOptions = [
    "Very helpful and insightful",
    "Great communication skills",
    "Provided practical guidance",
    "Created a safe space for discussion",
    "Would recommend to others",
    "Session was too short",
    "Could be more structured",
    "Technical issues affected the session"
  ];

  const addQuickFeedback = (option: string) => {
    if (feedback) {
      setFeedback(prev => prev + '\n\n' + option);
    } else {
      setFeedback(option);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Session Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve by sharing your experience with this mentorship session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-hero text-white">
                    {mentorAvatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{mentorName || 'Mentor'}</h3>
                  <p className="text-sm text-muted-foreground">Mentorship Session</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-4 h-4" />
                      {sessionDate ? format(sessionDate, 'PPP') : 'Date not available'}
                    </div>
                    <Badge variant="secondary">{sessionTopic || 'General Session'}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Star Rating */}
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">How would you rate this session?</h3>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="text-3xl transition-colors"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {rating === 0 ? 'Select a rating' :
                 rating === 1 ? 'Poor' :
                 rating === 2 ? 'Below Average' :
                 rating === 3 ? 'Average' :
                 rating === 4 ? 'Good' :
                 'Excellent'}
              </p>
            </div>
          </div>

          {/* Quick Feedback Options */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Feedback</h3>
            <div className="flex flex-wrap gap-2">
              {quickFeedbackOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addQuickFeedback(option)}
                  className="text-xs h-auto py-2 px-3"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          {/* Detailed Feedback */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Detailed Feedback</h3>
            <Textarea
              placeholder="Share your detailed experience, what you learned, suggestions for improvement, or anything else you'd like to mention..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Your feedback helps mentors improve and helps other learners make informed decisions.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmitFeedback}
              disabled={isSubmitting || rating === 0}
              className="flex-1 bg-gradient-hero hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Skip for Now
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Your feedback is anonymous and will only be shared with the mentor to help them improve.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Reviews Display Component
interface ReviewsListProps {
  mentorId: string;
  reviews: any[];
}

export function ReviewsList({ mentorId, reviews }: ReviewsListProps) {
  const filteredReviews = reviews.filter(review => review.mentorId === mentorId);

  if (filteredReviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
          <p className="text-muted-foreground">
            Be the first to leave a review after a session with this mentor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredReviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {review.learnerName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{review.learnerName || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(review.date, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-sm font-medium ml-1">{review.rating}</span>
              </div>
            </div>

            {review.feedback && (
              <p className="text-muted-foreground mb-3">"{review.feedback}"</p>
            )}

            {review.sessionTopic && (
              <Badge variant="outline" className="text-xs">
                {review.sessionTopic}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}