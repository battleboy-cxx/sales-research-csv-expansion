import Papa from 'papaparse';

/**
 * CSV Processing Utility Class
 * Provides CSV file parsing, generation and processing functionality
 */
class CSVProcessor {
  /**
   * Parse CSV file
   * @param {File} file - CSV file object
   * @returns {Promise} - Promise with parsing results
   */
  static parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Automatically convert data types
        complete: (results) => {
          resolve({
            data: results.data,
            headers: results.meta.fields,
            errors: results.errors,
            rowCount: results.data.length
          });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
  
  /**
   * Generate CSV content
   * @param {Array} data - Data array
   * @returns {string} - CSV text content
   */
  static generateCSV(data) {
    return Papa.unparse(data);
  }
  
  /**
   * Identify company name column
   * @param {Array} headers - CSV headers array
   * @returns {string} - Likely company name column
   */
  static identifyCompanyColumn(headers) {
    // Try to find most likely company name column
    const possibleColumns = [
      'Company',
      'Company Name',
      'CompanyName',
      'Account',
      'Account Name',
      'AccountName',
      'Organization',
      'Business',
      'Client',
      'Customer'
    ];
    
    // Check for exact column name matches
    for (const column of possibleColumns) {
      if (headers.includes(column)) {
        return column;
      }
    }
    
    // Check for column names containing these keywords
    for (const column of possibleColumns) {
      const matchingHeader = headers.find(header => 
        header.toLowerCase().includes(column.toLowerCase())
      );
      
      if (matchingHeader) {
        return matchingHeader;
      }
    }
    
    // Default to first column
    return headers[0];
  }
  
  /**
   * Get list of companies from CSV file
   * @param {Array} data - Parsed CSV data
   * @param {string} companyColumn - Company name column
   * @returns {Array} - Array of company names
   */
  static extractCompanies(data, companyColumn) {
    return data
      .map(row => row[companyColumn])
      .filter(company => company && String(company).trim() !== '')
      .filter((company, index, self) => self.indexOf(company) === index); // Remove duplicates
  }
  
  /**
   * Merge research results into original data
   * @param {Array} originalData - Original CSV data
   * @param {Object} researchResults - Research results object (company name → result)
   * @param {string} companyColumn - Company name column
   * @returns {Array} - Merged data
   */
  static mergeResearchResults(originalData, researchResults, companyColumn) {
    return originalData.map(row => {
      const company = row[companyColumn];
      // Skip if company name doesn't exist or is empty
      if (!company || String(company).trim() === '') {
        return row;
      }
      
      const results = researchResults[company] || {};
      
      return {
        ...row,
        ...results
      };
    });
  }
  
  /**
   * Download CSV file
   * @param {string} csvContent - CSV text content
   * @param {string} filename - File name
   */
  static downloadCSV(csvContent, filename = 'enriched_companies.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Validate CSV data
   * @param {Array} data - CSV data array
   * @returns {Object} - Validation result with errors and warnings
   */
  static validateCSVData(data) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Check if empty
    if (!data || data.length === 0) {
      result.isValid = false;
      result.errors.push('CSV data is empty');
      return result;
    }
    
    // Check if too many rows
    if (data.length > 1000) {
      result.warnings.push(`CSV contains ${data.length} rows, processing may take longer`);
    }
    
    // Check if contains company name column
    const firstRow = data[0];
    let hasCompanyColumn = false;
    
    for (const key in firstRow) {
      if (key.toLowerCase().includes('company') || 
          key.toLowerCase().includes('name')) {
        hasCompanyColumn = true;
        break;
      }
    }
    
    if (!hasCompanyColumn) {
      result.warnings.push('No clear company name column detected, will use first column as company identifier');
    }
    
    // Check data completeness
    const missingData = data.filter(row => {
      // Consider row invalid if all fields are empty
      return Object.values(row).every(value => 
        value === null || value === undefined || String(value).trim() === '');
    });
    
    if (missingData.length > 0) {
      result.warnings.push(`Detected ${missingData.length} empty data rows`);
    }
    
    return result;
  }
  
  /**
   * Preprocess CSV data, clean abnormal values
   * @param {Array} data - Original CSV data
   * @returns {Array} - Preprocessed data
   */
  static preprocessCSVData(data) {
    // Remove completely empty rows
    const filteredData = data.filter(row => {
      return Object.values(row).some(value => 
        value !== null && value !== undefined && String(value).trim() !== '');
    });
    
    // Clean whitespace from string fields
    return filteredData.map(row => {
      const cleanedRow = {};
      
      for (const key in row) {
        // If string, clean whitespace
        if (typeof row[key] === 'string') {
          cleanedRow[key] = row[key].trim();
        } else {
          cleanedRow[key] = row[key];
        }
      }
      
      return cleanedRow;
    });
  }
}

export default CSVProcessor;