export interface Opcion {
  id: number;
  codigo: string;
  etiqueta: string;
  valor: number;
}

export interface Pregunta {
  id: number;
  texto: string;
  texto_en?: string;
  orden: number;
  tipo_respuesta: 'likert_5' | 'likert_9' | 'categorico';
  opciones: Opcion[];
}

export interface Dimension {
  id: number;
  nombre: string;
  orden: number;
  preguntas: Pregunta[];
}

export interface Plantilla {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface PlantillaEstructura extends Plantilla {
  dimensiones: Dimension[];
}

export interface RespuestaCreate {
  pregunta_id: number;
  valor_numerico?: number;
  opcion_id?: number;
  comentario?: string;
}

export interface EvaluacionCreate {
  evaluation_id?: number;
  plantilla_id: number;
  proyecto_id: number;
  evaluador_id: number;
  perfil?: string;
  estudios?: string;
  respuestas: RespuestaCreate[];
}

export interface EvaluationProgress {
  evaluation_id: number;
  plantilla_id: number;
  proyecto_id: number;
  evaluador_id: number;
  estado: string;
  progress_percentage: number;
  answered_count: number;
  total_questions: number;
  respuestas: RespuestaCreate[];
}
