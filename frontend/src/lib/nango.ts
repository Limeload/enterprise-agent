import Nango from "@nangohq/frontend"

let _nango: Nango | null = null

export function getNango(): Nango {
  if (!_nango) {
    const publicKey = process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY
    if (!publicKey || publicKey.startsWith("nango_pk_...")) {
      throw new Error("NANGO_NOT_CONFIGURED")
    }
    _nango = new Nango({ publicKey })
  }
  return _nango
}

export function isNangoConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY
  return Boolean(key && !key.startsWith("nango_pk_...") && key.length > 10)
}

/**
 * Trigger the Nango OAuth popup for a provider.
 *
 * nango.auth() internally calls window.open() synchronously, so it respects
 * browser popup policies as long as this function is called directly from a
 * user-gesture event handler (click, etc.).
 */
export async function connectProvider(
  providerConfigKey: string,
  connectionId: string
): Promise<{ providerConfigKey: string; connectionId: string }> {
  const nango = getNango()
  const result = await nango.auth(providerConfigKey, connectionId)
  return result as { providerConfigKey: string; connectionId: string }
}
