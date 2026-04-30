import { useAuthStore } from '@/store/auth.store'

/**
 * Retourne l'état d'accès de la clinique.
 * - hasAccess : false si le trial est expiré ET pas d'abonnement
 * - isExpired : true si spécifiquement le trial est terminé sans abonnement
 */
export function useClinicAccess() {
  const clinic = useAuthStore((s) => s.clinic)
  const user   = useAuthStore((s) => s.user)

  // Les superusers ont toujours accès
  if (user?.is_superuser) return { hasAccess: true, isExpired: false }

  const hasAccess = clinic?.has_access ?? true
  const isExpired = clinic ? (!clinic.has_access && !clinic.trial_active && !clinic.is_subscribed) : false

  return { hasAccess, isExpired }
}
