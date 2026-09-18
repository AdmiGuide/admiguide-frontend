// Représente l'utilisateur connecté.
export interface User {
  id: number;
  nom_complet: string;
  email: string;
  pays_residence: string;
  role: 'user' | 'admin';
}