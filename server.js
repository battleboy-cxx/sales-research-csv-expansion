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
    const prompt = `Please do research on this "${company}", provide the following information:
      ${fields.map(field => `- ${field}).join('\n'`)}
      Please provide the results in CSV format, with each field on a separate line and the format being "Field Name, Value". If no information can be found, please mark it as "Unknown".
Please ensure that your reply only contains the CSV-formatted data and no additional explanations or preambles are included.`;

    // 调用OpenRouter API，使用DeepSeek模型
    const response = await axios.post(openRouterUrl, {
      model: 'perplexity/sonar-pro',
      messages: [
        { role: 'system', content: `You are a professonal analyst on company/industry report. Please help me populate company data based on the following data structure. I may provide some existing fields for the company.

## Important Notes:

1. Do not make assumptions about any data points
2. If information cannot be verified through reliable sources, please mark as "Unknown"
3. For all research-based fields, please provide the source URL or reference
4. For technical stack information, use BuiltWith.com and Wappalyzer and as the primary source
5. Only include information that can be verified through public sources
6. Please provide the result in CSV format, with each field on a separate line in the format "Field Name, Value".
7. Please ensure that the response only contains data in CSV format, without any additional explanations or prefaces.

## Data Fields Candidates, Add each filed as an additional to the spreadsheet
| Field Name                                | Description                                                  | Example Value                                     | Collection Method                                            |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------ |
| Leads, Name                            | Sales representative responsible for the account             | **Alden Morse**                                   | If not Presets, ignore this field                                                     |
| Company name                             | Company official name             | Zenni Optical                                   |                                                     |
| Website                                   | Company's official website URL                               | https://www.zennioptical.com                          | Company profile/market research                                                      |
| Billing State/Province                    | Location of company's billing address                        | Virginia                                          | Use https://builtwith.com/meta.<br />Like: visit https://builtwith.com/meta/zennioptical.com and search Location in pagesource                                                      |
| Current E-Commerce Platform               | Current e-commerce solution in use                           | Shopify Plan Advanced/Basic                       | Presets                                                      |
| Company Established Year                  | Year when company was founded                                | 1926                                              | Company website/registration                                 |
| Industry/Vertical                         | According to The Global Industry Classification Standard (GICS®), accurate to sub-Industries |                                                   | Company profile/market research                              |
| Business Coverage                         | B2B, B2C, or Both                                            |                                                   | Company analysis                                             |
| Company Revenue                           | Annual revenue figures, Provide the original website or news source |                                                   | Financial reports/market research                            |
| Total Employee                            | Number of employees                                          | 2000                                              | Company profile/LinkedIn                                     |
| Total Customer Service Agent              | Number of Customer Service Agent(*)                             | 50                                                | Company profile/company analysis/LinkedIn                    |
| Customer Service Challenges               | Key business issues faced by customer service team/department, provide the original website or news source link |                                                   | Market research/news analysis                                |
| Customer Service Technology Challenges    | Technical issues or needs from customer service team/department, Provide the original website or news source link |                                                   | Technical analysis/research                                  |
| Competition Landscape                     | Overview of competitors, Provide the original website or news source link |                                                   | Market research/industry analysis                            |
| Rank and Market %                         | Market position and share, Provide the original website or news source link | 30%                                               | Market research/industry reports                             |
| Key Updates                               | Recent significant news (last 6 months) - 3-5 bullets, prioritize the update related to customer service. |                                                   | News monitoring/press releases                               |
| Financial Status                          | Funding, challenges, bankruptcy info                         |                                                   | Financial news/reports                                       |
| PE Backing                                | Private Equity investment status，Provide the original website or news source link |                                                   | Investment news/company info                                 |
| eCommerce Platform                        | Current ecommerce platform                                   | Salesforce, Shopify, SAP Commerce Cloud           | Use https://builtwith.com/.<br />Like: visit https://builtwith.com/zennioptical.com and search eCommerce in pagesource |
| Current Customer Service Ticketing System | Ticketing System in use                                      | Zendesk, ServiceNow                               | Use https://builtwith.com/.<br />Like: visit https://builtwith.com/zennioptical.com and search current ticketing in pagesource |
| LiveChat Tool                             | Current LiveChat tool                                        | Zendesk, ADA, Freshdesk, Intercom, Tidio, Comm100 | Use https://builtwith.com/.<br />Like: visit https://builtwith.com/zennioptical.com and search Conversion Optimization|Live Chat in pagesource or try to find the tool on their official website                              |
| Site Traffic                              | Find out the site traffic                                    | 1 Million visit per month                         |                                                              |
| ERP System                                | Enterprise Resource Planning system                          | SAP                                               | Use https://builtwith.com/ <br />Like: https://builtwith.com/zennioptical.com  and search in pagesource |

## Response Format:

- Please list each field with its verified information
- Include source URLs for each data point where applicable
- Mark unavailable information as "Unknown"
- For technical stack information, include BuiltWith.com verification
- Highlight any discrepancies or conflicting information found during research
- Please provide the result in CSV format, with each field on a separate line in the format "Field Name, Value".
- Please ensure that the response only contains data in CSV format, without any additional explanations or prefaces.

## Company Info

The company you need to do research is: 
` },
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