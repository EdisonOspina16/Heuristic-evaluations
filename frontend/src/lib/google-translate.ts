export function hasActiveTranslation() {
  if (typeof document === "undefined") return false

  const root = document.documentElement
  const hasGoogleTranslateCookie = document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith("googtrans="))

  // Google Translate adds one of these classes after it has rewritten text
  // nodes. Checking them covers cases where its cookie is unavailable.
  return (
    hasGoogleTranslateCookie ||
    root.classList.contains("translated-ltr") ||
    root.classList.contains("translated-rtl")
  )
}

/**
 * Authentication changes replace most of the React tree. A native navigation
 * prevents React from unmounting nodes that a browser translator may have
 * moved or replaced.
 */
export function navigateAfterAuth(url: string) {
  window.location.assign(url)
}
