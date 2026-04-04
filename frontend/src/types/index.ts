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
  permission: 'CRUD' | 'CRU' | 'CR' | 'C'
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

// ── Soin ──────────────────────────────────────────────────────────────────

export interface Soin {
  id: number
  patient: number
  patient_nom: string
  infirmier: number | null
  infirmier_nom: string | null
  type_soin: string
  date: string
  description: string
  notes: string
  statut: string
  statut_label: string
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

// ── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
