//Pages sur lesquelles le chatbot est disponible.
export type ChatPage = 'PRECISIONS' | 'RESULTAT' | 'SUIVI';

//Message envoyé ou reçu pendant la conversation.
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

//Données envoyées à notre API Django.
export interface ChatRequest {
  page: ChatPage;
  question: string;

  // Informations facultatives pour les précisions.
  question_id?: number;
  terme_juridique?: string;

  // Historique des échanges précédents.
  historique?: ChatMessage[];
}

//Source officielle retournée par le chatbot.
export interface ChatSource {
  titre: string;
  url: string;
}

// Réponse du chatbot.
export interface ChatResponse {
  reponse: string;
  sources: ChatSource[];
}
