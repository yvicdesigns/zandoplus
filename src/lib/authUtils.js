export const translateSupabaseError = (error, context = 'général') => {
  const errorMessage = error?.message?.toLowerCase() || '';

  if (errorMessage.includes("invalid login credentials")) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }
  if (errorMessage.includes("user already registered")) {
    return "Cette adresse e-mail est déjà utilisée. Essayez de vous connecter.";
  }
  if (errorMessage.includes("email not confirmed")) {
    return "Veuillez confirmer votre adresse e-mail. Essayez de vous connecter pour recevoir un nouveau lien.";
  }
  if (errorMessage.includes("weak_password") || errorMessage.includes("password should contain")) {
    return "Le mot de passe est trop faible. Il doit contenir des majuscules, des minuscules, des chiffres et des symboles.";
  }
  if (errorMessage.includes("password should be different")) {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }
  if (errorMessage.includes("password must be at least 6 characters")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (errorMessage.includes("error sending confirmation mail") || errorMessage.includes("error sending recovery email")) {
    return `Impossible d'envoyer l'e-mail. Veuillez vérifier que l'adresse est correcte et réessayer. Si le problème persiste, contactez le support.`;
  }
  if (errorMessage.includes("unable to validate email address")) {
    return "L'adresse e-mail fournie n'est pas valide.";
  }
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests") || error?.status === 429) {
    return "Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.";
  }
  if (errorMessage.includes("request timeout")) {
    return "La requête a mis trop de temps à répondre. Vérifiez votre connexion internet.";
  }
  if (errorMessage.includes("token is expired") || errorMessage.includes("invalid token")) {
     return "Le lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.";
  }
  
  console.error(`Erreur Supabase non traduite (contexte: ${context}):`, error);
  return "Une erreur de communication avec le serveur est survenue. Veuillez réessayer plus tard.";
};