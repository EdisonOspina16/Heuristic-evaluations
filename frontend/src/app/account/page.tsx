"use client";

import React, { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar,
  Settings as SettingsIcon,
  Bell,
  Lock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authService, User as UserType } from "@/features/auth/services/auth.service";

export default function AccountProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-accent-brand" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <User className="w-8 h-8 text-accent-brand" />
            Mi Cuenta
          </h1>
          <p className="text-muted mt-1">
            Gestiona tu información personal y preferencias.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-bg-elevated/50 border-border-subtle backdrop-blur-xl rounded-3xl overflow-hidden h-fit">
          <div className="h-24 bg-gradient-to-r from-brand-600 to-indigo-600" />
          <CardContent className="relative pt-0 pb-8 px-6 text-center">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="w-24 h-24 rounded-full bg-surface-tint border-4 border-bg-deep flex items-center justify-center shadow-xl">
                <User className="w-12 h-12 text-accent-brand" />
              </div>
            </div>
            <div className="mt-16">
              <h2 className="text-xl font-bold text-foreground">{user?.nombre}</h2>
              <p className="text-sm text-muted mt-1">{user?.email}</p>
              <div className="mt-4 flex justify-center">
                <span className="px-3 py-1 rounded-full bg-brand-500/10 text-accent-brand text-[10px] font-bold uppercase tracking-wider border border-brand-500/20">
                  {user?.rol || "Evaluador"} Account
                </span>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border-subtle grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">12</p>
                <p className="text-[10px] text-subtle uppercase font-medium">Evaluaciones</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">4</p>
                <p className="text-[10px] text-subtle uppercase font-medium">Proyectos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings/Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-bg-elevated/50 border-border-subtle backdrop-blur-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-subtle uppercase ml-1">Nombre Completo</label>
                  <div className="flex items-center gap-3 p-4 bg-surface-tint/30 rounded-2xl border border-border-subtle">
                    <User className="w-4 h-4 text-subtle" />
                    <span className="text-sm text-foreground">{user?.nombre}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-subtle uppercase ml-1">Correo Electrónico</label>
                  <div className="flex items-center gap-3 p-4 bg-surface-tint/30 rounded-2xl border border-border-subtle">
                    <Mail className="w-4 h-4 text-subtle" />
                    <span className="text-sm text-foreground">{user?.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-subtle uppercase ml-1">Rol Asignado</label>
                  <div className="flex items-center gap-3 p-4 bg-surface-tint/30 rounded-2xl border border-border-subtle">
                    <Shield className="w-4 h-4 text-subtle" />
                    <span className="text-sm text-foreground capitalize">{user?.rol}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-subtle uppercase ml-1">Miembro desde</label>
                  <div className="flex items-center gap-3 p-4 bg-surface-tint/30 rounded-2xl border border-border-subtle">
                    <Calendar className="w-4 h-4 text-subtle" />
                    <span className="text-sm text-foreground">Mayo 2026</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button variant="outline" className="border-border-subtle hover:bg-surface-tint text-muted gap-2">
                  Editar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-bg-elevated/50 border-border-subtle backdrop-blur-xl rounded-3xl hover:border-brand-500/20 transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-tint flex items-center justify-center text-muted group-hover:bg-brand-500/10 group-hover:text-accent-brand transition-all">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Seguridad</h3>
                  <p className="text-xs text-subtle">Cambiar contraseña y 2FA.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-bg-elevated/50 border-border-subtle backdrop-blur-xl rounded-3xl hover:border-brand-500/20 transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-tint flex items-center justify-center text-muted group-hover:bg-brand-500/10 group-hover:text-accent-brand transition-all">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Notificaciones</h3>
                  <p className="text-xs text-subtle">Configura tus alertas.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
