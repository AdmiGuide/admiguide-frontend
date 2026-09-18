// Représente un compte affiché dans l'espace administrateur.
export interface AdminUser {
  id: number;
  nom_complet: string;
  email: string;
  pays_residence: string;
  role: 'user' | 'admin';
  is_active: boolean;
}