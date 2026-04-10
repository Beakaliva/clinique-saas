'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '@/lib/api'
import type { Facture, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import PatientSelect from '@/components/ui/patient-select'
import {
  Plus, Search, Receipt, User, ChevronLeft, ChevronRight,
  Pencil, Trash2, PlusCircle, XCircle, Shield, CreditCard, ChevronDown, ChevronUp,
} from 'lucide-react'

const STATUTS = [
  { value: 'brouillon', label: 'Brouillon',           color: 'bg-gray-100 text-gray-600' },
  { value: 'emise',     label: 'Émise',               color: 'bg-blue-50 text-blue-700' },
  { value: 'payee',     label: 'Payée',               color: 'bg-green-50 text-green-700' },
  { value: 'partielle', label: 'Partiellement payée', color: 'bg-yellow-50 text-yellow-700' },
  { value: 'annulee',   label: 'Annulée',             color: 'bg-red-50 text-red-600' },
]

const MODES_PAIEMENT = [
  { value: 'especes',  label: 'Espèces' },
  { value: 'carte',    label: 'Carte bancaire' },
  { value: 'virement', label: 'Virement' },
  { value: 'mobile',   label: 'Mobile Money' },
  { value: 'autre',    label: 'Autre' },
]

function fmt(val: string | number) {
  return Number(val).toLocaleString('fr-FR') + ' GNF'
}

interface FactureFormData {
  date: string
  statut: string
  notes: string
  est_assure: boolean
  taux_assurance: number
  assurance_nom: string
  assurance_code: string
  part_patient: number
  part_assurance: number
  lignes: { description: string; quantite: number; prix_unitaire: number }[]
}

interface PaiementFormData {
  payeur: 'patient' | 'assurance'
  mode: string
  montant: number
  notes: string
}

// ── Panneau paiements d'une facture ───────────────────────────────────────
function PaiementsPanel({ factureId, onClose }: { factureId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: facture, isLoading } = useQuery({
    queryKey: ['facture', factureId],
    queryFn: () => api.get<Facture>(`/factures/${factureId}/`).then(r => r.data),
  })
  const { register, handleSubmit, reset, watch } = useForm<PaiementFormData>({
    defaultValues: { payeur: 'patient', mode: 'especes', montant: 0 }
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['facture', factureId] })
    qc.invalidateQueries({ queryKey: ['factures'] })
  }

  const ajouterPaiement = useMutation({
    mutationFn: (d: PaiementFormData) => api.post(`/factures/${factureId}/paiements/`, d),
    onSuccess: () => { invalidate(); reset({ payeur: 'patient', mode: 'especes', montant: 0 }) },
    onError:   (err: unknown) => {
      const msg = (err as { response?: { data?: { montant?: string[] } } })?.response?.data?.montant?.[0]
      if (msg) alert(msg)
    },
  })

  const supprimerPaiement = useMutation({
    mutationFn: (pid: number) => api.delete(`/factures/${factureId}/paiements/${pid}/`),
    onSuccess: invalidate,
  })

  const payeur = watch('payeur')

  // Payeurs disponibles = ceux dont le restant > 0
  const restantPatient    = facture ? Number(facture.montant_restant_patient)    : 0
  const restantAssurance  = facture ? Number(facture.montant_restant_assurance)  : 0
  const restantSimple     = facture ? Number(facture.montant_restant)            : 0

  const payeursDisponibles = facture?.est_assure
    ? [
        ...(restantPatient   > 0 ? [{ value: 'patient',   label: 'Patient' }]   : []),
        ...(restantAssurance > 0 ? [{ value: 'assurance', label: 'Assurance' }] : []),
      ]
    : []

  const restant = facture?.est_assure
    ? (payeur === 'assurance' ? restantAssurance : restantPatient)
    : restantSimple

  const toutPayé = facture?.est_assure
    ? (restantPatient <= 0 && restantAssurance <= 0)
    : restantSimple <= 0

  if (!facture) {
    if (isLoading) return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-8 text-center text-gray-400">Chargement...</div>
      </div>
    )
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800">Paiements — {facture.numero}</h2>
            <p className="text-sm text-gray-500">{facture.patient_nom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        {/* Résumé financier */}
        <div className="p-4 bg-gray-50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Montant total</span>
            <span className="font-semibold">{fmt(facture.montant_total)}</span>
          </div>
          {facture.est_assure ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-blue-600"><Shield className="h-3 w-3" /> Part assurance ({facture.taux_assurance}%)</span>
                <span className="font-medium text-blue-600">{fmt(facture.part_assurance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Part patient</span>
                <span className="font-medium">{fmt(facture.part_patient)}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Payé assurance</span>
                <span className="font-medium text-green-600">{fmt(facture.montant_paye_assurance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Payé patient</span>
                <span className="font-medium text-green-600">{fmt(facture.montant_paye_patient)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-red-600">Reste assurance</span>
                <span className="text-red-600">{fmt(facture.montant_restant_assurance)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-red-600">Reste patient</span>
                <span className="text-red-600">{fmt(facture.montant_restant_patient)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Total payé</span>
                <span className="font-medium text-green-600">{fmt(facture.montant_paye)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-red-600">Reste à payer</span>
                <span className="text-red-600">{fmt(facture.montant_restant)}</span>
              </div>
            </>
          )}
        </div>

        {/* Historique paiements */}
        <div className="p-4 max-h-40 overflow-y-auto space-y-2">
          {facture.paiements?.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">Aucun paiement enregistré</p>
          ) : facture.paiements?.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${p.payeur === 'assurance' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {p.payeur_label}
                </span>
                <span className="text-xs text-gray-500">{p.mode_label} · {new Date(p.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-green-700">{fmt(p.montant)}</span>
                <button onClick={() => supprimerPaiement.mutate(p.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Nouveau paiement */}
        <div className="p-4 border-t border-gray-100">
          {toutPayé ? (
            <p className="text-center text-sm text-green-600 font-medium py-2">Facture entièrement réglée</p>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Enregistrer un versement</p>
              <form onSubmit={handleSubmit(d => ajouterPaiement.mutate(d))} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {facture.est_assure && payeursDisponibles.length > 0 && (
                    <div>
                      <Label className="text-xs">Payeur</Label>
                      <select {...register('payeur')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                        {payeursDisponibles.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Mode</Label>
                    <select {...register('mode')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                      {MODES_PAIEMENT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Montant (restant : {fmt(restant)})</Label>
                    <Input type="number" min={1} max={restant || undefined} {...register('montant', { valueAsNumber: true })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Input {...register('notes')} placeholder="Référence, remarque..." />
                </div>
                <Button type="submit" className="w-full" disabled={ajouterPaiement.isPending}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {ajouterPaiement.isPending ? 'Enregistrement...' : 'Valider le versement'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Formulaire facture ────────────────────────────────────────────────────
function FactureForm({ editing, onClose }: { editing: Facture | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [patientId, setPatientId] = useState<number | null>(editing?.patient ?? null)

  const handlePatientChange = (id: number | null, patient?: import('@/types').Patient) => {
    setPatientId(id)
    if (patient && !editing) {
      if (patient.est_assure) {
        setValue('est_assure', true)
        setValue('assurance_nom', patient.assurance || '')
        setValue('assurance_code', patient.code_assurance || '')
        setValue('taux_assurance', Number(patient.pourcentage) || 0)
      } else {
        setValue('est_assure', false)
        setValue('assurance_nom', '')
        setValue('assurance_code', '')
        setValue('taux_assurance', 0)
      }
    }
  }

  const { register, handleSubmit, setValue, watch, control } = useForm<FactureFormData>({
    defaultValues: editing ? {
      date: editing.date,
      statut: editing.statut,
      notes: editing.notes,
      est_assure: editing.est_assure,
      taux_assurance: Number(editing.taux_assurance),
      assurance_nom: editing.assurance_nom,
      assurance_code: editing.assurance_code,
      part_patient: Number(editing.part_patient),
      part_assurance: Number(editing.part_assurance),
      lignes: editing.lignes.map(l => ({ description: l.description, quantite: l.quantite, prix_unitaire: Number(l.prix_unitaire) })),
    } : { statut: 'emise', est_assure: false, taux_assurance: 0, lignes: [] }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' })
  const lignes = watch('lignes')
  const estAssure = watch('est_assure')
  const taux = watch('taux_assurance') || 0
  const totalLocal = lignes?.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0), 0) || 0
  const partAssurance = Math.round(totalLocal * taux / 100)
  const partPatient = totalLocal - partAssurance

  const save = useMutation({
    mutationFn: async (d: FactureFormData) => {
      const payload = {
        ...d,
        patient: patientId,
        montant_total: totalLocal,
        part_assurance: estAssure ? partAssurance : 0,
        part_patient: estAssure ? partPatient : totalLocal,
      }
      if (editing) {
        const f = await api.patch<Facture>(`/factures/${editing.id}/`, payload).then(r => r.data)
        await Promise.all(editing.lignes.map(l => api.delete(`/factures/${f.id}/lignes/${l.id}/`)))
        await Promise.all(d.lignes.map(l => api.post(`/factures/${f.id}/lignes/`, l)))
        return f
      } else {
        const f = await api.post<Facture>('/factures/', payload).then(r => r.data)
        await Promise.all(d.lignes.map(l => api.post(`/factures/${f.id}/lignes/`, l)))
        return f
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['factures'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-bold text-gray-800">{editing ? 'Modifier la facture' : 'Nouvelle facture'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <form onSubmit={handleSubmit(d => save.mutate(d))} className="p-5 space-y-4">
          <div><Label>Patient *</Label><PatientSelect value={patientId} onChange={handlePatientChange} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date *</Label><Input type="date" {...register('date', { required: true })} /></div>
            <div><Label>Statut</Label>
              <select {...register('statut')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Assurance */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="est_assure" {...register('est_assure')} className="rounded" />
            <Label htmlFor="est_assure">Patient assuré</Label>
          </div>
          {estAssure && (
            <div className="border border-blue-100 rounded-lg p-3 space-y-3 bg-blue-50/40">
              <p className="text-xs font-semibold text-blue-700 uppercase">Assurance</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Compagnie</Label><Input {...register('assurance_nom')} placeholder="SONACOS, SAAR..." /></div>
                <div><Label>N° Police</Label><Input {...register('assurance_code')} /></div>
              </div>
              <div>
                <Label>Taux prise en charge (%)</Label>
                <Input type="number" min={0} max={100} {...register('taux_assurance', { valueAsNumber: true })} placeholder="80" />
              </div>
              {totalLocal > 0 && (
                <div className="grid grid-cols-2 gap-3 text-sm pt-1">
                  <div className="bg-blue-100 rounded-lg p-2 text-center">
                    <p className="text-xs text-blue-600 font-medium">Part assurance ({taux}%)</p>
                    <p className="font-bold text-blue-800">{fmt(partAssurance)}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600 font-medium">Part patient ({100 - taux}%)</p>
                    <p className="font-bold text-gray-800">{fmt(partPatient)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lignes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Lignes de facturation</Label>
              <button type="button" onClick={() => append({ description: '', quantite: 1, prix_unitaire: 0 })}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <PlusCircle className="h-3.5 w-3.5" /> Ajouter une ligne
              </button>
            </div>
            {fields.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">Aucune ligne</p> : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_60px_90px_28px] gap-2 text-xs font-semibold text-gray-500 px-1">
                  <span>Description</span><span>Qté</span><span>Prix unit.</span><span></span>
                </div>
                {fields.map((f, i) => (
                  <div key={f.id} className="grid grid-cols-[1fr_60px_90px_28px] gap-2 items-center">
                    <Input {...register(`lignes.${i}.description`)} placeholder="Consultation, examen..." className="h-7 text-xs" />
                    <Input type="number" {...register(`lignes.${i}.quantite`, { valueAsNumber: true })} min={1} className="h-7 text-xs" />
                    <Input type="number" {...register(`lignes.${i}.prix_unitaire`, { valueAsNumber: true })} min={0} className="h-7 text-xs" />
                    <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><XCircle className="h-4 w-4" /></button>
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <span className="text-sm font-bold text-gray-800">Total : {fmt(totalLocal)}</span>
                </div>
              </div>
            )}
          </div>

          <div><Label>Notes</Label><textarea {...register('notes')} rows={2} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none" /></div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={save.isPending || !patientId}>{save.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────
function FacturesContent() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Facture | null>(null)
  const [paiementsFacture, setPaiementsFacture] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  // Ouvre automatiquement le panel si ?open=<id> dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const openId = params.get('open')
    if (openId) {
      setPaiementsFacture(Number(openId))
      // Nettoyer l'URL sans recharger la page
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['factures', search, page],
    queryFn: () => api.get<PaginatedResponse<Facture>>('/factures/', { params: { search, page } }).then(r => r.data),
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/factures/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['factures'] }),
  })

  const totalPages = data ? Math.ceil(data.count / 25) : 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Facturation</h1>
          <p className="text-gray-500 text-sm">{data?.count ?? 0} facture(s)</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4" /> Nouvelle facture
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Rechercher par patient, numéro..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
            : data?.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Receipt className="h-10 w-10 mb-2 opacity-30" /><p>Aucune facture</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['N° Facture', 'Patient', 'Date', 'Total', 'Payé', 'Reste', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.results.map(f => (
                    <React.Fragment key={f.id}>
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-blue-600">{f.numero}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{f.patient_nom}</span>
                            {f.est_assure && <span title="Assuré"><Shield className="h-3.5 w-3.5 text-blue-500" /></span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(f.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{fmt(f.montant_total)}</td>
                        <td className="px-4 py-3 text-sm text-green-600">{fmt(f.montant_paye)}</td>
                        <td className="px-4 py-3 text-sm text-red-500">{fmt(f.montant_restant)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${STATUTS.find(s => s.value === f.statut)?.color ?? 'bg-gray-100 text-gray-600'}`}>{f.statut_label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" title="Paiements" onClick={() => setPaiementsFacture(f.id)} className="text-green-600 hover:bg-green-50">
                              <CreditCard className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Voir lignes" onClick={() => setExpanded(expanded === f.id ? null : f.id)}>
                              {expanded === f.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setFormOpen(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => confirm('Supprimer ?') && del.mutate(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                      {expanded === f.id && (
                        <tr>
                          <td colSpan={8} className="px-8 py-3 bg-gray-50/60">
                            {f.est_assure && (
                              <div className="flex gap-4 mb-2 text-xs">
                                <span className="text-blue-700 font-medium"><Shield className="h-3 w-3 inline mr-1" />Assurance : {f.assurance_nom} ({f.taux_assurance}%) — {fmt(f.part_assurance)}</span>
                                <span className="text-gray-600">Part patient : {fmt(f.part_patient)}</span>
                              </div>
                            )}
                            <table className="w-full text-xs">
                              <thead><tr className="text-gray-400"><th className="text-left pb-1">Description</th><th>Qté</th><th>Prix unit.</th><th>Montant</th></tr></thead>
                              <tbody>
                                {f.lignes?.map(l => (
                                  <tr key={l.id} className="border-t border-gray-100">
                                    <td className="py-1 text-gray-700">{l.description}</td>
                                    <td className="text-center">{l.quantite}</td>
                                    <td className="text-center">{fmt(l.prix_unitaire)}</td>
                                    <td className="text-center font-medium">{fmt(l.montant)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} / {totalPages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {formOpen && <FactureForm editing={editing} onClose={() => { setFormOpen(false); setEditing(null) }} />}
      {paiementsFacture && <PaiementsPanel factureId={paiementsFacture} onClose={() => setPaiementsFacture(null)} />}
    </div>
  )
}

export default function FacturesPage() {
  return <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>}><FacturesContent /></Suspense>
}
