import React, { useState, useCallback } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Zando Social — commentaires d'une publication : liste + formulaire d'ajout,
// même principe que PostProductsSheet (Sheet), lecture/écriture via
// PostsContext.fetchComments / addComment (déjà en place côté base).

const CommentsSheet = ({ postId, commentsCount, children }) => {
  const { fetchComments, addComment } = usePosts();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const data = await fetchComments(postId);
    setComments(data);
    setLoading(false);
  }, [fetchComments, postId]);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (next) loadComments();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { openAuthModal(); return; }
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(postId, text);
      setComments((prev) => [...prev, newComment]);
      setText('');
    } catch (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {children ?? (
          <button type="button" className="flex items-center gap-1 hover:text-custom-green-600 transition-colors">
            {commentsCount ?? 0}
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Commentaires</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-custom-green-500" />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">Aucun commentaire pour l'instant.</p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                {comment.author?.avatar_url && (
                  <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">{comment.author?.full_name || 'Utilisateur'}</p>
                <p className="text-sm text-gray-800 break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? 'Ajouter un commentaire...' : 'Connectez-vous pour commenter'}
            className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-custom-green-400"
          />
          <Button type="submit" size="icon" className="rounded-full flex-shrink-0" disabled={!text.trim() || submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;
