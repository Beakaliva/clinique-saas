const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '')

/**
 * Retourne l'URL absolue d'un fichier media Django.
 * Si l'URL est déjà absolue (http/https) elle est retournée telle quelle.
 * Si null/undefined, retourne null.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${BACKEND}${path.startsWith('/') ? '' : '/'}${path}`
}
