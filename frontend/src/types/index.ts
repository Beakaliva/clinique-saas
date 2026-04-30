// ── Clinic ────────────────────────────────────────────────────────────────

export interface Clinic {
  id: number
  name: string
  type: string
  type_display: string
  slug: string
  telephone: string
  adresse: string
  email: string
  logo: string | null
  is_active: boolean
  created_at: string
  available_groups: [string, string][]
  available_modules: [string, string][]
  // Trial SaaS
  trial_ends_at:    string | null
  is_subscribed:    boolean
  subscribed_plan:  string
  trial_active:     boolean
  trial_days_left:  number
  has_access:       boolean
}

export const CLINIC_TYPES = [
  { value: 'generale',     label: 'Clinique générale / Polyclinique',  icon: '🏥' },
  { value: 'dentaire',     label: 'Clinique dentaire',                  icon: '🦷' },
  { value: 'pediatrique',  label: 'Clinique pédiatrique',               icon: '👶' },
  { value: 'ophtalmologie',label: 'Clinique ophtalmologique',           icon: '👁️' },
  { value: 'maternite',    label: 'Maternité',                          icon: '🤱' },
  { value: 'psychiatrie',  label: 'Clinique psychiatrique',             icon: '🧠' },
]

// ── User ──────────────────────────────────────────────────────────────────

export interface User {
  id: number
  telephone: string
  first_name: string
  last_name: string
  email: string
  full_name: string
  avatar: string | null
  clinic: Clinic
  clinic_groups: [string, string][]
  clinic_modules: [string, string][]
  group: string
  permission: 'CRUD' | 'CRU' | 'CR' | 'C' | 'R'
  modules: string[]
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

export interface RegisterResponse extends AuthTokens {
  clinic: Clinic
  user: User
}

// ── Patient ───────────────────────────────────────────────────────────────

export interface Patient {
  id: number
  first_name: string
  last_name: string
  sexe: 'M' | 'F' | 'A'
  sexe_label: string
  date_naissance: string | null
  age: number | null
  telephone: string | null
  adresse: string | null
  profession: string | null
  est_assure: boolean
  assurance: string | null
  code_assurance: string | null
  pourcentage: string | null
  created_at: string
  updated_at: string
}

// ── Rendez-vous ───────────────────────────────────────────────────────────

export interface RendezVous {
  id: number
  patient: number
  patient_nom: string
  medecin: number | null
  medecin_nom: string | null
  date_heure: string
  duree_minutes: number
  motif: string
  statut: string
  statut_label: string
  notes: string
  created_at: string
  updated_at: string
}

// ── SoinActe ─────────────────────────────────────────────────────────────

export interface SoinActe {
  id: number
  acte: string
  qte: number
  prix: string   // DecimalField → string en JSON DRF
  montant: string
}

// ── Soin ──────────────────────────────────────────────────────────────────

export interface Soin {
  id: number
  patient: number
  patient_nom: string
  facture_id: number | null
  consultation: number | null
  consultation_ref: { id: number; motif: string } | null
  infirmier: number | null
  infirmier_nom: string | null
  type_soin: string
  date: string
  description: string
  notes: string
  statut: string
  statut_label: string
  actes: SoinActe[]
  montant_total: string
  created_at: string
  updated_at: string
}

// ── Consultation ──────────────────────────────────────────────────────────

export interface Consultation {
  id: number
  patient: number
  patient_nom: string
  medecin: number | null
  medecin_nom: string | null
  date: string
  motif: string
  diagnostic: string
  notes: string
  statut: string
  statut_label: string
  created_at: string
  updated_at: string
}

// ── Ordonnance ────────────────────────────────────────────────────────────

export interface LigneOrdonnance {
  id: number
  medicament: string
  posologie: string
  duree: string
  quantite: number
  notes: string
}

export interface Ordonnance {
  id: number
  patient: number
  patient_nom: string
  medecin: number | null
  medecin_nom: string | null
  consultation: number | null
  date: string
  notes: string
  lignes: LigneOrdonnance[]
  created_at: string
  updated_at: string
}

// ── Dossier médical ───────────────────────────────────────────────────────

export interface Antecedent {
  id: number
  type: 'medical' | 'chirurgical' | 'familial' | 'autre'
  type_label: string
  description: string
  date: string | null
}

export interface DossierMedical {
  id: number
  patient: number
  patient_nom: string
  groupe_sanguin: string
  groupe_sanguin_label: string
  antecedents: string
  allergies: string
  traitements_en_cours: string
  notes: string
  liste_antecedents: Antecedent[]
  created_at: string
  updated_at: string
}

// ── Facture ───────────────────────────────────────────────────────────────

export interface LigneFacture {
  id: number
  description: string
  quantite: number
  prix_unitaire: string
  montant: string
}

export interface Paiement {
  id: number
  payeur: 'patient' | 'assurance'
  payeur_label: string
  mode: string
  mode_label: string
  montant: string
  date: string
  notes: string
}

export interface Facture {
  id: number
  soin: number | null
  patient: number
  patient_nom: string
  patient_est_assure: boolean
  patient_assurance: string | null
  patient_code_assurance: string | null
  patient_pourcentage: string | null
  numero: string
  date: string
  statut: string
  statut_label: string
  mode_paiement: string
  mode_paiement_label: string
  montant_total: string
  montant_paye: string
  montant_restant: string
  // Assurance
  est_assure: boolean
  taux_assurance: string
  assurance_nom: string
  assurance_code: string
  part_patient: string
  part_assurance: string
  montant_paye_patient: string
  montant_paye_assurance: string
  montant_restant_patient: string
  montant_restant_assurance: string
  notes: string
  lignes: LigneFacture[]
  paiements: Paiement[]
  created_at: string
  updated_at: string
}

// ── Pharmacie ─────────────────────────────────────────────────────────────

export interface Medicament {
  id: number
  nom: string
  forme: string
  forme_display: string
  dosage: string
  unite: string
  stock_actuel: number
  stock_min: number
  prix_unitaire: string
  en_rupture: boolean
  created_at: string
  updated_at: string
}

// ── Laboratoire ───────────────────────────────────────────────────────────

export interface ExamenLabo {
  id: number
  patient: number
  patient_nom: string
  type_examen: string
  date_demande: string
  date_resultat: string | null
  resultat: string
  valeurs_normales: string
  statut: string
  statut_label: string
  notes: string
  created_at: string
  updated_at: string
}

// ── Radiologie ────────────────────────────────────────────────────────────

export interface ExamenRadio {
  id: number
  patient: number
  patient_nom: string
  type_examen: string
  date: string
  compte_rendu: string
  statut: string
  statut_label: string
  notes: string
  created_at: string
  updated_at: string
}

// ── Hospitalisation ───────────────────────────────────────────────────────

export interface Hospitalisation {
  id: number
  patient: number
  patient_nom: string
  chambre: string
  motif: string
  date_entree: string
  date_sortie_prevue: string | null
  date_sortie_reelle: string | null
  statut: string
  statut_label: string
  notes: string
  duree_jours: number
  created_at: string
  updated_at: string
}

// ── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
