import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * Servicio encargado de gestionar la autenticación del usuario en el cliente.
 * Maneja llamadas a la API de autenticación y persistencia de tokens en localStorage.
 */
export const authService = {
  /**
   * Inicia sesión llamando al endpoint de login y guarda el token y los datos del usuario.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (response.data.access_token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },
  
  /**
   * Registra un nuevo usuario en la plataforma.
   */
  async register(nombre: string, email: string, password: string, rol: string = 'evaluador'): Promise<User> {
    const response = await axios.post(`${API_URL}/auth/register`, { nombre, email, password, rol });
    return response.data;
  },
  
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
  
  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  },
  
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }
};
