const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5001;

// 中间件
app.use(cors({
    origin: 'http://localhost:3000', // 允许前端域访问
    credentials: true, // 如果需要携带cookies
    methods: ['GET', 'POST'] // 允许的HTTP方法
  }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// 配置文件上传
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 限制10MB
});

// 上传文件端点
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件被上传' });
  }
  
  res.json({
    success: true,
    filename: req.file.filename,
    originalname: req.file.originalname
  });
});

// OpenRouter API封装
async function callAIResearch(company, fields, apiKey) {
  try {
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    // 构建提示词
    const prompt = `请针对公司 "${company}" 进行研究，提供以下信息:

${fields.map(field => `- ${field}`).join('\n')}

请以CSV格式提供结果，每个字段一行，格式为"字段名,值"。如无法找到信息，请标记为"Unknown"。
请确保回复仅包含CSV格式的数据，无需任何额外的解释或前言。`;

    // 调用OpenRouter API，使用DeepSeek模型
    const response = await axios.post(openRouterUrl, {
      model: 'perplexity/sonar-pro',
      messages: [
        { role: 'system', content: '你是一个专业的商业研究助手，擅长查找和整理公司信息。提供准确、简洁的回应，仅包含请求的信息。对于无法确认的信息，明确标记为"Unknown"。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // 低温度以获得更确定性的回答
      max_tokens: 1500
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000', // 本地开发环境
        'X-Title': 'Company Research Tool'
      }
    });

    // 处理AI响应
    const aiResponse = response.data.choices[0].message.content.trim();
    
    // 解析CSV格式的响应
    const lines = aiResponse.split('\n');
    const results = {};
    
    for (const line of lines) {
      // 处理第一个逗号作为分隔符
      const firstCommaIndex = line.indexOf(',');
      if (firstCommaIndex !== -1) {
        const key = line.substring(0, firstCommaIndex).trim();
        const value = line.substring(firstCommaIndex + 1).trim();
        results[key] = value;
      }
    }
    
    return results;
  } catch (error) {
    console.error('AI API调用错误:', error.message);
    
    // 提供更详细的错误信息
    if (error.response) {
      console.error('API响应错误:', error.response.data);
      throw new Error(`API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('无法从API获得响应');
    } else {
      throw error;
    }
  }
}

// 研究API端点
app.post('/api/research', async (req, res) => {
  try {
    const { company, fields, apiKey } = req.body;
    
    if (!company || !fields || !fields.length || !apiKey) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 调用AI进行研究
    const results = await callAIResearch(company, fields, apiKey);
    
    res.json({ success: true, company, results });
  } catch (error) {
    console.error('研究API错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 处理CSV文件分析的端点
app.post('/api/analyze-csv', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有文件被上传' });
    }
    
    // 读取上传的CSV文件
    const filePath = path.join(__dirname, req.file.path);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 分析逻辑可以在这里添加
    // 例如，检测列名，推测可能的公司名称列等
    
    res.json({
      success: true,
      filename: req.file.filename,
      originalname: req.file.originalname,
      fileContent: fileContent.substring(0, 1000) // 仅返回前1000个字符用于预览
    });
    
    // 清理临时文件
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('CSV分析错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 批量处理请求端点
app.post('/api/batch-research', async (req, res) => {
  try {
    const { companies, fields, apiKey } = req.body;
    
    if (!companies || !companies.length || !fields || !fields.length || !apiKey) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 创建一个结果数组
    const results = [];
    
    // 限制并发请求数量
    const concurrencyLimit = 3;
    let activeRequests = 0;
    let completedRequests = 0;
    
    // 使用Promise处理并发请求
    await new Promise((resolve, reject) => {
      const processQueue = async () => {
        if (completedRequests >= companies.length) {
          return resolve();
        }
        
        if (activeRequests < concurrencyLimit && completedRequests + activeRequests < companies.length) {
          const index = completedRequests + activeRequests;
          const company = companies[index];
          
          activeRequests++;
          
          try {
            const result = await callAIResearch(company, fields, apiKey);
            results.push({ company, results: result });
          } catch (error) {
            results.push({ company, error: error.message });
          }
          
          activeRequests--;
          completedRequests++;
          
          // 继续处理队列
          processQueue();
        }
        
        // 如果还有未处理的请求但已达到并发限制，设置定时器稍后再检查
        if (completedRequests + activeRequests < companies.length) {
          setTimeout(processQueue, 100);
        }
      };
      
      // 启动初始处理
      for (let i = 0; i < Math.min(concurrencyLimit, companies.length); i++) {
        processQueue();
      }
    });
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('批量研究错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 默认路由 - 服务React前端
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

module.exports = app; // 用于测试