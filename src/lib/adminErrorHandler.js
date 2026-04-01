export const translateAdminError = (error) => {
  if (!error) return "Une erreur inconnue est survenue.";
  
  const msg = error.message || error.details || error.hint || String(error);
  
  // Database Structure Errors
  if (msg.includes("Column does not exist") || msg.includes("Could not find the '")) {
    return "Erreur de structure : Colonne ou relation manquante dans la base de données.";
  }
  
  // Relationship Errors
  if (msg.includes("Ambiguous relationship") || msg.includes("unexpected multiple relationships")) {
    return "Erreur de relation : Définissez explicitement les relations entre les tables.";
  }
  
  // Permission / Security Errors
  if (msg.includes("Permission denied") || error.code === '42501' || msg.includes("Row-level security")) {
    return "Accès refusé : Vous n'avez pas les permissions nécessaires pour cette action.";
  }
  
  // Data Errors
  if (msg.includes("No rows returned")) {
    return "Aucune donnée correspondante trouvée.";
  }
  if (msg.includes("duplicate key value")) {
    return "Conflit de données : Cet enregistrement existe déjà.";
  }
  if (msg.includes("foreign key constraint")) {
    return "Impossible de supprimer ou modifier car d'autres données en dépendent.";
  }
  
  // Network Errors
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Problème de connexion réseau. Veuillez vérifier votre connexion.";
  }
  if (msg.includes("timeout") || msg.includes("AbortError")) {
    return "La requête a pris trop de temps. Veuillez réessayer.";
  }
  
  return `Erreur système : ${msg}`;
};