export type SignalementStatus =
  | 'NOUVEAU'
  | 'EN_COURS'
  | 'TRAITE';

export type SignalementResult =
  | 'RESOLU'
  | 'NON_RESOLU'
  | 'REJETE';

export interface SignalementTraitement {
  id: number;
  administrateur_nom: string;
  commentaire_administrateur: string;
  resultat: SignalementResult;
  resultat_label: string;
  suite_a_donner: string;
  date_traitement: string;
}

export interface AdminSignalement {
  id: number;
  orientation_public_id: string;
  demarche: string;
  description_situation: string;
  utilisateur_nom: string;
  utilisateur_email: string | null;
  type_probleme: string;
  type_probleme_label: string;
  commentaire: string;
  statut: SignalementStatus;
  statut_label: string;
  date_creation: string;
  date_mise_a_jour: string;
  traitement: SignalementTraitement | null;
}

export interface AdminSignalementUpdate {
  statut?: SignalementStatus;
  commentaire_administrateur?: string;
  resultat?: SignalementResult;
  suite_a_donner?: string;
}
