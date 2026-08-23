"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Mail, Lock, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";
import { navigateAfterAuth } from "@/lib/google-translate";

/**
 * Página de registro de nuevos usuarios.
 * Maneja el flujo multi-paso para crear una cuenta (Nombre -> Email -> Contraseña).
 */
export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step === 1 && formData.nombre) setStep(2);
    else if (step === 2 && formData.email) setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.password) return;
    
    setLoading(true);
    setError("");

    try {
      await authService.register(formData.nombre, formData.email, formData.password);
      // Auto-login after register
      await authService.login(formData.email, formData.password);
      navigateAfterAuth("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Error al registrarse. Inténtalo de nuevo."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Creative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px]" />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-purple-400/20 blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10 p-4 sm:p-0"
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-800 shadow-2xl rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-0 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 relative bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Logo" fill sizes="64px" className="object-cover opacity-80" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Crea tu cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Únete a nuestra plataforma de evaluación heurística
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-8 pt-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full" />
              <motion.div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full"
                data-testid="registration-progress"
                initial={{ width: "0%" }}
                animate={{ width: `${((step - 1) / 2) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 ${
                    step >= i 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" 
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  {step > i ? <CheckCircle2 className="w-4 h-4" /> : i}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div role="alert" className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}

            <div className="relative overflow-hidden min-h-[120px]">
              {/* Step 1: Name */}
              {step === 1 && (
                <motion.div
                  data-testid="register-step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ¿Cómo te llamas?
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!formData.nombre}
                    className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    Continuar
                  </button>
                </motion.div>
              )}

              {/* Step 2: Email */}
              {step === 2 && (
                <motion.div
                  data-testid="register-step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tu correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      autoFocus
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                      placeholder="juan@ejemplo.com"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!formData.email}
                      className="flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Password */}
              {step === 3 && (
                <motion.div
                  data-testid="register-step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Crea una contraseña segura
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      autoFocus
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.password || loading}
                      className="flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                      ) : (
                        "Finalizar Registro"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </form>
          
          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
