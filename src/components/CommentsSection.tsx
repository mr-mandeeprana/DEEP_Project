import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useComments, Comment } from '@/hooks/useComments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  Edit3,
  Trash2,
  Send,
  X,
  MoreVertical,
  Heart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentsSectionProps {
  postId: string;
  initialCommentsCount: number;
}

export function CommentsSection({ postId, initialCommentsCount }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    comments,
    loading,
    count,
    addComment,
    editComment,
    deleteComment
  } = useComments(postId);

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    await addComment(newComment);
    setNewComment('');
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    await editComment(commentId, editContent);
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  if (!showComments && count === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(true)}
        className="text-muted-foreground hover:text-primary"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {initialCommentsCount} Comments
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="text-muted-foreground hover:text-primary"
      >
        <MessageCircle className={`w-4 h-4 mr-2 ${showComments ? 'fill-current' : ''}`} />
        {count} {count === 1 ? 'Comment' : 'Comments'}
        {showComments ? ' (hide)' : ' (show)'}
      </Button>

      {/* Add Comment */}
      {showComments && user && (
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs bg-gradient-hero text-white">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddComment)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {showComments && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.profiles?.avatar_url || ''} />
                  <AvatarFallback className="text-xs bg-gradient-hero text-white">
                    {comment.profiles?.display_name?.[0]?.toUpperCase() ||
                     comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  {editingCommentId === comment.id ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, () => handleEditComment(comment.id))}
                        className="min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {comment.profiles?.display_name || comment.profiles?.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.updated_at !== comment.created_at && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>

                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                      {/* Comment Actions */}
                      {user && user.id === comment.user_id && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
                            <Heart className="w-3 h-3 mr-1" />
                            Like
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-auto p-1">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditing(comment)}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No comments yet</p>
              <p className="text-xs text-muted-foreground">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}