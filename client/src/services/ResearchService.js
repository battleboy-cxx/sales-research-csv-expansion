import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

class ResearchService {
  /**
   * Send research request to backend
   * @param {string} company - Company name
   * @param {Array} fields - List of fields to research
   * @param {string} apiKey - OpenRouter API key
   * @returns {Promise} - Promise with results
   */
  static async researchCompany(company, fields, apiKey) {
    try {
      const response = await axios.post(`${API_URL}/research`, {
        company,
        fields,
        apiKey
      });
      
      return response.data;
    } catch (error) {
      console.error('Research service error:', error);
      
      // Format error message for frontend use
      if (error.response) {
        throw new Error(error.response.data.error || 'Server error');
      } else if (error.request) {
        throw new Error('Could not connect to server');
      } else {
        throw new Error('Request configuration error');
      }
    }
  }
  
  /**
   * Process multiple companies in batch
   * @param {Array} companies - Array of company names
   * @param {Array} fields - List of fields to research
   * @param {string} apiKey - OpenRouter API key
   * @param {Function} progressCallback - Progress callback function
   * @returns {Promise} - Promise with all results
   */
  static async batchResearch(companies, fields, apiKey, progressCallback) {
    // For large number of companies, use backend batch processing
    if (companies.length > 10) {
      try {
        const response = await axios.post(`${API_URL}/batch-research`, {
          companies,
          fields,
          apiKey
        });
        
        return response.data.results;
      } catch (error) {
        console.error('Batch research service error:', error);
        throw new Error(error.response?.data?.error || 'Batch processing failed');
      }
    }
    
    // For small number of companies, process in frontend loop
    const results = [];
    let completed = 0;
    
    for (const company of companies) {
      try {
        const result = await this.researchCompany(company, fields, apiKey);
        results.push({
          company,
          ...result.results,
          status: 'success'
        });
      } catch (error) {
        results.push({
          company,
          error: error.message,
          status: 'error'
        });
      }
      
      completed++;
      if (progressCallback) {
        progressCallback(completed / companies.length);
      }
    }
    
    return results;
  }
  
  /**
   * Upload CSV file
   * @param {File} file - CSV file
   * @returns {Promise} - Promise with upload result
   */
  static async uploadCSV(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('File upload failed');
    }
  }
  
  /**
   * Analyze CSV file
   * @param {File} file - CSV file
   * @returns {Promise} - Promise with analysis result
   */
  static async analyzeCSV(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_URL}/analyze-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('CSV analysis error:', error);
      throw new Error('CSV analysis failed');
    }
  }
  
  /**
   * Merge research results back into original CSV data
   * @param {Array} originalData - Original CSV data array
   * @param {Array} researchResults - Research results array
   * @param {string} companyField - Company name field
   * @returns {Array} - Merged data array
   */
  static mergeResults(originalData, researchResults, companyField) {
    // Create lookup table for research results
    const resultMap = {};
    researchResults.forEach(result => {
      resultMap[result.company] = result;
    });
    
    // Merge data
    return originalData.map(row => {
      const company = row[companyField];
      const researchData = resultMap[company] || {};
      
      // Remove metadata fields from results
      const { company: _, status: __, error: ___, ...data } = researchData;
      
      return {
        ...row,
        ...data
      };
    });
  }
  
  /**
   * Check server health status
   * @returns {Promise} - Health check result
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw new Error('Failed to connect to server');
    }
  }
}

export default ResearchService;