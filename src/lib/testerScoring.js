const WEIGHTS = {
  deviceQuality:          0.20,
  internetFrequency:      0.20,
  marketplaceExperience:  0.25,
  motivationQuality:      0.20,
  dailyAvailability:      0.15,
};

function scoreDevice(androidVersion) {
  const v = parseFloat(androidVersion);
  if (v >= 13) return 100;
  if (v >= 11) return 85;
  if (v >= 10) return 70;
  if (v >= 9)  return 55;
  if (v >= 8)  return 40;
  return 25;
}

function scoreInternetFrequency(freq) {
  return { daily: 100, several_times_week: 75, weekly: 40, occasional: 15 }[freq] ?? 0;
}

function scoreMarketplaceExperience(exp) {
  return { two_or_more: 100, one: 60, none: 20 }[exp] ?? 0;
}

function scoreMotivation(text) {
  if (!text) return 0;
  const length = text.trim().length;
  const keywords = [
    'annonce', 'vendre', 'acheter', 'congo', 'marché', 'améliorer',
    'feedback', 'bug', 'interface', 'application', 'mobile', 'expérience',
    'test', 'plateforme', 'marketplace', 'utilisateur', 'fonctionnalité',
    'problème', 'suggestion', 'design', 'performance',
  ];
  const lower = text.toLowerCase();
  const hits = keywords.filter(k => lower.includes(k)).length;
  const lengthScore   = Math.min((length / 300) * 50, 50);
  const keywordScore  = Math.min(hits * 7, 50);
  return Math.round(Math.min(lengthScore + keywordScore, 100));
}

function scoreAvailability(hours) {
  return { '4+': 100, '3': 85, '2': 65, '1': 40 }[hours] ?? 30;
}

/**
 * Returns { score: number (0-100), breakdown: object }
 */
export function calculateTesterScore({ android_version, internet_frequency, marketplace_experience, motivation, daily_availability }) {
  const breakdown = {
    deviceQuality:         scoreDevice(android_version),
    internetFrequency:     scoreInternetFrequency(internet_frequency),
    marketplaceExperience: scoreMarketplaceExperience(marketplace_experience),
    motivationQuality:     scoreMotivation(motivation),
    dailyAvailability:     scoreAvailability(daily_availability),
  };

  const total = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + breakdown[key] * weight,
    0
  );

  return { score: Math.round(total), breakdown };
}

export function getTierFromPoints(points) {
  if (points >= 600) return { label: 'Elite',  color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200' };
  if (points >= 350) return { label: 'Gold',   color: 'text-yellow-600', bg: 'bg-yellow-50',  border: 'border-yellow-200' };
  if (points >= 150) return { label: 'Silver', color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-200'  };
  return               { label: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200' };
}
