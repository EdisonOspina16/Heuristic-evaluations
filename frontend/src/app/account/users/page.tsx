"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  UserCheck, 
  UserMinus, 
  Shield, 
  Mail,
  Loader2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { authService } from "@/features/auth/services/auth.service";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "EVALUADOR"
  });

  const fetchUsers = async () => {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = authService.getToken();
      await axios.post(`${API_URL}/users/?role_name=${newUser.rol}`, {
        nombre: newUser.nombre,
        email: newUser.email,
        password: newUser.password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setNewUser({ nombre: "", email: "", password: "", rol: "EVALUADOR" });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al crear usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const token = authService.getToken();
      await axios.patch(`${API_URL}/users/${userId}/status?active=${!currentStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al actualizar estado");
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      const token = authService.getToken();
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al eliminar usuario");
    }
  };

  const filteredUsers = users.filter(user => 
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-accent-brand" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted mt-1">
            Administra los usuarios del sistema, sus roles y estados.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white gap-2 h-11 px-6 rounded-xl transition-all shadow-lg shadow-brand-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Modal Crear Usuario */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-bg-elevated border border-border-subtle rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-subtle">
                <h2 className="text-xl font-bold text-foreground">Crear Nuevo Usuario</h2>
                <p className="text-sm text-subtle">Completa los datos para registrar al nuevo miembro.</p>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted uppercase">Nombre Completo</label>
                  <Input 
                    required
                    placeholder="Fullname"
                    className="bg-surface-tint border-border-subtle rounded-xl"
                    value={newUser.nombre}
                    onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted uppercase">Email</label>
                  <Input 
                    required
                    type="email"
                    placeholder="user@ejemplo.com"
                    className="bg-surface-tint border-border-subtle rounded-xl"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted uppercase">Contraseña</label>
                  <Input 
                    required
                    type="password"
                    placeholder="••••••••"
                    className="bg-surface-tint border-border-subtle rounded-xl"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted uppercase">Rol</label>
                  <select 
                    className="w-full bg-surface-tint border border-border-subtle rounded-xl p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-500/20"
                    value={newUser.rol}
                    onChange={(e) => setNewUser({...newUser, rol: e.target.value})}
                  >
                    <option value="EVALUADOR">Evaluador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl text-muted hover:text-foreground"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-600/20"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Usuario"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Card className="bg-bg-elevated/50 border-border-subtle backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border-subtle pb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
            <Input 
              placeholder="Buscar por nombre o email..." 
              className="pl-10 bg-surface-tint/50 border-border-subtle rounded-xl focus:ring-brand-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-subtle border-b border-border-subtle">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha Registro</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-accent-brand mx-auto" />
                      <p className="text-subtle mt-4 text-sm">Cargando usuarios...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-subtle">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-surface-tint transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-tint flex items-center justify-center border border-border-subtle text-accent-brand font-bold">
                            {user.nombre[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{user.nombre}</p>
                            <p className="text-xs text-subtle flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className={cn(
                            "w-4 h-4",
                            user.roles?.[0]?.name === "ADMIN" ? "text-amber-400" : "text-accent-brand"
                          )} />
                          <span className="text-sm text-muted">
                            {user.roles?.[0]?.name || "EVALUADOR"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold border-0",
                          user.active 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-red-500/10 text-red-400"
                        )}>
                          {user.active ? "ACTIVO" : "INACTIVO"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-subtle">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-8 w-8 rounded-lg transition-colors",
                              user.active ? "text-red-400 hover:bg-red-400/10" : "text-emerald-400 hover:bg-emerald-400/10"
                            )}
                            onClick={() => toggleUserStatus(user.id, user.active)}
                            title={user.active ? "Desactivar" : "Activar"}
                          >
                            {user.active ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-muted hover:text-foreground hover:bg-surface-tint"
                            onClick={() => deleteUser(user.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-muted hover:text-foreground hover:bg-surface-tint"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
