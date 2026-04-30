'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useClinicAccess } from '@/hooks/use-clinic-access'
import api from '@/lib/api'
import type { Medicament, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { Plus, Search, Pill, Pencil, Trash2, AlertTriangle, PackageX, Package } from 'lucide-react'
import { StatCards, type StatDef } from '@/components/ui/stat-cards'

const PHARMACIE_STATS: StatDef[] = [
  { label: 'Total médicaments', endpoint: '/medicaments/', icon: Pill,        color: 'bg-teal-50 text-teal-600' },
  { label: 'En stock',          endpoint: '/medicaments/', params: { en_rupture: 'false' }, icon: Package,    color: 'bg-green-50 text-green-600' },
  { label: 'En rupture',        endpoint: '/medicaments/', params: { en_rupture: 'true' },  icon: PackageX,   color: 'bg-red-50 text-red-600' },
]

const FORMES = [
  { value: 'comprimes',  label: 'Comprimés' },
  { value: 'gelules',    label: 'Gélules' },
  { value: 'sirop',      label: 'Sirop' },
  { value: 'injectable', label: 'Injectable' },
  { value: 'pommade',    label: 'Pommade' },
  { value: 'gouttes',    label: 'Gouttes' },
  { value: 'autre',      label: 'Autre' },
]

interface FormData {
  nom: string
  forme: string
  dosage: string
  unite: string
  stock_actuel: number
  stock_min: number
  prix_unitaire: number
}

function PharmacieContent() {
  const qc = useQueryClient()
  const { hasAccess } = useClinicAccess()
    const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Medicament | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['medicaments', search, page],
    queryFn: () => api.get<PaginatedResponse<Medicament>>('/pharmacie/', { params: { search, page } }).then(r => r.data),
  })

  const { register, handleSubmit, reset, setValue } = useForm<FormData>({ defaultValues: { forme: 'comprimes', stock_actuel: 0, stock_min: 5, prix_unitaire: 0 } })

  const save = useMutation({
    mutationFn: (d: FormData) => editing
      ? api.patch<Medicament>(`/pharmacie/${editing.id}/`, d).then(r => r.data)
      : api.post<Medicament>('/pharmacie/', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medicaments'] }); setOpen(false); reset(); setEditing(null) },
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/pharmacie/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicaments'] }),
  })

  const openEdit = (m: Medicament) => {
    setEditing(m)
    setValue('nom', m.nom); setValue('forme', m.forme); setValue('dosage', m.dosage)
    setValue('unite', m.unite); setValue('stock_actuel', m.stock_actuel)
    setValue('stock_min', m.stock_min); setValue('prix_unitaire', Number(m.prix_unitaire))
    setOpen(true)
  }

  const totalPages = data ? Math.ceil(data.count / 25) : 1
  const ruptures = data?.results.filter(m => m.en_rupture).length ?? 0

  return (
    <div className="space-y-5">
      <StatCards stats={PHARMACIE_STATS} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pharmacie</h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-500 text-sm">{data?.count ?? 0} médicament(s)</p>
            {ruptures > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" /> {ruptures} en rupture
              </span>
            )}
          </div>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { reset(); setEditing(null) } }}>
          <DialogTrigger render={<Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau médicament</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Modifier le médicament' : 'Nouveau médicament'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nom *</Label><Input {...register('nom', { required: true })} placeholder="Paracétamol" /></div>
                <div><Label>Forme</Label>
                  <select {...register('forme')} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                    {FORMES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div><Label>Dosage</Label><Input {...register('dosage')} placeholder="500mg" /></div>
                <div><Label>Unité</Label><Input {...register('unite')} placeholder="Boîte de 16" /></div>
                <div><Label>Prix unitaire (GNF)</Label><Input type="number" min={0} {...register('prix_unitaire', { valueAsNumber: true })} /></div>
                <div><Label>Stock actuel</Label><Input type="number" min={0} {...register('stock_actuel', { valueAsNumber: true })} /></div>
                <div><Label>Stock minimum</Label><Input type="number" min={0} {...register('stock_min', { valueAsNumber: true })} /></div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={!hasAccess || save.isPending}>{save.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Rechercher un médicament..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
            : data?.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Pill className="h-10 w-10 mb-2 opacity-30" /><p>Aucun médicament</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Médicament', 'Forme', 'Dosage', 'Stock', 'Stock min', 'Prix unit.', 'Statut', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.results.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{m.nom}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.forme_display}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.dosage || '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{m.stock_actuel} <span className="text-xs text-gray-400 font-normal">{m.unite}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.stock_min}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{Number(m.prix_unitaire).toLocaleString('fr-FR')} GNF</td>
                      <td className="px-4 py-3">
                        {m.en_rupture
                          ? <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><AlertTriangle className="h-3 w-3" /> Rupture</span>
                          : <span className="text-xs text-green-600 font-medium">En stock</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => confirm('Supprimer ?') && del.mutate(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </CardContent>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        count={data?.count}
        onPageChange={setPage}
      />
    </div>
  )
}

export default function PharmaciePage() {
  return <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>}><PharmacieContent /></Suspense>
}
