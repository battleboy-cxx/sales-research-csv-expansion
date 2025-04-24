import React, { useState, useEffect } from 'react';
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

// 导入自定义组件
import FieldSelector from './components/FieldSelector';

const { TabPane } = Tabs;

const App = () => {
  // 状态管理
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [researching, setResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enrichedData, setEnrichedData] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [apiKey, setApiKey] = useState('');
  
  // 研究字段选项
  const researchFields = [
    { label: '公司创建年份', value: 'Company Established Year', description: '公司成立的年份' },
    { label: '行业/垂直领域', value: 'Industry/Vertical', description: '公司所属的行业或垂直领域' },
    { label: '业务覆盖 (B2B/B2C)', value: 'Business Coverage', description: '公司业务覆盖的范围，B2B、B2C或两者兼有' },
    { label: '公司收入', value: 'Company Revenue', description: '公司的年度收入数据' },
    { label: '员工总数', value: 'Total Employee', description: '公司员工的总数量' },
    { label: '客服代理数量', value: 'Total Customer Service Agent', description: '客户服务代理的数量' },
    { label: '客服挑战', value: 'Customer Service Challenges', description: '客户服务团队面临的主要挑战' },
    { label: '客服技术挑战', value: 'Customer Service Technology Challenges', description: '客户服务团队面临的技术性挑战' },
    { label: '竞争格局', value: 'Competition Landscape', description: '公司在行业中的竞争态势' },
    { label: '市场排名和份额', value: 'Rank and Market %', description: '公司在市场中的排名和占有率' },
    { label: '最新动态', value: 'Key Updates', description: '公司近期的重要更新和动态' },
    { label: '财务状况', value: 'Financial Status', description: '公司的整体财务状况' },
    { label: '私募支持', value: 'PE Backing', description: '公司是否获得私募资金支持' },
    { label: '电子商务平台', value: 'eCommerce Platform', description: '公司使用的电子商务平台' },
    { label: '当前客服工单系统', value: 'Current Customer Service Ticketing System', description: '公司使用的客户服务工单系统' }
  ];

  // 处理文件上传
  const handleFileUpload = (info) => {
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    
    if (info.file.status === 'done') {
      // 获取文件
      const uploadedFile = info.file.originFileObj;
      setFile(uploadedFile);
      
      // 解析CSV
      Papa.parse(uploadedFile, {
        header: true,
        complete: (results) => {
          setCsvData(results.data);
          setHeaders(results.meta.fields);
          message.success(`${info.file.name} 文件解析成功`);
          setActiveTab('fields');
        },
        error: (error) => {
          message.error(`CSV解析错误: ${error.message}`);
        }
      });
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 自定义上传组件处理函数
  const customRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  // 开始研究过程
  const startResearch = async () => {
    if (selectedFields.length === 0) {
      message.warning('请至少选择一个要研究的字段');
      return;
    }
    
    if (!apiKey) {
      message.warning('请输入OpenRouter API密钥');
      return;
    }
    
    setResearching(true);
    setProgress(0);
    setActiveTab('progress');
    
    try {
      // 找到公司名称列
      const companyColumn = headers.find(h => 
        h.toLowerCase().includes('company') || 
        h.toLowerCase().includes('account')
      ) || headers[0];
      
      let enriched = [...csvData];
      let processedCount = 0;
      
      // 为每个公司进行研究
      for (let i = 0; i < csvData.length; i++) {
        const company = csvData[i][companyColumn];
        
        if (!company) continue;
        
        try {
          // 模拟发送到后端API (在实际实现中，这应该是真实的API调用)
          const mockResponse = await axios.post('http://localhost:5001/api/research', {
            company,
            fields: selectedFields,
            apiKey
          });
          
          // // 模拟响应
          // const mockResponse = {
          //   data: {
          //     results: {
          //       'Company Established Year': '2010',
          //       'Industry/Vertical': '技术/软件',
          //       'Business Coverage': 'B2B',
          //       'Company Revenue': '约1亿美元',
          //       'Total Employee': '250-500人',
          //     }
          //   }
          // };
          
          // 过滤只包含请求的字段
          const filteredResults = {};
          selectedFields.forEach(field => {
            if (mockResponse.data.results[field]) {
              filteredResults[field] = mockResponse.data.results[field];
            } else {
              filteredResults[field] = 'Unknown';
            }
          });
          
          // 更新丰富的数据
          enriched[i] = {
            ...csvData[i],
            ...filteredResults
          };
          
          // 更新进度
          processedCount++;
          setProgress(Math.round((processedCount / csvData.length) * 100));
          
          // 添加一些延迟以模拟真实API调用
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('研究公司时出错:', company, error);
          notification.error({
            message: '研究错误',
            description: `处理 "${company}" 时出错: ${error.message}`
          });
        }
      }
      
      setEnrichedData(enriched);
      message.success('研究完成!');
      setActiveTab('results');
    } catch (error) {
      message.error('研究过程中出错: ' + error.message);
    } finally {
      setResearching(false);
    }
  };

  // 下载丰富的CSV数据
  const downloadEnrichedCSV = () => {
    if (enrichedData.length === 0) {
      message.warning('没有可下载的数据');
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
      <h1>AI公司研究工具</h1>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="1. 上传CSV" key="upload">
          <Card className="upload-card">
            <h2>上传包含公司名称的CSV文件</h2>
            <p>CSV文件应至少包含一列公司名称。</p>
            
            <Upload
              className="csv-uploader"
              name="file"
              customRequest={customRequest}
              onChange={handleFileUpload}
              accept=".csv"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>点击上传CSV文件</Button>
              <p className="upload-hint">或拖放CSV文件到此处</p>
            </Upload>
            
            {csvData.length > 0 && (
              <div className="upload-info">
                <p>已加载 {csvData.length} 条记录</p>
                <Button type="primary" onClick={() => setActiveTab('fields')}>
                  下一步: 选择字段
                </Button>
              </div>
            )}
          </Card>
        </TabPane>
        
        <TabPane tab="2. 选择研究字段" key="fields">
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
        
        <TabPane tab="3. 研究进度" key="progress">
          <Card className="progress-card">
            <h2>研究进度</h2>
            <Progress percent={progress} status={researching ? "active" : "normal"} />
            
            {researching && (
              <p>正在处理公司数据... {progress}% 完成</p>
            )}
            
            {!researching && progress === 100 && (
              <div className="progress-complete">
                <p>研究已完成!</p>
                <Button type="primary" onClick={() => setActiveTab('results')}>查看结果</Button>
              </div>
            )}
          </Card>
        </TabPane>
        
        <TabPane tab="4. 结果" key="results">
          <Card className="results-card">
            <h2>研究结果</h2>
            
            {enrichedData.length > 0 ? (
              <div className="results-container">
                <p>共处理了 {enrichedData.length} 家公司的数据</p>
                
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
                    <p className="table-note">显示前10条记录。下载CSV以查看所有数据。</p>
                  )}
                </div>
                
                <Button 
                  type="primary"
                  onClick={downloadEnrichedCSV}
                  icon={<FileOutlined />}
                >
                  下载完整CSV
                </Button>
              </div>
            ) : (
              <p>没有可用的结果。请先完成研究过程。</p>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default App;