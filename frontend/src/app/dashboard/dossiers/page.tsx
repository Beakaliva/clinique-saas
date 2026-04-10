'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '@/lib/api'
import type { DossierMedical, Antecedent, Ordonnance, Soin, Consultation, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PatientSelect from '@/components/ui/patient-select'
import { useRouter } from 'next/navigation'
import {
  Search, FolderOpen, User, ArrowLeft, Pencil, Trash2, Plus,
  Droplets, AlertTriangle, Pill, FileText, ClipboardList, ScrollText,
  Heart, ExternalLink, ChevronRight, Stethoscope, PlusCircle, XCircle as XCircleIcon,
} from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────────────

const GROUPES_SANGUINS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const TYPES_ANTECEDENT = [
  { value: 'medical',      label: 'Médical',      color: 'bg-blue-50 text-blue-700' },
  { value: 'chirurgical',  label: 'Chirurgical',  color: 'bg-orange-50 text-orange-700' },
  { value: 'familial',     label: 'Familial',     color: 'bg-purple-50 text-purple-700' },
  { value: 'autre',        label: 'Autre',        color: 'bg-gray-100 text-gray-600' },
]

function typeStyle(type: string) {
  return TYPES_ANTECEDENT.find(t => t.value === type)?.color ?? 'bg-gray-100 text-gray-600'
}

// ── Fetchers ──────────────────────────────────────────────────────────────

function fetchDossiers(search: string) {
  return api.get<PaginatedResponse<DossierMedical>>('/dossiers/', { params: { search, page_size: 50 } }).then(r => r.data.results)
}

function fetchDossierByPatient(patientId: number) {
  return api.get<DossierMedical>(`/dossiers/patient/${patientId}/`).then(r => r.data)
}

function fetchOrdonnancesPatient(patientId: number) {
  return api.get<PaginatedResponse<Ordonnance>>('/ordonnances/', { params: { patient: patientId, page_size: 50 } }).then(r => r.data.results)
}

function fetchSoinsPatient(patientId: number) {
  return api.get<PaginatedResponse<Soin>>('/soins/', { params: { patient: patientId, page_size: 50 } }).then(r => r.data.results)
}

function fetchConsultationsPatient(patientId: number) {
  return api.get<PaginatedResponse<Consultation>>('/consultations/', { params: { patient: patientId, page_size: 50 } }).then(r => r.data.results)
}

// ── Vue dossier d'un patient ──────────────────────────────────────────────

interface ConsultFormData { date: string; motif: string; statut: string; notes: string }
interface SoinFormData { type_soin: string; date: string; statut: string; description: string }
interface OrdoFormData { date: string; notes: string; lignes: { medicament: string; posologie: string; duree: string; quantite: number }[] }

const STATUTS_CONSULT = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_cours',   label: 'En cours' },
  { value: 'terminee',   label: 'Terminée' },
  { value: 'annulee',    label: 'Annulée' },
]
const STATUTS_SOIN = [
  { value: 'planifie',  label: 'Planifié' },
  { value: 'en_cours',  label: 'En cours' },
  { value: 'effectue',  label: 'Effectué' },
  { value: 'annule',    label: 'Annulé' },
]

