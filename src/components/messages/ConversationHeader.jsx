import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Video, MoreVertical, Shield, Send, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ConversationHeader = ({ conversation }) => {
  const { toast } = useToast();
  const { user, openAuthModal } = useAuth();
  const { participant, listing } = conversation;

  const isSystemConversation = listing?.id === null;
  const isAdminSentItems = isSystemConversation && participant?.full_name === "Messages Envoyés";
  const isSellerAnnouncement = isSystemConversation && participant?.full_name === "Annonces de Zando+";


  const handleCall = () => {
    if (!user) {
        openAuthModal();
        return;
    }
    if (participant.phone) {
        window.location.href = `tel:${participant.phone}`;
    } else {
        toast({
            title: "Numéro non disponible",
            description: "Cet utilisateur n'a pas fourni de numéro de téléphone.",
            variant: "destructive"
        });
    }
  };

  const handleVideoCall = () => {
    toast({
      title: "🚧 Bientôt disponible !",
      description: "Les appels vidéo arrivent bientôt sur Zando+."
    });
  };

  const handleMoreOptions = () => {
    toast({
      title: "🚧 Bientôt disponible !",
      description: "Plus d'options seront bientôt disponibles."
    });
  };

  const isOnline = participant?.last_seen && new Date() - new Date(participant.last_seen) < 300000; // 5 minutes

  if (isAdminSentItems || isSellerAnnouncement) {
    return (
      <div className="p-4 border-b bg-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 flex items-center justify-center bg-gray-100">
            {isAdminSentItems ? <Send className="w-5 h-5 text-gray-600" /> : <Megaphone className="w-5 h-5 text-purple-600" />}
          </Avatar>
          <div>
            <h3 className="font-semibold">{isAdminSentItems ? "Historique des messages envoyés" : "Annonces de Zando+"}</h3>
            <p className="text-sm text-gray-500">{isAdminSentItems ? "Vos messages envoyés aux vendeurs." : "Communications importantes de la plateforme."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b bg-white rounded-t-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to={`/seller/${participant.id}`} className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={participant.avatar_url} alt={participant.full_name} />
              <AvatarFallback>{participant.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Link to={`/seller/${participant.id}`} className="font-semibold hover:underline">{participant.full_name}</Link>
              {participant.verified && (
                <Shield className="w-4 h-4 text-green-500" title="Utilisateur vérifié" />
              )}
            </div>
            <div className="flex items-center space-x-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <p className="text-sm text-gray-500">
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={handleCall}>
            <Phone className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleVideoCall}>
            <Video className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleMoreOptions}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <img
            src={listing.images?.[0] || 'https://via.placeholder.com/100'}
            alt={listing.title}
            className="w-12 h-12 rounded object-cover"
          />
          <div className="flex-1">
            <h4 className="font-medium text-sm">{listing.title}</h4>
            <p className="text-purple-600 font-bold">
              {listing.currency || 'FCFA'} {listing.price?.toLocaleString()}
            </p>
          </div>
          <Link to={`/listings/${listing.id}`}>
            <Button size="sm" variant="outline">
              Voir l'annonce
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConversationHeader;