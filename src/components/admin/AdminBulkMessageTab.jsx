import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Send, Loader2 } from 'lucide-react';
import ConfirmActionDialog from './ConfirmActionDialog';

const AdminBulkMessageTab = memo(() => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirmSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Champs requis',
        description: "Veuillez renseigner le sujet et le message.",
        variant: 'destructive',
      });
      return;
    }
    setIsDialogOpen(true);
  };

  const handleSendBulkMessage = async () => {
    setIsLoading(true);
    setIsDialogOpen(false);
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-message-to-sellers', {
        body: { subject, message },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Envoi réussi !',
        description: data.message || 'Le message a été envoyé à tous les vendeurs.',
        className: 'bg-green-100 text-green-800'
      });
      setSubject('');
      setMessage('');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur s'est produite lors de l'envoi des messages.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ConfirmActionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleSendBulkMessage}
        title="Confirmer l'envoi en masse ?"
        description="Vous êtes sur le point d'envoyer ce message à tous les vendeurs de la plateforme. Cette action est irréversible."
        isLoading={isLoading}
      />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Envoyer un Message aux Vendeurs</CardTitle>
            <CardDescription>
              Ce message sera envoyé sous forme de notification à tous les utilisateurs ayant au moins une annonce active.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleConfirmSend(); }} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Sujet</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sujet de votre message"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message ici..."
                  className="min-h-[150px]"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading || !subject || !message} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Envoyer le Message en Masse
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
});

export default AdminBulkMessageTab;