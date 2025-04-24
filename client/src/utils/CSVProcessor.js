import Papa from 'papaparse';

/**
 * CSV处理工具类
 * 提供CSV文件的解析、生成和处理功能
 */
class CSVProcessor {
  /**
   * 解析CSV文件
   * @param {File} file - CSV文件对象
   * @returns {Promise} - 包含解析结果的Promise
   */
  static parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // 自动转换数据类型
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
   * 生成CSV内容
   * @param {Array} data - 数据数组
   * @returns {string} - CSV文本内容
   */
  static generateCSV(data) {
    return Papa.unparse(data);
  }
  
  /**
   * 识别公司名称列
   * @param {Array} headers - CSV表头数组
   * @returns {string} - 可能的公司名称列
   */
  static identifyCompanyColumn(headers) {
    // 尝试查找最可能的公司名称列
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
      'Customer',
      '公司',
      '公司名称',
      '客户',
      '账户'
    ];
    
    // 检查是否有完全匹配的列名
    for (const column of possibleColumns) {
      if (headers.includes(column)) {
        return column;
      }
    }
    
    // 检查是否有包含这些关键词的列名
    for (const column of possibleColumns) {
      const matchingHeader = headers.find(header => 
        header.toLowerCase().includes(column.toLowerCase())
      );
      
      if (matchingHeader) {
        return matchingHeader;
      }
    }
    
    // 默认返回第一列
    return headers[0];
  }
  
  /**
   * 获取CSV文件中的公司列表
   * @param {Array} data - 解析后的CSV数据
   * @param {string} companyColumn - 公司名称列
   * @returns {Array} - 公司名称数组
   */
  static extractCompanies(data, companyColumn) {
    return data
      .map(row => row[companyColumn])
      .filter(company => company && String(company).trim() !== '')
      .filter((company, index, self) => self.indexOf(company) === index); // 去重
  }
  
  /**
   * 合并研究结果到原始数据
   * @param {Array} originalData - 原始CSV数据
   * @param {Object} researchResults - 研究结果对象 (公司名称 → 结果)
   * @param {string} companyColumn - 公司名称列
   * @returns {Array} - 合并后的数据
   */
  static mergeResearchResults(originalData, researchResults, companyColumn) {
    return originalData.map(row => {
      const company = row[companyColumn];
      // 如果公司名称不存在或为空，则跳过
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
   * 下载CSV文件
   * @param {string} csvContent - CSV文本内容
   * @param {string} filename - 文件名
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
   * 验证CSV数据
   * @param {Array} data - CSV数据数组
   * @returns {Object} - 验证结果，包含错误信息和警告
   */
  static validateCSVData(data) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // 检查是否为空
    if (!data || data.length === 0) {
      result.isValid = false;
      result.errors.push('CSV数据为空');
      return result;
    }
    
    // 检查行数是否过多
    if (data.length > 1000) {
      result.warnings.push(`CSV包含${data.length}行数据，处理可能需要较长时间`);
    }
    
    // 检查是否包含公司名称列
    const firstRow = data[0];
    let hasCompanyColumn = false;
    
    for (const key in firstRow) {
      if (key.toLowerCase().includes('company') || 
          key.toLowerCase().includes('name') || 
          key.toLowerCase().includes('公司')) {
        hasCompanyColumn = true;
        break;
      }
    }
    
    if (!hasCompanyColumn) {
      result.warnings.push('未检测到明确的公司名称列，将使用第一列作为公司标识');
    }
    
    // 检查数据完整性
    const missingData = data.filter(row => {
      // 如果一行中所有字段都为空，则视为无效行
      return Object.values(row).every(value => 
        value === null || value === undefined || String(value).trim() === '');
    });
    
    if (missingData.length > 0) {
      result.warnings.push(`检测到${missingData.length}行空数据`);
    }
    
    return result;
  }
  
  /**
   * 预处理CSV数据，清理异常值
   * @param {Array} data - 原始CSV数据
   * @returns {Array} - 预处理后的数据
   */
  static preprocessCSVData(data) {
    // 移除完全空行
    const filteredData = data.filter(row => {
      return Object.values(row).some(value => 
        value !== null && value !== undefined && String(value).trim() !== '');
    });
    
    // 清理字符串字段中的前后空格
    return filteredData.map(row => {
      const cleanedRow = {};
      
      for (const key in row) {
        // 如果是字符串，则清理前后空格
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