// Représente l'utilisateur connecté.
export interface User {
  id: number;
  nom_complet: string;
  email: string;
  role: 'user' | 'admin';
}