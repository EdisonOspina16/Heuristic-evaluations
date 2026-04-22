"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  FolderKanban, 
  ClipboardCheck, 
  BarChart3, 
  Settings,
  PlusCircle,
  Hash,
  ChevronRight,
  User,
  X
} from "lucide-react"
import { cn, Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Evaluaciones", icon: ClipboardCheck, href: "/evaluations" },
  { name: "Categorías", icon: Hash, href: "/categories" },
  { name: "Analíticas", icon: BarChart3, href: "/analytics" },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <aside className="w-[var(--sidebar-width)] h-full border-r border-white/5 bg-bg-sidebar flex flex-col z-50">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">HeuristicApp</span>
        </div>
        
        {/* Close Button (Mobile Only) */}
        {onClose && (
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  isActive 
                    ? "bg-brand-500/10 text-brand-400" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-brand-400" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Projects Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Proyectos Recientes
            </span>
            <Button variant="ghost" size="icon" className="h-4 w-4">
              <PlusCircle className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {["App Bancaria", "E-commerce", "Landing Page"].map((proj) => (
              <Link
                key={proj}
                href={`/project/${proj.toLowerCase().replace(' ', '-')}`}
                onClick={onClose}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-brand-400 transition-colors" />
                  {proj}
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 overflow-hidden">
             <User className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Edison Ospina</p>
            <p className="text-[10px] text-zinc-500 truncate">Admin Account</p>
          </div>
          <Settings className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Sidebar (Sticky on lg) */}
      <div className="hidden lg:flex sticky top-0 h-screen z-40 bg-bg-sidebar">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
