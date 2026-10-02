// Représente un compte affiché dans l'espace administrateur.
export interface AdminUser {
  id: number;
  nom_complet: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
}