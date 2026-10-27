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
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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
      if (!err.status) {
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

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Health Check helper
   * @returns {Promise<{ status: string, service: string, timestamp: string, uptime: number, environment: string, database: { status: string, ready: boolean } }>}
   */
  async checkHealth() {
    return this.get('/api/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
