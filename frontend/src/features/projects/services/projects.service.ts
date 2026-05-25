import axios from 'axios';
import { authService } from '@/features/auth/services/auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Project {
  id: number;
  nombre: string;
  descripcion?: string;
  cliente?: string;
  creado_por: number;
  created_at: string;
  evaluadores?: any[];
}

export interface ProjectAssignment {
  id: number;
  evaluator_id: number;
  evaluator_name: string;
  evaluator_email: string;
  project_id: number;
  allowed_evaluation_types: string[];
  role: string;
}

export const projectsService = {
  async getProjects(): Promise<Project[]> {
    const token = authService.getToken();
    const response = await axios.get(`${API_URL}/projects/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async createProject(data: { nombre: string; descripcion?: string; cliente?: string; evaluadores_ids?: number[] }): Promise<Project> {
    const token = authService.getToken();
    const response = await axios.post(`${API_URL}/projects/`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getProject(id: number): Promise<Project> {
    const token = authService.getToken();
    const response = await axios.get(`${API_URL}/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async deleteProject(id: number): Promise<void> {
    const token = authService.getToken();
    await axios.delete(`${API_URL}/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async getAssignments(projectId: number): Promise<ProjectAssignment[]> {
    const token = authService.getToken();
    const response = await axios.get(`${API_URL}/projects/${projectId}/assignments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async saveAssignment(projectId: number, data: { evaluator_id: number; allowed_evaluation_types: string[]; role: string }): Promise<ProjectAssignment> {
    const token = authService.getToken();
    const response = await axios.post(`${API_URL}/projects/${projectId}/assignments`, {
      ...data,
      project_id: projectId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
