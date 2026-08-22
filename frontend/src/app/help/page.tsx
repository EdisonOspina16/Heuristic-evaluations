import { HelpCircle } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex flex-col items-center text-center gap-3 py-24">
        <div className="w-12 h-12 rounded-full bg-surface-tint border border-border-subtle flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-subtle" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Centro de ayuda</h1>
        <p className="text-sm text-subtle max-w-md">
          Todavía no hay contenido aquí. Pronto encontrarás guías y respuestas a preguntas frecuentes sobre la plataforma.
        </p>
      </div>
    </div>
  )
}
