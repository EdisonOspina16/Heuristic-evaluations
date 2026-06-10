"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  X,
  LogOut,
  ShieldCheck,
  Users,
  Key
} from "lucide-react"
import { cn, Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { authService, User as UserType } from "@/features/auth/services/auth.service"
import { projectsService, Project } from "@/features/projects/services/projects.service"
import { ThemeToggle } from "@/components/ThemeToggle"

const navItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Evaluaciones", icon: ClipboardCheck, href: "/evaluations" },
  { name: "Categorías", icon: Hash, href: "/categories" },
  { name: "Analíticas", icon: BarChart3, href: "/analytics" },
]

const adminItems = [
  { name: "Usuarios", icon: Users, href: "/account/users" },
  { name: "Roles", icon: ShieldCheck, href: "/account/roles" },
  { name: "Permisos Globales", icon: Key, href: "/account/permissions" },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<UserType | null>(null)
  const [projects, setProjects] = React.useState<Project[]>([])
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  React.useEffect(() => {
    setUser(authService.getCurrentUser())
    
    const fetchProjects = async () => {
      try {
        const data = await projectsService.getProjects()
        setProjects(data)
      } catch (err) {
        console.error("Error fetching projects for sidebar", err)
      }
    }
    fetchProjects()
  }, [])

  const handleLogout = () => {
    authService.logout()
    router.push("/login")
  }

  const isAdmin = user?.rol === "ADMIN"

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
        {!onClose && <ThemeToggle />}
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

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-10">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Administración
              </span>
            </div>
            <nav className="space-y-1">
              {adminItems.map((item) => {
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
          </div>
        )}

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
            {projects.length > 0 ? (
              projects.slice(0, 5).map((proj) => (
                <Link
                  key={proj.id}
                  href={`/project/${proj.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-brand-400 transition-colors" />
                    <span className="truncate max-w-[140px]">{proj.nombre}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))
            ) : (
              <p className="px-3 py-2 text-[10px] text-zinc-600 italic">No hay proyectos activos</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-white/5 bg-white/[0.01] relative">
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-4 right-4 mb-2 p-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-[60]"
            >
              <Link
                href="/account"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Mi Cuenta
              </Link>
              <button
                onClick={handleLogout}
                data-testid="sidebar-logout-button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          data-testid="sidebar-user-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 overflow-hidden">
             <User className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.nombre || "Usuario"}</p>
            <p className="text-[10px] text-zinc-500 truncate capitalize">{user?.rol || "Evaluador"} Account</p>
          </div>
          <Settings className={cn(
            "w-4 h-4 transition-all duration-300",
            isMenuOpen ? "rotate-90 text-brand-400" : "text-zinc-600 group-hover:text-zinc-400"
          )} />
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
