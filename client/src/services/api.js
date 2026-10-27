/**
 * Centralized API Client for CoursePilot
 * Preconfigured with credentials for HttpOnly cookie authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Internal request wrapper with credentials and unified error parsing
   */
  async request(endpoint, options = {}) {
    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (options.params && typeof options.params === 'object') {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // Ensure browser transmits and accepts HttpOnly cookies across origins
      credentials: 'include',
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage =
          (data && typeof data === 'object' && data.error && data.error.message) ||
          (data && typeof data === 'object' && data.message) ||
          response.statusText ||
          `HTTP Error ${response.status}`;

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status === undefined) {
        // Network failure or CORS block
        const networkError = new Error(
          `Unable to connect to CoursePilot backend at ${this.baseUrl}. Please check that the server is running.`
        );
        networkError.status = 0;
        networkError.isNetworkError = true;
        throw networkError;
      }
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // --- Auth API ---
  async register(userData) {
    return this.post('/api/auth/register', userData);
  }

  async login(credentials) {
    return this.post('/api/auth/login', credentials);
  }

  async getMe() {
    return this.get('/api/auth/me');
  }

  async logout() {
    return this.post('/api/auth/logout');
  }

  // --- Assignment API ---
  async getAssignments(params = {}) {
    return this.get('/api/assignments', { params });
  }

  async getAssignmentById(id) {
    return this.get(`/api/assignments/${id}`);
  }

  async createAssignment(data) {
    return this.post('/api/assignments', data);
  }

  async updateAssignment(id, data) {
    return this.patch(`/api/assignments/${id}`, data);
  }

  async completeAssignment(id) {
    return this.patch(`/api/assignments/${id}/complete`);
  }

  async reopenAssignment(id) {
    return this.patch(`/api/assignments/${id}/reopen`);
  }

  async deleteAssignment(id) {
    return this.delete(`/api/assignments/${id}`);
  }

  // --- Health API ---
  async checkHealth() {
    return this.get('/api/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
