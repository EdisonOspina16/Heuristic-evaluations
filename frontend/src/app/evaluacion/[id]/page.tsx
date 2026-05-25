"use client"

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { EvaluationForm } from '@/features/evaluations/components/EvaluationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';

/**
 * Página principal para realizar una evaluación.
 * Extrae el ID de la plantilla de la URL y el ID del proyecto de los parámetros de búsqueda.
 */
export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const plantillaId = parseInt(params.id as string);
  const projectId = parseInt(searchParams.get('project_id') || '0');
  const evaluationId = searchParams.get('evaluation_id') ? parseInt(searchParams.get('evaluation_id') || '0') : undefined;
  const user = authService.getCurrentUser();

  if (!projectId) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Button>

        <EvaluationForm 
          plantillaId={plantillaId}
          projectId={projectId}
          userId={user?.id || 0}
          evaluationId={evaluationId}
          onSuccess={() => {
            alert('Evaluación enviada con éxito');
            router.push(`/project/${projectId}/evaluations`);
          }}
        />
      </div>
    </div>
  );
}
