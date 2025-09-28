const API_BASE_URL = 'http://localhost:5001/api';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return this.handleResponse(response);
  }

  async register(userData: any) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return this.handleResponse(response);
  }

  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateProfile(profileData: any) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ profile: profileData })
    });
    return this.handleResponse(response);
  }

  // Interviews
  async getInterviews() {
    const response = await fetch(`${API_BASE_URL}/interviews`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getInterview(id: string) {
    const response = await fetch(`${API_BASE_URL}/interviews/${id}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async createInterview(interviewData: any) {
    const response = await fetch(`${API_BASE_URL}/interviews`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(interviewData)
    });
    return this.handleResponse(response);
  }

  async uploadResume(interviewId: string, file: File) {
    const formData = new FormData();
    formData.append('resume', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}/upload-resume`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  async startInterview(interviewId: string) {
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}/start`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async submitResponse(interviewId: string, questionIndex: number, response: string) {
    const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}/respond`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ questionIndex, response })
    });
    return this.handleResponse(res);
  }

  async pauseInterview(interviewId: string) {
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}/pause`, {
      method: 'PATCH',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getInterviewees() {
    const response = await fetch(`${API_BASE_URL}/interviews/users/interviewees`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getCompletedInterviews() {
    const response = await fetch(`${API_BASE_URL}/interviews/completed`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return this.handleResponse(response);
    } catch (error) {
      throw new Error('Backend server is not responding');
    }
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  }
}

export default new ApiService();