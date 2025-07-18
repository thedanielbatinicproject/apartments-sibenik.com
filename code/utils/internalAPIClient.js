const axios = require('axios');

// Internal API client that automatically adds secret key
class InternalAPIClient {
  constructor() {
    this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
    this.secretKey = process.env.SECRET_API_KEY;
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
        'Content-Type': 'application/json'
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
        'Content-Type': 'application/json'
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
    const privateRoutes = [
      '/api/solar-control',
      '/api/backyard-management'
    ];
    
    return privateRoutes.some(route => endpoint.startsWith(route));
  }

  // PUT request with automatic secret key (only for private endpoints)
  async put(endpoint, data = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json'
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
        'Content-Type': 'application/json'
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
