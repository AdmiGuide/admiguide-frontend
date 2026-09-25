// Statuts possibles après une analyse.
export type OrientationStatus =
  | 'ORIENTATION'
  | 'PRECISIONS_REQUISES'
  | 'SOURCES_INSUFFISANTES';


// Données envoyées lors de la création d'une situation.
export interface CreateSituationRequest {
  description_initiale: string;
  pays_residence?: string;
}


// Analyse retournée par Django.
export interface OrientationAnalysis {
  statut: OrientationStatus;

  demarche_code?: string | null;
  resume?: string | null;
  avertissement?: string | null;
  message?: string | null;
}


// Réponse après création d'une situation.
export interface CreateSituationResponse {
  id: number;
  public_id: string;
  description_initiale: string;
  pays_residence: string | null;
  pays_application: string | null;
  date_creation: string;
  analyse: OrientationAnalysis;
}


// Question complémentaire enregistrée dans Django.
export interface OrientationQuestion {
  id: number;
  texte: string;
  ordre: number;

  type_question:
    | 'TEXTE'
    | 'CHOIX_UNIQUE';

  options: string[];
}


// Réponse envoyée pour une question.
export interface ComplementaryAnswer {
  question_id: number;
  contenu: string;
}


// Corps envoyé à Django.
export interface SubmitAnswersRequest {
  pays_residence: string;
  reponses: ComplementaryAnswer[];
}


// Réponse de Django après enregistrement.
export interface SubmitAnswersResponse {
  detail: string;
  reponses: unknown[];
  analyse: OrientationAnalysis;
}