function DossierView({ patientId, patientNom, onBack }: { patientId: number; patientNom: string; onBack: () => void }) {
  const qc = useQueryClient()
  const router = useRouter()
  const [openAntecedent, setOpenAntecedent] = useState(false)
  const [editingAnt, setEditingAnt] = useState<Antecedent | null>(null)
  const [editingDossier, setEditingDossier] = useState(false)
  const [openConsult, setOpenConsult] = useState(false)
  const [openSoin, setOpenSoin] = useState(false)
  const [openOrdo, setOpenOrdo] = useState(false)

  const { data: dossier, isLoading } = useQuery({
    queryKey: ['dossier', patientId],
    queryFn: () => fetchDossierByPatient(patientId),
  })

  const { data: ordonnances = [] } = useQuery({
    queryKey: ['ordonnances-patient', patientId],
    queryFn: () => fetchOrdonnancesPatient(patientId),
  })

  const { data: soins = [] } = useQuery({
    queryKey: ['soins-patient', patientId],
    queryFn: () => fetchSoinsPatient(patientId),
  })

  const { data: consultations = [] } = useQuery({
    queryKey: ['consultations-patient', patientId],
    queryFn: () => fetchConsultationsPatient(patientId),
  })

  // Formulaire dossier principal
  const dossierForm = useForm<Partial<DossierMedical>>()

  const saveDossier = useMutation({
    mutationFn: (d: Partial<DossierMedical>) => api.patch<DossierMedical>(`/dossiers/${dossier!.id}/`, d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dossier', patientId] }); setEditingDossier(false) },
  })

  const openEditDossier = () => {
    if (!dossier) return
    dossierForm.setValue('groupe_sanguin', dossier.groupe_sanguin)
    dossierForm.setValue('antecedents', dossier.antecedents)
    dossierForm.setValue('allergies', dossier.allergies)
    dossierForm.setValue('traitements_en_cours', dossier.traitements_en_cours)
    dossierForm.setValue('notes', dossier.notes)
    setEditingDossier(true)
  }

  // Formulaire antécédent
  const antForm = useForm<Partial<Antecedent>>()

  const saveAnt = useMutation({
    mutationFn: (d: Partial<Antecedent>) =>
      editingAnt
        ? api.patch(`/dossiers/${dossier!.id}/antecedents/${editingAnt.id}/`, d).then(r => r.data)
        : api.post(`/dossiers/${dossier!.id}/antecedents/`, d).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dossier', patientId] })
      setOpenAntecedent(false); antForm.reset(); setEditingAnt(null)
    },
  })

  const removeAnt = useMutation({
    mutationFn: (id: number) => api.delete(`/dossiers/${dossier!.id}/antecedents/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dossier', patientId] }),
  })

  const openEditAnt = (a: Antecedent) => {
    setEditingAnt(a)
    antForm.setValue('type', a.type)
    antForm.setValue('description', a.description)
    antForm.setValue('date', a.date ?? '')
    setOpenAntecedent(true)
  }

  const openNewAnt = () => { setEditingAnt(null); antForm.reset(); setOpenAntecedent(true) }

  // ── Formulaires inline ────────────────────────────────────────────────────

  const consultForm = useForm<ConsultFormData>({ defaultValues: { statut: 'en_attente' } })
  const saveConsult = useMutation({
    mutationFn: (d: ConsultFormData) => api.post<Consultation>('/consultations/', { ...d, patient: patientId }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['consultations-patient', patientId] }); setOpenConsult(false); consultForm.reset({ statut: 'en_attente' }) },
  })

  const soinForm = useForm<SoinFormData>({ defaultValues: { statut: 'planifie' } })
  const saveSoin = useMutation({
    mutationFn: (d: SoinFormData) => api.post<Soin>('/soins/', { ...d, patient: patientId }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['soins-patient', patientId] }); setOpenSoin(false); soinForm.reset({ statut: 'planifie' }) },
  })

  const ordoForm = useForm<OrdoFormData>({ defaultValues: { lignes: [] } })
  const { fields: ordoLignes, append: appendLigne, remove: removeLigne } = useFieldArray({ control: ordoForm.control, name: 'lignes' })
  const saveOrdo = useMutation({
    mutationFn: async (d: OrdoFormData) => {
      const o = await api.post<Ordonnance>('/ordonnances/', { date: d.date, notes: d.notes, patient: patientId }).then(r => r.data)
      await Promise.all(d.lignes.map(l => api.post(`/ordonnances/${o.id}/lignes/`, l)))
      return o
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ordonnances-patient', patientId] }); setOpenOrdo(false); ordoForm.reset({ lignes: [] }) },
  })

  if (isLoading) return <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
  if (!dossier) return null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">Dossier médical</h1>
          <p className="text-sm text-gray-500">{patientNom}</p>
        </div>
        <Button variant="outline" size="sm" onClick={openEditDossier} className="flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5" /> Modifier le dossier
        </Button>
      </div>

      {/* Dialog modifier dossier */}
      <Dialog open={editingDossier} onOpenChange={setEditingDossier}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Modifier le dossier médical</DialogTitle></DialogHeader>
          <form onSubmit={dossierForm.handleSubmit(d => saveDossier.mutate(d))} className="space-y-4">
            <div>
              <Label>Groupe sanguin</Label>
              <select {...dossierForm.register('groupe_sanguin')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                {GROUPES_SANGUINS.map(g => <option key={g} value={g}>{g || '— Inconnu —'}</option>)}
              </select>
            </div>
            <div><Label>Allergies</Label><textarea {...dossierForm.register('allergies')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Pénicilline, arachides..." /></div>
            <div><Label>Antécédents (résumé libre)</Label><textarea {...dossierForm.register('antecedents')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
            <div><Label>Notes</Label><textarea {...dossierForm.register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingDossier(false)}>Annuler</Button>
              <Button type="submit" disabled={saveDossier.isPending}>{saveDossier.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ligne 1 : Groupe sanguin + Allergies + Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <Droplets className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Groupe sanguin</p>
              <p className="text-2xl font-bold text-gray-800">{dossier.groupe_sanguin || '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <p className="text-sm font-semibold text-gray-700">Allergies</p>
            </div>
            <p className="text-sm text-gray-600">{dossier.allergies || <span className="text-gray-400 italic">Aucune allergie connue</span>}</p>
          </CardContent>
        </Card>
        {dossier.notes && (
          <Card className="border-0 shadow-sm md:col-span-3">
            <CardContent className="p-4 flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600">{dossier.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ligne 2 : Consultations + Soins (côte à côte sur desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Consultations */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-indigo-500" />
              Consultations ({consultations.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={openConsult} onOpenChange={v => { setOpenConsult(v); if (!v) consultForm.reset({ statut: 'en_attente' }) }}>
                <DialogTrigger render={<Button size="sm" variant="ghost" className="flex items-center gap-1 text-indigo-600 hover:bg-indigo-50"><PlusCircle className="h-3.5 w-3.5" /> Ajouter</Button>} />
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Nouvelle consultation — {patientNom}</DialogTitle></DialogHeader>
                  <form onSubmit={consultForm.handleSubmit(d => saveConsult.mutate(d))} className="space-y-4">
                    <div><Label>Date *</Label><Input type="datetime-local" {...consultForm.register('date', { required: true })} /></div>
                    <div><Label>Motif</Label><Input {...consultForm.register('motif')} placeholder="Raison de la consultation..." /></div>
                    <div><Label>Statut</Label>
                      <select {...consultForm.register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                        {STATUTS_CONSULT.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div><Label>Notes</Label><textarea {...consultForm.register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
                    {saveConsult.isError && <p className="text-xs text-red-500">Erreur lors de l'enregistrement.</p>}
                    <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                      <Button type="button" variant="outline" onClick={() => setOpenConsult(false)}>Annuler</Button>
                      <Button type="submit" disabled={saveConsult.isPending}>{saveConsult.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" className="flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => router.push(`/dashboard/consultations?patient=${patientId}`)}>
                <ExternalLink className="h-3.5 w-3.5" /> Voir toutes
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {consultations.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-gray-400 text-sm">Aucune consultation</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {consultations.map(c => (
                  <div key={c.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      c.statut === 'terminee' ? 'bg-green-400' :
                      c.statut === 'annulee'  ? 'bg-red-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.motif || '—'}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                        {c.medecin_nom && <span className="text-xs text-gray-400">· Dr {c.medecin_nom}</span>}
                        {c.diagnostic && <span className="text-xs text-gray-500 truncate max-w-[120px]">{c.diagnostic}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      c.statut === 'terminee'  ? 'bg-green-50 text-green-700' :
                      c.statut === 'annulee'   ? 'bg-red-50 text-red-600' :
                      c.statut === 'en_cours'  ? 'bg-blue-50 text-blue-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>{c.statut_label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Soins */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              Soins ({soins.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={openSoin} onOpenChange={v => { setOpenSoin(v); if (!v) soinForm.reset({ statut: 'planifie' }) }}>
                <DialogTrigger render={<Button size="sm" variant="ghost" className="flex items-center gap-1 text-rose-600 hover:bg-rose-50"><PlusCircle className="h-3.5 w-3.5" /> Ajouter</Button>} />
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Nouveau soin — {patientNom}</DialogTitle></DialogHeader>
                  <form onSubmit={soinForm.handleSubmit(d => saveSoin.mutate(d))} className="space-y-4">
                    <div><Label>Type de soin *</Label><Input {...soinForm.register('type_soin', { required: true })} placeholder="Détartrage, Perfusion..." /></div>
                    <div><Label>Date *</Label><Input type="date" {...soinForm.register('date', { required: true })} /></div>
                    <div><Label>Description</Label><textarea {...soinForm.register('description')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
                    <div><Label>Statut</Label>
                      <select {...soinForm.register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                        {STATUTS_SOIN.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    {saveSoin.isError && <p className="text-xs text-red-500">Erreur lors de l'enregistrement.</p>}
                    <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                      <Button type="button" variant="outline" onClick={() => setOpenSoin(false)}>Annuler</Button>
                      <Button type="submit" disabled={saveSoin.isPending}>{saveSoin.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" className="flex items-center gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => router.push(`/dashboard/soins?patient=${patientId}`)}>
                <ExternalLink className="h-3.5 w-3.5" /> Voir tous
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {soins.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-gray-400 text-sm">Aucun soin</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {soins.map(s => (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{s.type_soin || 'Soin'}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{new Date(s.date).toLocaleDateString('fr-FR')}</span>
                        {s.actes.length > 0 && <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">{s.actes.length} acte{s.actes.length > 1 ? 's' : ''}</span>}
                        {Number(s.montant_total) > 0 && <span className="text-xs text-gray-500">{Number(s.montant_total).toLocaleString('fr-FR')} GNF</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.statut === 'effectue' ? 'bg-green-50 text-green-700' :
                        s.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700' :
                        s.statut === 'annule'   ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-700'
                      }`}>{s.statut_label}</span>
                      {s.facture_id && (
                        <button onClick={() => router.push(`/dashboard/factures?open=${s.facture_id}`)}
                          className="text-xs text-green-600 hover:text-green-800 flex items-center gap-0.5">
                          Facture <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ordonnances */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-blue-500" />
            Ordonnances ({ordonnances.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={openOrdo} onOpenChange={v => { setOpenOrdo(v); if (!v) ordoForm.reset({ lignes: [] }) }}>
              <DialogTrigger render={<Button size="sm" variant="ghost" className="flex items-center gap-1 text-blue-600 hover:bg-blue-50"><PlusCircle className="h-3.5 w-3.5" /> Ajouter</Button>} />
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Nouvelle ordonnance — {patientNom}</DialogTitle></DialogHeader>
                <form onSubmit={ordoForm.handleSubmit(d => saveOrdo.mutate(d))}>
                  <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                    <div><Label>Date *</Label><Input type="date" {...ordoForm.register('date', { required: true })} /></div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Médicaments</Label>
                        <button type="button" onClick={() => appendLigne({ medicament: '', posologie: '', duree: '', quantite: 1 })}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                          <PlusCircle className="h-3.5 w-3.5" /> Ajouter
                        </button>
                      </div>
                      {ordoLignes.length === 0
                        ? <p className="text-xs text-gray-400 text-center py-2">Aucun médicament</p>
                        : <div className="space-y-3">
                            {ordoLignes.map((f, i) => (
                              <div key={f.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-500">Médicament {i + 1}</span>
                                  <button type="button" onClick={() => removeLigne(i)} className="text-red-400 hover:text-red-600"><XCircleIcon className="h-4 w-4" /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div><Label className="text-xs">Médicament *</Label><Input {...ordoForm.register(`lignes.${i}.medicament`, { required: true })} placeholder="Paracétamol 500mg" className="h-7 text-xs" /></div>
                                  <div><Label className="text-xs">Quantité</Label><Input type="number" min={1} {...ordoForm.register(`lignes.${i}.quantite`, { valueAsNumber: true })} className="h-7 text-xs" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div><Label className="text-xs">Posologie *</Label><Input {...ordoForm.register(`lignes.${i}.posologie`, { required: true })} placeholder="2 cp/jour" className="h-7 text-xs" /></div>
                                  <div><Label className="text-xs">Durée</Label><Input {...ordoForm.register(`lignes.${i}.duree`)} placeholder="7 jours" className="h-7 text-xs" /></div>
                                </div>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                    <div><Label>Instructions générales</Label><textarea {...ordoForm.register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
                  </div>
                  {saveOrdo.isError && <p className="text-xs text-red-500 mt-2">Erreur lors de l'enregistrement.</p>}
                  <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 mt-3">
                    <Button type="button" variant="outline" onClick={() => setOpenOrdo(false)}>Annuler</Button>
                    <Button type="submit" disabled={saveOrdo.isPending}>{saveOrdo.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => router.push(`/dashboard/ordonnances?patient=${patientId}`)}>
              <ExternalLink className="h-3.5 w-3.5" /> Voir toutes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {ordonnances.length === 0 ? (
            <div className="flex  items-center justify-center h-16 text-gray-400 text-sm">Aucune ordonnance</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {ordonnances.map(o => (
                <div key={o.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500">{new Date(o.date).toLocaleDateString('fr-FR')}</span>
                    {o.medecin_nom && <span className="text-xs text-gray-400">· Dr {o.medecin_nom}</span>}
                    {o.consultation && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Consultation #{o.consultation}</span>}
                    {o.notes && <span className="text-xs text-gray-400 italic ml-auto">{o.notes}</span>}
                  </div>
                  {o.lignes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                      {o.lignes.map(l => (
                        <div key={l.id} className="flex items-start gap-2 p-2 bg-blue-50/50 rounded-lg">
                          <Pill className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{l.medicament}</p>
                            <p className="text-xs text-gray-500">{l.posologie}{l.duree ? ` · ${l.duree}` : ''}</p>
                            {l.quantite > 1 && <p className="text-xs text-gray-400">Qté : {l.quantite}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400 italic">Ordonnance sans médicaments</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Antécédents */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-purple-500" />
            Antécédents ({dossier.liste_antecedents.length})
          </CardTitle>
          <Dialog open={openAntecedent} onOpenChange={(v) => { setOpenAntecedent(v); if (!v) { antForm.reset(); setEditingAnt(null) } }}>
            <DialogTrigger render={<Button size="sm" onClick={openNewAnt} className="flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Ajouter</Button>} />
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{editingAnt ? 'Modifier l\'antécédent' : 'Nouvel antécédent'}</DialogTitle></DialogHeader>
              <form onSubmit={antForm.handleSubmit(d => saveAnt.mutate(d))} className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <select {...antForm.register('type')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                    {TYPES_ANTECEDENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div><Label>Description *</Label><textarea {...antForm.register('description', { required: true })} rows={3} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Décrire l'antécédent..." /></div>
                <div><Label>Date (approximative)</Label><Input type="date" {...antForm.register('date')} /></div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpenAntecedent(false)}>Annuler</Button>
                  <Button type="submit" disabled={saveAnt.isPending}>{saveAnt.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {dossier.liste_antecedents.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-gray-400 text-sm">Aucun antécédent enregistré</div>
          ) : (
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Description</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dossier.liste_antecedents.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${typeStyle(a.type)}`}>{a.type_label}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEditAnt(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50"
                          onClick={() => confirm('Supprimer ?') && removeAnt.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page principale — liste des patients ──────────────────────────────────

function DossiersContent() {
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; nom: string } | null>(null)
  const [searchPatient, setSearchPatient] = useState<number | null>(null)

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers', search],
    queryFn: () => fetchDossiers(search),
  })

  if (selectedPatient) {
    return <DossierView patientId={selectedPatient.id} patientNom={selectedPatient.nom} onBack={() => setSelectedPatient(null)} />
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dossiers médicaux</h1>
          <p className="text-gray-500 text-sm">{dossiers.length} dossier(s) ouvert(s)</p>
        </div>
        {/* Accès rapide par patient */}
        <div className="w-72">
          <PatientSelect
            value={searchPatient}
            onChange={(id, p) => {
              if (id && p) {
                setSelectedPatient({ id, nom: `${p.last_name.toUpperCase()} ${p.first_name}` })
              }
              setSearchPatient(null)
            }}
            placeholder="Accès rapide par patient..."
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom de patient..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Liste */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
          ) : dossiers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <FolderOpen className="h-10 w-10 mb-2 opacity-30" />
              <p>Aucun dossier ouvert</p>
              <p className="text-xs mt-1">Utilisez l'accès rapide par patient ci-dessus</p>
            </div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Patient</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Groupe sanguin</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Allergies</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Antécédents</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Traitements</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dossiers.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedPatient({ id: d.patient, nom: d.patient_nom })}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{d.patient_nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {d.groupe_sanguin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full font-bold">
                          <Droplets className="h-3 w-3" /> {d.groupe_sanguin}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                      {d.allergies || <span className="text-gray-400 text-xs">Aucune</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {d.liste_antecedents.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
                          {d.liste_antecedents.length} antécédent{d.liste_antecedents.length > 1 ? 's' : ''}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                      {d.traitements_en_cours || <span className="text-gray-400 text-xs">Aucun</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedPatient({ id: d.patient, nom: d.patient_nom })}>
                        <FolderOpen className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DossiersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>}>
      <DossiersContent />
    </Suspense>
  )
}
