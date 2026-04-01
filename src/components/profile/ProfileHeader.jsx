import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Edit, MapPin, Calendar, Phone, Mail, Settings, Plus, Camera, Loader2, Trash2, MoreVertical, Eye, MessageCircle, Heart, ShieldCheck, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ProfileHeader = memo(({ 
  profileData, 
  onEdit, 
  onEditAvatar, 
  onEditBanner,
  onDeleteBanner,
  isUploadingAvatar,
  isUploadingBanner,
  stats
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Safe access to profile data with fallbacks
  const hasBanner = !!profileData?.banner_url;
  const bannerStyle = hasBanner
    ? { backgroundImage: `url(${profileData.banner_url})` }
    : {};
  
  const displayName = profileData?.full_name || profileData?.email || 'Utilisateur';
  const displayAvatar = profileData?.avatar_url;
  const displayInitials = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  const statItems = [
    { label: 'Annonces Actives', value: stats?.activeListingsCount || 0, icon: Eye, color: 'from-blue-400 to-blue-600' },
    { label: 'Annonces Vendues', value: stats?.soldListingsCount || 0, icon: DollarSign, color: 'from-green-400 to-green-600' },
    { label: 'Messages', value: stats?.messagesCount || 0, icon: MessageCircle, color: 'from-purple-400 to-purple-600' },
    { label: 'Favoris', value: stats?.favoritesCount || 0, icon: Heart, color: 'from-pink-400 to-pink-600' }
  ];

  return (
    <div className="rounded-lg shadow-lg mb-8 border bg-card text-center overflow-hidden">
      {/* Banner Section - Fixed height to prevent layout shift */}
      <div 
        className="relative h-60 md:h-80 bg-cover bg-center group bg-slate-100"
        style={bannerStyle}
      >
        {!hasBanner && <div className="absolute inset-0 gradient-bg opacity-70"></div>}
        
        {/* Simplified Overlay - Removed Hover Flickering by keeping bg distinct but stable */}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>

          <div 
            className="absolute top-4 right-4 z-10"
          >
            {isUploadingBanner ? (
               <Button size="sm" variant="secondary" className="rounded-full h-10 w-10 p-0" disabled>
                <Loader2 className="w-5 h-5 animate-spin" />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" className="rounded-full h-10 w-10 p-0 shadow-md hover:bg-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                    <span className="sr-only">Options de bannière</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEditBanner}>
                    <Camera className="w-4 h-4 mr-2" /> Changer la bannière
                  </DropdownMenuItem>
                  {hasBanner && (
                    <DropdownMenuItem onClick={onDeleteBanner} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="w-4 h-4 mr-2" /> Supprimer la bannière
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
      </div>
      
      <div className="relative p-6">
        <div className="relative inline-block -mt-24 md:-mt-32">
            <div className="relative group">
                <Avatar className="w-36 h-36 md:w-48 md:h-48 border-8 border-card bg-white shadow-sm">
                  <AvatarImage src={displayAvatar} alt={displayName} className="object-cover" />
                  <AvatarFallback className="text-5xl">{displayInitials}</AvatarFallback>
                </Avatar>
                
                {/* Stable camera button overlay - Fixed z-index and opacity handling */}
                <button
                  className="absolute inset-0 rounded-full flex items-center justify-center transition-colors hover:bg-black/40 bg-transparent"
                  onClick={onEditAvatar}
                  disabled={isUploadingAvatar}
                  aria-label="Changer la photo de profil"
                >
                    {isUploadingAvatar ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin"/>
                    ) : (
                        <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                </button>
            </div>
        </div>

        <div className="mt-4">
            <div className="flex items-center justify-center space-x-2 flex-wrap gap-2">
                <h1 className="text-xl md:text-2xl font-bold">{displayName}</h1>
                {profileData?.verified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 gap-1 cursor-default">
                          <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" /> 
                          <span className="text-[0.6rem] md:text-xs">Vérifié</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ce vendeur a vérifié son identité auprès de Zando+.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
            </div>
            <div className="flex items-center justify-center mt-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Membre depuis {formatDate(profileData?.created_at)}
            </div>
        </div>

        {profileData?.bio && <p className="text-sm text-gray-700 mt-4 max-w-xl mx-auto italic leading-relaxed">"{profileData.bio}"</p>}

        <div className="mt-8 border-y py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((stat, index) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm bg-gradient-to-br ${stat.color} text-white`}>
                    <stat.icon className="w-6 h-6"/>
                  </div>
                  <p className="text-lg md:text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
            ))}
            </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" /> Modifier Profil
            </Button>
            {!profileData?.verified && (
              <Link to="/verification">
                <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Devenir Vendeur Vérifié
                </Button>
              </Link>
            )}
            <Link to="/post-ad">
                <Button className="gradient-bg hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> Publier Annonce
                </Button>
            </Link>
            <Link to="/settings">
                <Button variant="ghost">
                <Settings className="w-4 h-4 mr-2" /> Paramètres
                </Button>
            </Link>
        </div>

        <div className="mt-8 border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 text-left">
            <div className="flex items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Mail className="w-5 h-5 mr-3 text-custom-green-500 flex-shrink-0" />
                <span className="truncate">{profileData?.email || 'Email non disponible'}</span>
            </div>
            <div className="flex items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Phone className="w-5 h-5 mr-3 text-custom-green-500 flex-shrink-0" />
                {profileData?.phone ? (
                <span>{profileData.phone}</span>
                ) : (
                <Button variant="link" className="p-0 h-auto text-custom-green-600 font-normal hover:no-underline" onClick={onEdit}>
                    Ajouter un numéro
                </Button>
                )}
            </div>
            <div className="flex items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <MapPin className="w-5 h-5 mr-3 text-custom-green-500 flex-shrink-0" />
                <span className="truncate">{profileData?.location || 'Localisation non fournie'}</span>
            </div>
        </div>
      </div>
    </div>
  );
});

export default ProfileHeader;