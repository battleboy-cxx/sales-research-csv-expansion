import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

class ResearchService {
  /**
   * 发送研究请求到后端
   * @param {string} company - 公司名称
   * @param {Array} fields - 要研究的字段列表
   * @param {string} apiKey - OpenRouter API密钥
   * @returns {Promise} - 返回结果的Promise
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
      console.error('研究服务错误:', error);
      
      // 格式化错误信息以便前端使用
      if (error.response) {
        throw new Error(error.response.data.error || '服务器错误');
      } else if (error.request) {
        throw new Error('无法连接到服务器');
      } else {
        throw new Error('请求配置错误');
      }
    }
  }
  
  /**
   * 批量处理多个公司
   * @param {Array} companies - 公司名称数组
   * @param {Array} fields - 要研究的字段列表
   * @param {string} apiKey - OpenRouter API密钥
   * @param {Function} progressCallback - 进度回调函数
   * @returns {Promise} - 包含所有结果的Promise
   */
  static async batchResearch(companies, fields, apiKey, progressCallback) {
    // 针对大量公司的处理，使用后端批处理接口
    if (companies.length > 10) {
      try {
        const response = await axios.post(`${API_URL}/batch-research`, {
          companies,
          fields,
          apiKey
        });
        
        return response.data.results;
      } catch (error) {
        console.error('批量研究服务错误:', error);
        throw new Error(error.response?.data?.error || '批量处理失败');
      }
    }
    
    // 对于少量公司，使用前端循环处理
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
   * 上传CSV文件
   * @param {File} file - CSV文件
   * @returns {Promise} - 上传结果的Promise
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
      console.error('文件上传错误:', error);
      throw new Error('文件上传失败');
    }
  }
  
  /**
   * 分析CSV文件
   * @param {File} file - CSV文件
   * @returns {Promise} - 分析结果的Promise
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
      console.error('CSV分析错误:', error);
      throw new Error('CSV分析失败');
    }
  }
  
  /**
   * 将研究结果合并回原始CSV数据
   * @param {Array} originalData - 原始CSV数据数组
   * @param {Array} researchResults - 研究结果数组
   * @param {string} companyField - 公司名称的字段名
   * @returns {Array} - 合并后的数据数组
   */
  static mergeResults(originalData, researchResults, companyField) {
    // 创建研究结果的查找表
    const resultMap = {};
    researchResults.forEach(result => {
      resultMap[result.company] = result;
    });
    
    // 合并数据
    return originalData.map(row => {
      const company = row[companyField];
      const researchData = resultMap[company] || {};
      
      // 移除结果中的元数据字段
      const { company: _, status: __, error: ___, ...data } = researchData;
      
      return {
        ...row,
        ...data
      };
    });
  }
  
  /**
   * 检查服务器健康状态
   * @returns {Promise} - 健康检查结果
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('健康检查错误:', error);
      throw new Error('服务器连接失败');
    }
  }
}

export default ResearchService;