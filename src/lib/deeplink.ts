const APP_HOSTS = new Set(['mychapter.app', 'www.mychapter.app'])

export function resolveDeepLinkPath(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (parsed.protocol === 'mychapter:' || parsed.protocol === 'com.mychapter.app:') {
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`
      return path && path !== '/' ? path : '/home'
    }

    if (APP_HOSTS.has(parsed.hostname)) {
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`
      return path || '/home'
    }

    return null
  } catch {
    return null
  }
}
