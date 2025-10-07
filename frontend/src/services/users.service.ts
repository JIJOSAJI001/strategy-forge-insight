const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class UsersService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await (await import("firebase/auth")).getIdToken((await import("@/lib/firebase")).auth.currentUser!, true).catch(() => null);
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  }

  async getCount(): Promise<{ count: number }> {
    return this.request('/api/users/admin/count');
  }

  async list(): Promise<any[]> {
    return this.request('/api/users/admin');
  }

  async create(payload: { email: string; password?: string; displayName?: string; role?: 'admin' | 'retail'; permissions?: Record<string, any>; }): Promise<{ uid: string }> {
    return this.request('/api/users/admin', { method: 'POST', body: JSON.stringify(payload) });
  }

  async update(payload: { uid: string; email?: string; displayName?: string; role?: 'admin' | 'retail'; permissions?: Record<string, any>; active?: boolean; }): Promise<{ uid: string }> {
    return this.request('/api/users/admin', { method: 'PUT', body: JSON.stringify(payload) });
  }

  async delete(uid: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/users/admin/${uid}`, { method: 'DELETE' });
  }

  async deactivate(uid: string): Promise<{ uid: string; active: boolean }> {
    return this.request(`/api/users/admin/${uid}/deactivate`, { method: 'POST' });
  }

  async resetPassword(uid: string): Promise<{ resetLink: string }> {
    return this.request(`/api/users/admin/${uid}/reset-password`, { method: 'POST' });
  }

  async revokeSessions(uid: string): Promise<{ revoked: boolean }> {
    return this.request(`/api/users/admin/${uid}/revoke-sessions`, { method: 'POST' });
  }
}

export const usersService = new UsersService();

