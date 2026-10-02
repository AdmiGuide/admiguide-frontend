export type SignalementStatus =
  | 'NOUVEAU'
  | 'EN_COURS'
  | 'TRAITE';


export interface AdminSignalement {
  id: number;
  orientation_public_id: string;
  demarche: string;
  description_situation: string;
  utilisateur_nom: string;
  utilisateur_email: string;
  type_probleme: string;
  type_probleme_label: string;
  commentaire: string;
  statut: SignalementStatus;
  statut_label: string;
  date_creation: string;
  date_mise_a_jour: string;

}

export interface AdminSignalementUpdate {
  statut?: SignalementStatus;
}
