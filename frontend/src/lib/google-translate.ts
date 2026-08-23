export function hasActiveTranslation() {
  return typeof document !== "undefined" && document.cookie.split("; ").some((cookie) => cookie.startsWith("googtrans="))
}
