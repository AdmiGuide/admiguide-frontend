// Représente une situation retournée par l'endpoint d'historique Django.

export interface SituationHistory {
  public_id: string;
  titre: string;
  date_creation: string;
  orientation_disponible: boolean;
}