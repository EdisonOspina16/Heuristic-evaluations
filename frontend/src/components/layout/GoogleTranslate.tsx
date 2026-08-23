"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

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
