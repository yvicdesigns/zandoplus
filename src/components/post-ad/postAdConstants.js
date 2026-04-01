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
      { value: 'zando_delivery', label: 'Zando Delivery', description: 'Le suivi de colis est inclus.' },
      { value: 'seller_delivery', label: 'Livraison par le vendeur', description: 'Zando ne pourra pas suivre cette livraison.' },
      { value: 'pickup', label: 'Retrait en boutique', description: 'Le client vient chercher sa commande.' }
    ];

    export const steps = [
      { number: 1, title: 'Infos de Base', description: 'Catégorie et description' },
      { number: 2, title: 'Détails', description: 'Prix et état' },
      { number: 3, title: 'Photos', description: 'Télécharger des images' },
      { number: 4, title: 'Vérification', description: 'Vérification finale' }
    ];