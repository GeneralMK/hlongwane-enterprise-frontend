const PUBLIC_SPACES_URL =
  import.meta.env.VITE_SPACES_PUBLIC_URL?.trim()

export function resolveProductImageUrl(
  imageUrl?: string | null,
  objectKey?: string | null
): string | null {
  const url = imageUrl?.trim()
  const key = objectKey?.trim() || url

  if (url && /^https?:\/\//i.test(url)) {
    return url
  }

  if (!key || !PUBLIC_SPACES_URL) {
    return null
  }

  return [
    PUBLIC_SPACES_URL.replace(/\/+$/, ''),
    key.replace(/^\/+/, '')
  ].join('/')
}