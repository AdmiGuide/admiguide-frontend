export type SignalementType =
  | 'INFORMATION_INCORRECTE'
  | 'INFORMATION_INCOMPLETE'
  | 'INFORMATION_OBSOLETE'
  | 'AUTRE';

export interface SignalementCreatePayload {
  type_probleme: SignalementType;
  commentaire: string;
}

export interface SignalementCreateResponse {
  id: number;
  type_probleme: SignalementType;
  commentaire: string;
  statut: 'NOUVEAU';
  date_creation: string;
}
