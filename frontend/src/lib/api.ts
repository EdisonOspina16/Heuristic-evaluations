import axios from 'axios';

/**
 * Instancia global de Axios configurada con la URL base del backend.
 * Utilizada para realizar todas las peticiones HTTP desde los servicios del frontend.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
