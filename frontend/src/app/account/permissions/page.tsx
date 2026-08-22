"use client";

import React, { useEffect, useState } from "react";
import { 
  Key, 
  Search, 
  Loader2, 
  CheckCircle2, 
  User,
  ShieldAlert,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { authService } from "@/features/auth/services/auth.service";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function GlobalPermissionsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      const token = authService.getToken();
      const [usersRes, permsRes] = await Promise.all([
        axios.get(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/users/permissions/list`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setPermissions(permsRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user?.rol !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [router]);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    // Direct permissions codes
    const directCodes = user.direct_permissions?.map((p: any) => p.code) || [];
    setSelectedPermissions(directCodes);
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const token = authService.getToken();
      await axios.put(`${API_URL}/users/${selectedUser.id}/permissions`, selectedPermissions, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local user state
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, direct_permissions: permissions.filter(p => selectedPermissions.includes(p.code)) } : u));
      alert("Permisos actualizados correctamente");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-accent-brand" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Key className="w-8 h-8 text-accent-brand" />
            Permisos Globales
          </h1>
          <p className="text-muted mt-1">
            Asigna permisos directos a usuarios independientemente de su rol.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Selection */}
        <Card className="bg-bg-elevated/50 border-border-subtle backdrop-blur-xl rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-subtle" />
              Seleccionar Usuario
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <Input 
                placeholder="Buscar..." 
                className="pl-9 bg-surface-tint/50 border-border-subtle rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  selectedUser?.id === user.id 
                    ? "bg-brand-500/10 border border-brand-500/20" 
                    : "hover:bg-surface-tint border border-transparent"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                   selectedUser?.id === user.id ? "bg-brand-500 text-white" : "bg-surface-tint text-muted"
                }`}>
                  {user.nombre[0].toUpperCase()}
                </div>
                <div className="text-left overflow-hidden">
                  <p className={`text-sm font-medium truncate ${selectedUser?.id === user.id ? "text-accent-brand" : "text-foreground"}`}>
                    {user.nombre}
                  </p>
                  <p className="text-[10px] text-subtle truncate">{user.email}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Permissions Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedUser ? (
            <Card className="bg-bg-elevated/50 border-border-subtle border-dashed backdrop-blur-xl rounded-3xl p-20 text-center">
              <div className="w-16 h-16 bg-surface-tint/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-subtle" />
              </div>
              <p className="text-subtle">Selecciona un usuario para administrar sus permisos.</p>
            </Card>
          ) : (
            <Card className="bg-bg-elevated/50 border-border-subtle backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-border-subtle flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Permisos para <span className="text-accent-brand">{selectedUser.nombre}</span>
                  </CardTitle>
                  <p className="text-xs text-subtle mt-1">
                    Los cambios realizados aquí se aplicarán directamente como permisos globales.
                  </p>
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-500 text-white gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Cambios
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.map(perm => {
                    const isChecked = selectedPermissions.includes(perm.code);
                    const isFromRole = selectedUser.roles?.some((r: any) => 
                      r.permissions?.some((p: any) => p.code === perm.code)
                    );

                    return (
                      <div 
                        key={perm.code}
                        onClick={() => !isFromRole && togglePermission(perm.code)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked 
                            ? "bg-brand-500/5 border-brand-500/20 shadow-lg shadow-brand-500/5" 
                            : "bg-surface-tint/20 border-border-subtle hover:border-border-subtle"
                        } ${isFromRole ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isChecked ? "bg-brand-500 text-white" : "bg-surface-tint border border-border-subtle"
                        }`}>
                          {(isChecked || isFromRole) && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {perm.name}
                            {isFromRole && (
                              <Badge className="bg-amber-500/10 text-amber-400 text-[8px] font-bold py-0 h-4 uppercase">
                                Desde Rol
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-subtle mt-1">{perm.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-200/70 leading-relaxed">
                    Nota: Los permisos marcados como "Desde Rol" están asignados a través de los roles del usuario y no pueden desactivarse individualmente desde aquí. Debe cambiar el rol del usuario para modificarlos.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
