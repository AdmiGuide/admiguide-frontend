// Démarche administrative recommandée.
export interface OrientationDemarche {
  id: number;
  intitule: string;
  description: string;
  cout_indicatif: string;
  delai_indicatif: string;
}


// Étape d'une démarche administrative.
export interface OrientationEtape {
  id: number;
  ordre: number;
  description: string;

  // Utilisé par le suivi de progression.
  terminee: boolean;
}


// Progression globale de la démarche.
export interface OrientationProgression {
  terminees: number;
  total: number;
  pourcentage: number;
}


// Pièce ou information à préparer.
export interface OrientationPiece {
  libelle: string;
  obligatoire: boolean;
}


// Service administratif compétent.
export interface OrientationServiceCompetent {
  nom: string;
  administration: string;
  adresse: string;
  contact: string;
}


// Source officielle liée à la démarche.
export interface OrientationSource {
  titre: string;
  url: string;
}


// Résultat complet retourné par Django
// pour une situation administrative.
export interface OrientationResultData {
  public_id: string;

  description_initiale: string;

  // Pays dans lequel la démarche doit être effectuée.
  pays_application: string | null;

  // Pays enregistré dans le profil de l'utilisateur.
  pays_residence: string | null;

  date_creation: string;

  orientation_disponible: boolean;

  demarche: OrientationDemarche | null;

  resume: string | null;

  avertissement: string | null;

  etapes: OrientationEtape[];

  progression: OrientationProgression;

  pieces_a_preparer: OrientationPiece[];

  services_competents: OrientationServiceCompetent[];

  sources: OrientationSource[];
}

// Données envoyées pour cocher
// ou décocher une étape.
export interface UpdateStepRequest {
  terminee: boolean;
}


// Réponse retournée après
// la mise à jour d'une étape.
export interface UpdateStepResponse {
  etape_id: number;
  terminee: boolean;
  progression: OrientationProgression;
}

