const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Create Express application
const app = express();
const PORT = process.env.PORT || 5001;

const systemPrompt = `You are a professonal analyst on company/industry report. Please help me populate company data based on the following data structure. I may provide some existing fields for the company.

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
| Company name                              | Company official name                                        | Zenni Optical                                   |                                                     |
| Website                                   | Company's official website URL                               | https://www.zennioptical.com                          | Company profile/market research                                                      |
| Billing State/Province                    | Location of company's billing address                        | Virginia                                          | Use https://builtwith.com/meta/{comany_website}.<br />Like: visit https://builtwith.com/meta/zennioptical.com and search Location in pagesource                                                      |
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
| Customer Service Ticketing System         | Ticketing System in use                                      | Zendesk, ServiceNow                               | Use https://builtwith.com/.<br />Like: visit https://builtwith.com/zennioptical.com and search current ticketing in pagesource |
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
`

// Middleware
app.use(cors({
    // allow all origins
    origin: '*',
    credentials: true, // If cookies need to be included
    methods: ['GET', 'POST'] // Allowed HTTP methods
  }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Configure file upload
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was uploaded' });
  }
  
  res.json({
    success: true,
    filename: req.file.filename,
    originalname: req.file.originalname
  });
});

// OpenRouter API wrapper
// Used to call AI on OpenRouter for company information research
async function callAIResearch(company, fields, apiKey) {
  try {
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

    // Create a more detailed prompt with field-specific search guidance
    const fieldGuidance = {
      'Company name': 'Check company website, LinkedIn, or official registration',
      'Website': 'Search for official company website',
      'Billing State/Province': 'Check company address on LinkedIn, official website contact page, or BuiltWith.com/meta',
      'Company Established Year': 'Check About Us page, company history, LinkedIn, or Wikipedia',
      'Industry/Vertical': 'Check company description, LinkedIn, annual reports',
      'Business Coverage': 'Check products/services pages to determine if B2B, B2C, or both',
      'Company Revenue': 'Search for annual reports, press releases, financial news, or Crunchbase',
      'Total Employee': 'Check LinkedIn, company about page, or recent press releases',
      'Total Customer Service Agent': 'Estimate from LinkedIn employee count with customer service titles',
      'Customer Service Challenges': 'Search recent interviews, news articles, or glassdoor reviews',
      'Customer Service Technology Challenges': 'Search tech blogs, interviews with company CTO/CIO',
      'Competition Landscape': 'Check industry reports, market analysis websites',
      'Rank and Market %': 'Look for market research reports, industry publications',
      'Key Updates': 'Check company news page, press releases from last 6 months',
      'Financial Status': 'Check recent financial news, funding announcements',
      'PE Backing': 'Check Crunchbase, PitchBook, company investor page',
      'eCommerce Platform': 'Use BuiltWith.com, check page source code',
      'Customer Service Ticketing System': 'Use BuiltWith.com, check job listings for required skills',
      'LiveChat Tool': 'Check website for chat widgets, use BuiltWith.com',
      'Site Traffic': 'Check SimilarWeb, Alexa rankings',
      'ERP System': 'Check job listings, LinkedIn employee skills, tech stack articles'
    };

    // Create field-specific instructions
    const fieldInstructions = fields.map(field => {
      const guidance = fieldGuidance[field] || 'Search public sources';
      return `- ${field}: ${guidance}`;
    }).join('\n');

    const prompt = `Research company "${company}" thoroughly using the following search strategy for each field:

${fieldInstructions}

IMPORTANT INSTRUCTIONS:
1. Actively search for each field, don't just rely on general knowledge
2. For technical fields (eCommerce Platform, Ticketing System, etc.), check BuiltWith.com for "${company}" and examine page source
3. For employee/revenue data, check LinkedIn, Crunchbase, and recent news
4. If exact data isn't available, provide best estimate with source
5. Don't mark fields "Unknown" without trying multiple search strategies
6. Include source URLs for all information

Format as CSV: "Field Name, Value (Source: URL)"`; 

    const response = await axios.post(openRouterUrl, {
      model: 'perplexity/sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sales-research-csv-expansion-lkwh.vercel.app',
        'X-Title': 'Company Research Tool'
      }
    });

    const aiResponse = response.data.choices[0].message.content.trim();

    // 解析CSV格式结果为对象
    const lines = aiResponse.split('\n');
    const results = {};

    for (const line of lines) {
      const firstCommaIndex = line.indexOf(',');
      if (firstCommaIndex !== -1) {
        const key = line.substring(0, firstCommaIndex).trim();
        const value = line.substring(firstCommaIndex + 1).trim();
        results[key] = value;
      }
    }

    return results;
  } catch (error) {
    console.error('AI API call error:', error.message);

    if (error.response) {
      console.error('API response error:', error.response.data);
      throw new Error(`API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('Could not get response from API');
    } else {
      throw error;
    }
  }
}

// Add this function to specifically extract technical data
async function extractTechnicalData(company, apiKey) {
  const websiteUrl = company.includes('http') ? company : `https://${company}`;
  const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  
  try {
    // This simulates what you'd do with an actual BuiltWith API
    // You'll need to replace this with actual API calls or web scraping
    const prompt = `Please visit BuiltWith.com and analyze the technical stack for ${domain}.
    Specifically extract:
    1. eCommerce Platform
    2. Customer Service Ticketing System
    3. LiveChat Tool
    4. ERP System
    
    If you find any of this information, include the specific text found and its location in the page source.
    Format your response as CSV.`;
    
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await axios.post(openRouterUrl, {
      model: 'perplexity/sonar-pro',
      messages: [
        { 
          role: 'system', 
          content: 'You are a web technology analyzer that can extract technical stack information from websites.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Technical Stack Analyzer'
      }
    });
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Technical data extraction error:', error.message);
    return null;
  }
}

// Add this function to enhance research with fallback strategies
async function enhanceResearch(company, results, apiKey) {
  const unknownFields = [];
  
  // Identify which fields are unknown
  for (const [key, value] of Object.entries(results)) {
    if (value === "Unknown") {
      unknownFields.push(key);
    }
  }
  
  if (unknownFields.length === 0) {
    return results; // No unknown fields to enhance
  }
  
  // Create a field-specific followup search
  const followupPrompt = `For company "${company}", I'm missing the following information:
${unknownFields.join(', ')}

Please do targeted research specifically for these fields. Try using:
1. Information from Buildwith webite: https://builtwith.com/{company_website} 和 https://builtwith.com/meta/{company_websites},
2. LinkedIn data
3. Job postings (to infer systems and tools)
4. Employee profiles and skills
5. Company technology stack articles
6. Industry-specific databases

Format results as CSV with source URLs.`;

  try {
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await axios.post(openRouterUrl, {
      model: 'perplexity/sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: followupPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Company Research Tool - Enhanced Search'
      }
    });

    const followupResponse = response.data.choices[0].message.content.trim();
    
    // Parse the followup response
    const lines = followupResponse.split('\n');
    for (const line of lines) {
      const firstCommaIndex = line.indexOf(',');
      if (firstCommaIndex !== -1) {
        const key = line.substring(0, firstCommaIndex).trim();
        const value = line.substring(firstCommaIndex + 1).trim();
        
        // Only update if it was previously unknown
        if (unknownFields.includes(key) && results[key] === "Unknown" && value !== "Unknown") {
          results[key] = value;
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Enhanced research error:', error.message);
    return results; // Return original results if enhancement fails
  }
}

// Research API endpoint
app.post('/api/research', async (req, res) => {
  try {
    const { company, fields, apiKey } = req.body;
    
    if (!company || !fields || !fields.length || !apiKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Initial AI research
    let results = await callAIResearch(company, fields, apiKey);
    
    // Check for unknown fields and try to enhance results
    const unknownCount = Object.values(results).filter(v => v === "Unknown").length;
    if (unknownCount > 0) {
      console.log(`Found ${unknownCount} unknown fields, attempting enhancement...`);
      results = await enhanceResearch(company, results, apiKey);
    }
    
    res.json({ success: true, company, results });
  } catch (error) {
    console.error('Research API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process CSV file analysis endpoint
app.post('/api/analyze-csv', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }
    
    // Read uploaded CSV file
    const filePath = path.join(__dirname, req.file.path);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Analysis logic can be added here
    // For example, detect column names, infer possible company name columns, etc.
    
    res.json({
      success: true,
      filename: req.file.filename,
      originalname: req.file.originalname,
      fileContent: fileContent.substring(0, 1000) // Return first 1000 characters for preview
    });
    
    // Clean up temporary file
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('CSV analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch processing endpoint
app.post('/api/batch-research', async (req, res) => {
  try {
    const { companies, fields, apiKey } = req.body;
    
    if (!companies || !companies.length || !fields || !fields.length || !apiKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Create a results array
    const results = [];
    
    // Limit concurrent requests
    const concurrencyLimit = 3;
    let activeRequests = 0;
    let completedRequests = 0;
    
    // Handle concurrent requests with Promise
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
            let result = await callAIResearch(company, fields, apiKey);
            
            // Enhance results if there are unknown fields
            const unknownCount = Object.values(result).filter(v => v === "Unknown").length;
            if (unknownCount > 0) {
              result = await enhanceResearch(company, result, apiKey);
            }
            
            results.push({ company, results: result });
          } catch (error) {
            results.push({ company, error: error.message });
          }
          
          activeRequests--;
          completedRequests++;
          
          // Continue processing queue
          processQueue();
        }
        
        // If there are unprocessed requests but reached concurrency limit, check again later
        if (completedRequests + activeRequests < companies.length) {
          setTimeout(processQueue, 100);
        }
      };
      
      // Start initial processing
      for (let i = 0; i < Math.min(concurrencyLimit, companies.length); i++) {
        processQueue();
      }
    });
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Batch research error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Default route - Serve React frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing