export const categories = {
      electronics: {
        name: 'Électronique',
        type: 'product',
        subcategories: ['Téléphones', 'Ordinateurs Portables', 'Tablettes', 'Appareils Photo', 'Audio', 'Jeux Vidéo', 'Accessoires']
      },
      vehicles: {
        name: 'Véhicules',
        type: 'product',
        subcategories: ['Voitures', 'Motos', 'Camions', 'Bus', 'Vélos', 'Pièces & Accessoires']
      },
      'real-estate': {
        name: 'Immobilier',
        type: 'product',
        subcategories: ['Appartements', 'Maisons', 'Terrains', 'Commerces', 'Locations de Vacances']
      },
      fashion: {
        name: 'Mode',
        type: 'product',
        subcategories: ['Vêtements', 'Chaussures', 'Sacs', 'Accessoires', 'Bijoux', 'Montres']
      },
      jobs: {
        name: 'Emplois',
        type: 'job',
        subcategories: ['Plein Temps', 'Temps Partiel', 'Contrat', 'Stage', 'Freelance', 'À Distance']
      },
      services: {
        name: 'Services',
        type: 'service',
        subcategories: ['Services à Domicile', 'Services Professionnels', 'Beauté & Bien-être', 'Éducation', 'Événements', 'Services de Réparation']
      },
      'agro-alimentaire': {
        name: 'Agroalimentaire',
        type: 'product',
        subcategories: ['Produits Agricoles', 'Élevage', 'Produits de Pêche', 'Boissons', 'Produits Transformés']
      },
      'traditional-medicine': {
        name: 'Médecine traditionnelle',
        type: 'product',
        subcategories: ['Herbes et plantes', 'Potions et remèdes', 'Traitements', 'Consultations']
      }
    };

    export const conditions = [
      { value: 'new', label: 'Neuf' },
      { value: 'lightly-used', label: 'Légèrement utilisé' },
      { value: 'used', label: 'Utilisé' }
    ];

    export const currencies = [
      { value: 'FCFA', label: 'FCFA (Franc CFA)' },
      { value: 'USD', label: 'USD (Dollar US)' },
      { value: 'EUR', label: 'EUR (Euro)' }
    ];

    export const contractTypes = [
      { value: 'full-time', label: 'Plein Temps' },
      { value: 'part-time', label: 'Temps Partiel' },
      { value: 'contract', label: 'Contrat' },
      { value: 'internship', label: 'Stage' },
      { value: 'freelance', label: 'Freelance' },
    ];

    export const deliveryMethods = [
      { value: 'zando_delivery', label: 'Zando Delivery', description: 'Zando s\'occupe de la livraison. L\'acheteur peut aussi choisir le retrait.' },
      { value: 'seller_delivery', label: 'J\'ai mon propre livreur', description: 'Vous gérez la livraison vous-même. Précisez vos frais. L\'acheteur peut aussi choisir Zando Delivery ou le retrait.' },
      { value: 'pickup', label: 'Retrait en boutique uniquement', description: 'Pas de livraison disponible. L\'acheteur doit venir chercher la commande.' }
    ];

    export const steps = [
      { number: 1, title: 'Infos de Base', description: 'Catégorie, description & photos' },
      { number: 2, title: 'Détails', description: 'Prix et état' },
      { number: 3, title: 'Vérification', description: 'Vérification finale' }
    ];