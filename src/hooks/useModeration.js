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
