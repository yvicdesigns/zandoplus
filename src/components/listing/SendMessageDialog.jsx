import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SendMessageDialog = ({ isOpen, onOpenChange, listing }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSend = async () => {
        if (!message.trim()) {
            toast({ title: "Message vide", description: "Veuillez écrire un message.", variant: 'destructive' });
            return;
        }

        setIsSending(true);
        try {
            const { data, error } = await supabase.rpc('create_conversation_and_message', {
                p_listing_id: listing.id,
                p_content: message,
            });

            if (error) throw error;
            
            toast({
                title: "Message envoyé !",
                description: "Votre message a été envoyé au vendeur.",
                className: "bg-custom-green-500 text-white",
            });
            onOpenChange(false);
            setMessage('');
            // Redirect to the newly created/updated conversation
            if(data.conversation_id) {
                navigate(`/messages/${data.conversation_id}`);
            } else {
                navigate('/messages');
            }

        } catch (error) {
            console.error("Error sending message:", error);
            toast({ title: "Erreur", description: error.message || "Impossible d'envoyer le message.", variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    if (!listing) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Envoyer un message au vendeur</DialogTitle>
                    <DialogDescription>
                        À propos de l'annonce : <span className="font-semibold">{listing.title}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="message-text">Votre message</Label>
                    <Textarea
                        id="message-text"
                        placeholder={`Bonjour, je suis intéressé par votre annonce "${listing.title}"...`}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSending}>
                        Annuler
                    </Button>
                    <Button onClick={handleSend} className="gradient-bg hover:opacity-90" disabled={isSending}>
                        {isSending ? 'Envoi en cours...' : 'Envoyer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendMessageDialog;