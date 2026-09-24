import { supabase } from '@/lib/customSupabaseClient';

export async function moderateListing(listing) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-moderation', {
      body: {
        listing_id:  listing.id,
        title:       listing.title,
        description: listing.description,
        category:    listing.category,
        price:       listing.price,
        currency:    listing.currency,
        condition:   listing.condition,
        location:    listing.location,
        images:      listing.images,
      },
    });

    if (error || !data?.success) return { approved: true, risk_level: 'low', flags: [] };

    // If high risk, update listing status to pending_review
    if (!data.approved && listing.id) {
      await supabase
        .from('listings')
        .update({
          status: 'pending_review',
          moderation_flags: data.flags,
          moderation_reason: data.reason,
        })
        .eq('id', listing.id);

      // Prévenir le vendeur directement — sinon il ne le sait que s'il
      // recroise le toast au moment exact de la publication, ou en allant
      // consulter son profil de lui-même.
      if (listing.user_id) {
        const message = data.price_mismatch
          ? `Votre annonce "${listing.title}" est masquée le temps de confirmer le prix : ${data.reason || "le prix semble très éloigné de ce que montre la photo."} Modifiez le prix (ou confirmez-le via le support) pour la republier.`
          : `Votre annonce "${listing.title}" a été mise en vérification manuelle et n'est pas encore visible publiquement. Elle sera traitée sous 24h.`;
        await supabase.from('notifications').insert({
          user_id: listing.user_id,
          type: 'listing_pending_review',
          content: { message },
          link: `/listing/${listing.id}`,
        });
      }
    } else if (data.risk_level === 'medium' && listing.id) {
      // Medium risk: keep active but store flags for admin review
      await supabase
        .from('listings')
        .update({
          moderation_flags: data.flags,
          moderation_reason: data.reason,
        })
        .eq('id', listing.id);
    }

    return data;
  } catch {
    // Fail open — moderation error must never block a legitimate listing
    return { approved: true, risk_level: 'low', flags: [] };
  }
}
