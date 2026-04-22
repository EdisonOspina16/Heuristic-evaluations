"use client"

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { EvaluationForm } from '@/features/evaluations/components/EvaluationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * Página principal para realizar una evaluación.
 * Extrae el ID de la plantilla de la URL y el ID del proyecto de los parámetros de búsqueda.
 */
export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const plantillaId = parseInt(params.id as string);
  const projectId = parseInt(searchParams.get('projectId') || '1');
  const userId = 2; // Mocked Evaluador ID

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
          userId={userId}
          onSuccess={() => {
            alert('Evaluación enviada con éxito');
            router.push('/dashboard');
          }}
        />
      </div>
    </div>
  );
}
