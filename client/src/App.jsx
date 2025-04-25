import React, { useState } from 'react';
import { 
  Button, 
  Upload, 
  Table, 
  message, 
  Progress, 
  Card, 
  Tabs, 
  notification,
} from 'antd';
import { 
  UploadOutlined, 
  FileOutlined
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import './App.css';
import Papa from 'papaparse';
import axios from 'axios';

// Import custom components
import FieldSelector from './components/FieldSelector';
const { TabPane } = Tabs;
const { Dragger } = Upload;

const App = () => {
  // State management
  const [, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [researching, setResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enrichedData, setEnrichedData] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_OPENROUTER_API_KEY || '');
  
  // Research field options
  const researchFields = [
    { label: 'Website', value: 'Website', description: 'Company\'s official website URL' },
    { label: 'Billing State/Province', value: 'Billing State/Province', description: 'Location of company\'s billing address' },
    { label: 'Current E-Commerce Platform', value: 'Current E-Commerce Platform', description: 'Current e-commerce solution in use' },
    { label: 'Company Established Year', value: 'Company Established Year', description: 'Year when company was founded' },
    { label: 'Industry/Vertical', value: 'Industry/Vertical', description: 'According to The Global Industry Classification Standard (GICS®), accurate to sub-Industries' },
    { label: 'Business Coverage', value: 'Business Coverage', description: 'B2B, B2C, or Both' },
    { label: 'Company Revenue', value: 'Company Revenue', description: 'Annual revenue figures, with original website or news source' },
    { label: 'Total Employee', value: 'Total Employee', description: 'Number of employees' },
    { label: 'Total Customer Service Agent', value: 'Total Customer Service Agent', description: 'Number of Customer Service Agents' },
    { label: 'Customer Service Challenges', value: 'Customer Service Challenges', description: 'Key business issues faced by customer service team/department' },
    { label: 'Customer Service Technology Challenges', value: 'Customer Service Technology Challenges', description: 'Technical issues or needs from customer service team/department' },
    { label: 'Competition Landscape', value: 'Competition Landscape', description: 'Overview of competitors in the industry' },
    { label: 'Rank and Market %', value: 'Rank and Market %', description: 'Market position and share percentage' },
    { label: 'Key Updates', value: 'Key Updates', description: 'Recent significant news (last 6 months), prioritizing customer service updates' },
    { label: 'Financial Status', value: 'Financial Status', description: 'Funding, challenges, bankruptcy information' },
    { label: 'PE Backing', value: 'PE Backing', description: 'Private Equity investment status' },
    { label: 'eCommerce Platform', value: 'eCommerce Platform', description: 'Current ecommerce platform used' },
    { label: 'Current Customer Service Ticketing System', value: 'Current Customer Service Ticketing System', description: 'Ticketing System currently in use' },
    { label: 'LiveChat Tool', value: 'LiveChat Tool', description: 'Current LiveChat tool used on the website' },
    { label: 'Site Traffic', value: 'Site Traffic', description: 'Website traffic volume information' },
    { label: 'ERP System', value: 'ERP System', description: 'Enterprise Resource Planning system used by the company' }
  ];

  // Handle file upload
  const handleFileUpload = (info) => {
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    
    if (info.file.status === 'done') {
      // Get file
      const uploadedFile = info.file.originFileObj;
      setFile(uploadedFile);
      
      // Parse CSV
      Papa.parse(uploadedFile, {
        header: true,
        complete: (results) => {
          setCsvData(results.data);
          setHeaders(results.meta.fields);
          message.success(`${info.file.name} file parsed successfully`);
          setActiveTab('fields');
        },
        error: (error) => {
          message.error(`CSV parsing error: ${error.message}`);
        }
      });
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed`);
    }
  };

  // Custom upload component handler
  const customRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  // Start research process
  const startResearch = async () => {
    if (selectedFields.length === 0) {
      message.warning('Please select at least one field to research');
      return;
    }
    
    if (!apiKey) {
      message.warning('Please enter OpenRouter API key');
      return;
    }
    
    setResearching(true);
    setProgress(0);
    setActiveTab('progress');
    
    try {
      // Find company name column
      const companyColumn = headers.find(h => 
        h.toLowerCase().includes('company') || 
        h.toLowerCase().includes('account')
      ) || headers[0];
      
      let enriched = [...csvData];
      let processedCount = 0;
      
      // Research for each company
      for (let i = 0; i < csvData.length; i++) {
        const company = csvData[i][companyColumn];
        
        if (!company) continue;
        
        try {
          // Use relative URL path instead of hardcoded localhost
          const mockResponse = await axios.post('/api/research', {
            company,
            fields: selectedFields,
            apiKey
          });
          
          // Filter to include only requested fields
          const filteredResults = {};
          selectedFields.forEach(field => {
            if (mockResponse.data.results[field]) {
              filteredResults[field] = mockResponse.data.results[field];
            } else {
              filteredResults[field] = 'Unknown';
            }
          });
          
          // Update enriched data
          enriched[i] = {
            ...csvData[i],
            ...filteredResults
          };
          
          // Update progress
          processedCount++;
          setProgress(Math.round((processedCount / csvData.length) * 100));
          
          // Add some delay to simulate real API call
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('Error researching company:', company, error);
          notification.error({
            message: 'Research Error',
            description: `Error processing "${company}": ${error.message}`
          });
        }
      }
      
      setEnrichedData(enriched);
      message.success('Research completed!');
      setActiveTab('results');
    } catch (error) {
      message.error('Error during research process: ' + error.message);
    } finally {
      setResearching(false);
    }
  };

  // Download enriched CSV data
  const downloadEnrichedCSV = () => {
    if (enrichedData.length === 0) {
      message.warning('No data available for download');
      return;
    }
    
    const csv = Papa.unparse(enrichedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'enriched_companies.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      <h1>AI Company Research Tool</h1>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="1. Upload CSV" key="upload">
          <Card className="upload-card">
            <h2>Upload CSV File with Company Names</h2>
            <p>CSV file should contain at least one column with company names.</p>
            
            <Dragger
              className="csv-uploader"
              name="file"
              customRequest={customRequest}
              onChange={handleFileUpload}
              accept=".csv"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Click to Upload CSV File</Button>
              <p className="upload-hint">Or drag and drop CSV file here</p>
            </Dragger>
            
            {csvData.length > 0 && (
              <div className="upload-info">
                <p>Loaded {csvData.length} records</p>
                <Button type="primary" onClick={() => setActiveTab('fields')}>
                  Next: Select Fields
                </Button>
              </div>
            )}
          </Card>
        </TabPane>
        
        <TabPane tab="2. Select Research Fields" key="fields">
          <FieldSelector 
            availableFields={researchFields}
            selectedFields={selectedFields}
            onChange={setSelectedFields}
            onSubmit={startResearch}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            isLoading={researching}
          />
        </TabPane>
        
        <TabPane tab="3. Research Progress" key="progress">
          <Card className="progress-card">
            <h2>Research Progress</h2>
            <Progress percent={progress} status={researching ? "active" : "normal"} />
            
            {researching && (
              <p>Processing company data... {progress}% complete</p>
            )}
            
            {!researching && progress === 100 && (
              <div className="progress-complete">
                <p>Research completed!</p>
                <Button type="primary" onClick={() => setActiveTab('results')}>View Results</Button>
              </div>
            )}
          </Card>
        </TabPane>
        
        <TabPane tab="4. Results" key="results">
          <Card className="results-card">
            <h2>Research Results</h2>
            
            {enrichedData.length > 0 ? (
              <div className="results-container">
                <p>Processed data for {enrichedData.length} companies</p>
                
                <div className="table-container">
                  <Table
                    dataSource={enrichedData.slice(0, 10).map((item, index) => ({...item, key: index}))}
                    bordered
                    scroll={{ x: 'max-content' }}
                    size="small"
                  >
                    {headers.concat(selectedFields).map(header => (
                      <Table.Column
                        key={header}
                        title={header}
                        dataIndex={header}
                        width={200}
                      />
                    ))}
                  </Table>
                  
                  {enrichedData.length > 10 && (
                    <p className="table-note">Showing first 10 records. Download CSV to see all data.</p>
                  )}
                </div>
                
                <Button 
                  type="primary"
                  onClick={downloadEnrichedCSV}
                  icon={<FileOutlined />}
                >
                  Download Complete CSV
                </Button>
              </div>
            ) : (
              <p>No results available. Please complete the research process first.</p>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default App;