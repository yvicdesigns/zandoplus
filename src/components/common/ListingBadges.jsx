import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, ShieldCheck, Sparkles, PackageX, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const badgeConfig = {
  approved: {
    label: 'Top Article',
    icon: <Award className="w-3 h-3 md:w-4 md:h-4" />,
    tooltip: 'Annonce boostée et vérifiée par notre équipe.',
    customClasses: 'bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-lg text-[0.6rem] px-1.5 py-0.5 md:text-xs md:px-2.5 md:py-0.5'
  },
  popular: {
    label: 'Populaire',
    icon: <Sparkles className="w-3 h-3 md:w-4 md:h-4" />,
    variant: 'popular',
    tooltip: 'Cette annonce est très consultée.',
    customClasses: 'text-[0.6rem] px-1.5 py-0.5 md:text-xs md:px-2.5 md:py-0.5'
  },
  urgent: {
    label: 'Urgent',
    icon: <Flame className="w-3 h-3 md:w-4 md:h-4" />,
    tooltip: 'Vente urgente — offre limitée.',
    customClasses: 'bg-red-500 text-white animate-pulse text-[0.6rem] px-1.5 py-0.5 md:text-xs md:px-2.5 md:py-0.5 shadow-sm shadow-red-200',
  },
  verified: {
    label: 'Vérifié',
    icon: <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" />,
    tooltip: 'Le vendeur a vérifié son identité auprès de Zando+.',
    customClasses: 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 text-[0.6rem] px-1.5 py-0.5 md:text-xs md:px-2.5 md:py-0.5'
  },
  outOfStock: {
    label: 'Épuisé',
    icon: <PackageX className="w-3 h-3 md:w-4 md:h-4" />,
    variant: 'destructive',
    tooltip: 'Cet article n\'est plus disponible.',
    customClasses: 'text-[0.6rem] px-1.5 py-0.5 md:text-xs md:px-2.5 md:py-0.5'
  },
};

const ListingBadges = ({ listing, seller, className }) => {
  if (!listing) return null;

  const badges = [];
  if (listing.quantity === 0) badges.push('outOfStock');
  if (listing.featured) badges.push('approved');
  if (listing.views_count > 100 && !listing.featured) badges.push('popular');
  if (listing.is_urgent) badges.push('urgent');
  if (listing.seller_verified || seller?.verified || listing.seller?.verified) badges.push('verified');

  if (badges.length === 0) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("flex flex-wrap items-center gap-1 md:gap-2", className)}>
        {badges.map((badgeKey) => {
          const config = badgeConfig[badgeKey];
          if (!config) return null;

          const badgeProps = config.customClasses 
            ? { className: cn("flex items-center gap-0.5 md:gap-1 cursor-default", config.customClasses) }
            : { variant: config.variant, className: "flex items-center gap-0.5 md:gap-1 text-[0.6rem] px-1.5 py-0.5 md:text-xs md:px-2.5 md:py-0.5" };

          return (
            <Tooltip key={badgeKey}>
              <TooltipTrigger asChild>
                <Badge {...badgeProps}>
                  {config.icon}
                  <span className="hidden sm:inline font-semibold">{config.label}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default ListingBadges;