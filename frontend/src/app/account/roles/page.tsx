"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Shield, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/features/auth/services/auth.service";

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      authService.getToken();
      setRoles([
        {
          id: 1,
          name: "ADMIN",
          description: "Control total del sistema, gestion de usuarios y configuraciones.",
          permissions_count: 11,
        },
        {
          id: 2,
          name: "EVALUADOR",
          description: "Acceso a realizar evaluaciones y consultar reportes asignados.",
          permissions_count: 3,
        },
      ]);
    } catch (error) {
      console.error("Error fetching roles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-accent-brand" />
          Roles del Sistema
        </h1>
        <p className="text-muted mt-1">
          Visualiza los roles disponibles y sus descripciones base.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-accent-brand mx-auto" />
          </div>
        ) : (
          roles.map((role) => (
            <Card
              key={role.id}
              className="bg-bg-elevated/50 border-border-subtle backdrop-blur-xl rounded-3xl overflow-hidden hover:border-brand-500/20 transition-all group"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border border-border-subtle ${
                      role.name === "ADMIN"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-brand-500/10 text-accent-brand"
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-xl font-bold">{role.name}</CardTitle>
                </div>
                <Badge className="bg-surface-tint text-muted border-border-subtle">
                  {role.permissions_count} Permisos
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  {role.description}
                </p>
                <div className="p-4 bg-surface-tint rounded-2xl border border-border-subtle flex items-start gap-3">
                  <Info className="w-4 h-4 text-subtle shrink-0 mt-0.5" />
                  <p className="text-[11px] text-subtle italic">
                    Este es un rol del sistema predefinido y no puede ser modificado manualmente para garantizar la estabilidad de la plataforma.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
