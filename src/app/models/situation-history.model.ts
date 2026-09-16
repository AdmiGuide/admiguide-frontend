// Représente une situation retournée par l'endpoint d'historique Django.

export interface SituationHistory {
  public_id: string;
  titre: string;

  // Pays dans lequel la démarche doit être effectuée.
  pays_application: string | null;

  // Pays enregistré dans le profil utilisateur.
  pays_residence: string | null;

  date_creation: string;
  orientation_disponible: boolean;
}