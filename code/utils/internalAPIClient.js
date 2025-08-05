const axios = require('axios');

// Internal API client that automatically adds secret key
class InternalAPIClient {
  constructor() {
    this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
    this.secretKey = process.env.API_SECRET;
  }

  // Helper method to add secret key to request
  addSecretKey(data = {}) {
    return {
      ...data,
      secret_key: this.secretKey
    };
  }

  // GET request with automatic secret key (only for private endpoints)
  async get(endpoint, params = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'node-internal-api-client'
      };

      // Dodaj secret key samo za privatne rute
      const isPrivateRoute = this.isPrivateRoute(endpoint);
      const finalParams = isPrivateRoute ? this.addSecretKey(params) : params;
      
      if (isPrivateRoute) {
        headers['x-api-key'] = this.secretKey;
      }

      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params: finalParams,
        headers: headers
      });
      return response.data;
    } catch (error) {
      console.error(`Internal API GET error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // POST request with automatic secret key (only for private endpoints)
  async post(endpoint, data = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'node-internal-api-client'
      };

      // Dodaj secret key samo za privatne rute
      const isPrivateRoute = this.isPrivateRoute(endpoint);
      const finalData = isPrivateRoute ? this.addSecretKey(data) : data;
      
      if (isPrivateRoute) {
        headers['x-api-key'] = this.secretKey;
      }

      const response = await axios.post(`${this.baseURL}${endpoint}`, finalData, { headers });
      return response.data;
    } catch (error) {
      console.error(`Internal API POST error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Provjeri da li je ruta privatna (zahtjeva secret key)
  isPrivateRoute(endpoint) {
    // Svi API endpoint-i zahtevaju ključ osim specifičnih izuzetaka
    const publicRoutes = [
      '/api/reviews/',
      '/api/submit-reservation',
      '/api/check-availability'
    ];
    
    // Ako endpoint počinje sa /api/ i nije u public routes, onda je privatan
    if (endpoint.startsWith('/api/')) {
      return !publicRoutes.some(route => endpoint.includes(route));
    }
    
    return false;
  }

  // PUT request with automatic secret key (only for private endpoints)
  async put(endpoint, data = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'node-internal-api-client'
      };

      const isPrivateRoute = this.isPrivateRoute(endpoint);
      const finalData = isPrivateRoute ? this.addSecretKey(data) : data;
      
      if (isPrivateRoute) {
        headers['x-api-key'] = this.secretKey;
      }

      const response = await axios.put(`${this.baseURL}${endpoint}`, finalData, { headers });
      return response.data;
    } catch (error) {
      console.error(`Internal API PUT error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // DELETE request with automatic secret key (only for private endpoints)
  async delete(endpoint, params = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'node-internal-api-client'
      };

      const isPrivateRoute = this.isPrivateRoute(endpoint);
      const finalParams = isPrivateRoute ? this.addSecretKey(params) : params;
      
      if (isPrivateRoute) {
        headers['x-api-key'] = this.secretKey;
      }

      const response = await axios.delete(`${this.baseURL}${endpoint}`, {
        params: finalParams,
        headers: headers
      });
      return response.data;
    } catch (error) {
      console.error(`Internal API DELETE error for ${endpoint}:`, error.message);
      throw error;
    }
  }
}

// Export singleton instance
const internalAPI = new InternalAPIClient();

module.exports = { internalAPI, InternalAPIClient };
