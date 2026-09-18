export interface AdminSource {
  id: number;

  titre: string;
  url: string;

  type: string;
  type_label: string;

  statut: string;
  statut_label: string;

  date_consultation: string | null;
  date_mise_a_jour: string;
}