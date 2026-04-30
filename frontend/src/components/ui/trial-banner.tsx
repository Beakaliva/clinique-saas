'use client'

import { useAuthStore } from '@/store/auth.store'
import { AlertTriangle, Clock, Zap, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function TrialBanner() {
  const clinic = useAuthStore((s) => s.clinic)
  const [dismissed, setDismissed] = useState(false)

  // Abonné ou pas de données : rien à afficher
  if (!clinic || clinic.is_subscribed || dismissed) return null

  const days = clinic.trial_days_left

  // Trial encore actif
  if (clinic.trial_active) {
    // N'afficher la bannière que si ≤ 7 jours restants (sinon trop distrayant)
    if (days > 7) return null

    const isUrgent = days <= 3

    return (
      <div className={`relative flex items-center justify-between gap-3 px-4 py-2.5 text-sm
        ${isUrgent
          ? 'bg-red-50 border-b border-red-200 text-red-800'
          : 'bg-amber-50 border-b border-amber-200 text-amber-800'
        }`}>
        <div className="flex items-center gap-2">
          {isUrgent
            ? <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            : <Clock className="h-4 w-4 shrink-0 text-amber-500" />
          }
          <span>
            {days === 0
              ? "Votre essai expire aujourd'hui."
              : `Il vous reste <strong>${days} jour${days > 1 ? 's' : ''}</strong> dans votre période d'essai gratuite.`
            }
            {' '}
          </span>
          <Link href="/dashboard/upgrade"
            className={`inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline
              ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
            <Zap className="h-3.5 w-3.5" />
            Souscrire maintenant
          </Link>
        </div>
        <button onClick={() => setDismissed(true)}
          className={`p-1 rounded hover:bg-black/5 transition-colors shrink-0
            ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // Trial expiré (has_access = false) — bannière bloquante non-dismissible
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-600 text-white text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="font-medium">
          Votre période d'essai est terminée. Vos données sont conservées.
        </span>
      </div>
      <Link href="/dashboard/upgrade"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors text-xs shrink-0">
        <Zap className="h-3.5 w-3.5" />
        Activer mon abonnement
      </Link>
    </div>
  )
}
