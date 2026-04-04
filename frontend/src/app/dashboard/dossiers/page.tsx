'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import type { DossierMedical, Antecedent, Patient, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PatientSelect from '@/components/ui/patient-select'
import {
  Search, FolderOpen, User, ArrowLeft, Pencil, Trash2, Plus,
  Droplets, AlertTriangle, Pill, FileText, ClipboardList,
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

// ── Vue dossier d'un patient ──────────────────────────────────────────────

function DossierView({ patientId, patientNom, onBack }: { patientId: number; patientNom: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [openAntecedent, setOpenAntecedent] = useState(false)
  const [editingAnt, setEditingAnt] = useState<Antecedent | null>(null)
  const [editingDossier, setEditingDossier] = useState(false)

  const { data: dossier, isLoading } = useQuery({
    queryKey: ['dossier', patientId],
    queryFn: () => fetchDossierByPatient(patientId),
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
            <div>
              <Label>Allergies</Label>
              <textarea {...dossierForm.register('allergies')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Pénicilline, arachides..." />
            </div>
            <div>
              <Label>Traitements en cours</Label>
              <textarea {...dossierForm.register('traitements_en_cours')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Metformine 500mg..." />
            </div>
            <div>
              <Label>Antécédents (résumé libre)</Label>
              <textarea {...dossierForm.register('antecedents')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Résumé général..." />
            </div>
            <div>
              <Label>Notes</Label>
              <textarea {...dossierForm.register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Notes cliniques..." />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingDossier(false)}>Annuler</Button>
              <Button type="submit" disabled={saveDossier.isPending}>{saveDossier.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Infos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <Droplets className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Groupe sanguin</p>
              <p className="text-xl font-bold text-gray-800">{dossier.groupe_sanguin || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <p className="text-sm font-semibold text-gray-700">Allergies</p>
            </div>
            <p className="text-sm text-gray-600">{dossier.allergies || <span className="text-gray-400 italic">Aucune allergie connue</span>}</p>
          </CardContent>
        </Card>

        {dossier.traitements_en_cours && (
          <Card className="border-0 shadow-sm lg:col-span-3">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-semibold text-gray-700">Traitements en cours</p>
              </div>
              <p className="text-sm text-gray-600">{dossier.traitements_en_cours}</p>
            </CardContent>
          </Card>
        )}

        {dossier.notes && (
          <Card className="border-0 shadow-sm lg:col-span-3">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-700">Notes</p>
              </div>
              <p className="text-sm text-gray-600">{dossier.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Antécédents */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-purple-500" />
            Antécédents ({dossier.liste_antecedents.length})
          </CardTitle>
          <Dialog open={openAntecedent} onOpenChange={(v) => { setOpenAntecedent(v); if (!v) { antForm.reset(); setEditingAnt(null) } }}>
            <DialogTrigger render={
              <Button size="sm" onClick={openNewAnt} className="flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            } />
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{editingAnt ? 'Modifier l\'antécédent' : 'Nouvel antécédent'}</DialogTitle></DialogHeader>
              <form onSubmit={antForm.handleSubmit(d => saveAnt.mutate(d))} className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <select {...antForm.register('type')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                    {TYPES_ANTECEDENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Description *</Label>
                  <textarea {...antForm.register('description', { required: true })} rows={3} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" placeholder="Décrire l'antécédent..." />
                </div>
                <div>
                  <Label>Date (approximative)</Label>
                  <Input type="date" {...antForm.register('date')} />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpenAntecedent(false)}>Annuler</Button>
                  <Button type="submit" disabled={saveAnt.isPending}>{saveAnt.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {dossier.liste_antecedents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 text-gray-400">
              <p className="text-sm">Aucun antécédent enregistré</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Description</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dossier.liste_antecedents.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${typeStyle(a.type)}`}>
                        {a.type_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEditAnt(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => confirm('Supprimer cet antécédent ?') && removeAnt.mutate(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
          ) : dossiers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <FolderOpen className="h-10 w-10 mb-2 opacity-30" />
              <p>Aucun dossier ouvert</p>
              <p className="text-xs mt-1">Utilisez l'accès rapide par patient ci-dessus</p>
            </div>
          ) : (
            <table className="w-full">
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
