"use client"

import Script from "next/script"
import { useEffect, useState } from "react"
import { hasActiveTranslation } from "@/lib/google-translate"

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          elementId: string,
        ) => unknown
      }
    }
    googleTranslateElementInit?: () => void
  }
}

const elementId = "google_translate_element"

export function GoogleTranslate() {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    const reloadOnNavigation = (...args: Parameters<History["pushState"]>) => {
      if (hasActiveTranslation()) {
        window.location.assign(String(args[2] ?? window.location.href))
        return
      }
      originalPushState.apply(window.history, args)
    }

    window.history.pushState = reloadOnNavigation
    window.history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      if (hasActiveTranslation()) {
        window.location.assign(String(args[2] ?? window.location.href))
        return
      }
      originalReplaceState.apply(window.history, args)
    }

    const reloadOnBackForward = () => {
      if (hasActiveTranslation()) window.location.reload()
    }

    const reloadOnInternalLink = (event: MouseEvent) => {
      if (!hasActiveTranslation() || event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const link = (event.target as Element).closest("a")
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return

      const destination = new URL(link.href, window.location.href)
      if (destination.origin !== window.location.origin || destination.hash === window.location.hash) return

      event.preventDefault()
      event.stopImmediatePropagation()
      window.location.assign(destination.href)
    }

    window.addEventListener("popstate", reloadOnBackForward)
    document.addEventListener("click", reloadOnInternalLink, true)

    const initializeTranslate = () => {
      if (!window.google?.translate?.TranslateElement) return

      const container = document.getElementById(elementId)
      if (!container || container.childElementCount > 0) return

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "es",
          includedLanguages: "en,es,fr,de,it,pt",
          autoDisplay: false,
        },
        elementId,
      )
    }

    window.googleTranslateElementInit = initializeTranslate
    if (scriptLoaded) initializeTranslate()

    return () => {
      delete window.googleTranslateElementInit
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      window.removeEventListener("popstate", reloadOnBackForward)
      document.removeEventListener("click", reloadOnInternalLink, true)
    }
  }, [scriptLoaded])

  return (
    <div className="google-translate-shell" aria-label="Selector de idioma">
      <span className="google-translate-label">Idioma</span>
      <div id={elementId} />
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
    </div>
  )
}
