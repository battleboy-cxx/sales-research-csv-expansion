import React, { useState } from 'react';
import { 
  Card, 
  Checkbox, 
  Button, 
  Input, 
  Form, 
  Divider,
  Tag,
  Tooltip,
  message
} from 'antd';
import { 
  SearchOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';

/**
 * 字段选择组件
 * 允许用户选择要研究的公司数据字段
 */
const FieldSelector = ({ 
  availableFields, 
  selectedFields, 
  onChange, 
  onSubmit,
  apiKey,
  onApiKeyChange,
  isLoading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customField, setCustomField] = useState('');
  
  // 根据搜索词过滤字段
  const filteredFields = searchTerm 
    ? availableFields.filter(field => 
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        field.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableFields;
  
  // 处理字段选择/取消
  const handleFieldToggle = (fieldValue) => {
    const newSelection = selectedFields.includes(fieldValue)
      ? selectedFields.filter(f => f !== fieldValue)
      : [...selectedFields, fieldValue];
    
    onChange(newSelection);
  };
  
  // 添加自定义字段
  const addCustomField = () => {
    if (customField && !availableFields.some(f => f.value === customField)) {
      const newField = {
        label: customField,
        value: customField,
        custom: true
      };
      
      // 通知父组件添加新字段
      onChange([...selectedFields, customField]);
      setCustomField('');
      message.success(`已添加自定义字段: ${customField}`);
    } else {
      message.warning('字段已存在或输入为空');
    }
  };
  
  // 分类字段
  const categorizedFields = {
    '公司基本信息': filteredFields.filter(f => 
      f.value.includes('Company') || 
      f.value.includes('Website') ||
      f.value.includes('Industry') || 
      f.value.includes('Business') || 
      f.value.includes('Employee')
    ),
    '客户服务': filteredFields.filter(f => 
      f.value.includes('Customer') || 
      f.value.includes('Service')
    ),
    '市场和财务': filteredFields.filter(f => 
      f.value.includes('Revenue') || 
      f.value.includes('Financial') || 
      f.value.includes('Market') || 
      f.value.includes('Rank') || 
      f.value.includes('PE Backing')
    ),
    '技术栈': filteredFields.filter(f => 
      f.value.includes('Platform') || 
      f.value.includes('System') || 
      f.value.includes('Tool')
    ),
    '其他': filteredFields.filter(f => 
      !f.value.includes('Customer') &&
      !f.value.includes('Service') &&
      !f.value.includes('Revenue') &&
      !f.value.includes('Financial') &&
      !f.value.includes('Market') &&
      !f.value.includes('Rank') &&
      !f.value.includes('PE Backing') &&
      !f.value.includes('Platform') &&
      !f.value.includes('System') &&
      !f.value.includes('Tool')
    )
  };

  return (
    <Card className="field-selector-card">
      <div className="field-selector-header">
        <h2>选择要研究的公司数据字段</h2>
        <p>选择要为每个公司收集的数据字段。字段越多，处理时间越长。</p>
      </div>
      
      <Form layout="vertical">
        <Form.Item 
          label="OpenRouter API密钥" 
          required
          tooltip={{
            title: '您需要一个有效的OpenRouter API密钥来使用DeepSeek模型',
            icon: <InfoCircleOutlined />
          }}
        >
          <Input.Password
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="输入您的OpenRouter API密钥"
          />
          <div className="field-selector-api-hint">
            <InfoCircleOutlined style={{ marginRight: '8px' }} />
            <span>您可以从 <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">OpenRouter网站</a> 获取API密钥</span>
          </div>
        </Form.Item>
      </Form>
      
      <div className="field-selector-search">
        <Input
          placeholder="搜索字段"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>
      
      <div className="field-selector-selection">
        <div className="field-selector-selected">
          <h3>已选择 ({selectedFields.length})</h3>
          <div className="selected-tags">
            {selectedFields.length > 0 ? (
              selectedFields.map(field => {
                const fieldObj = availableFields.find(f => f.value === field) || { label: field, value: field };
                return (
                  <Tag
                    key={field}
                    closable
                    color="blue"
                    onClose={() => handleFieldToggle(field)}
                    style={{ margin: '4px' }}
                  >
                    {fieldObj.label}
                  </Tag>
                );
              })
            ) : (
              <p className="field-selector-empty">未选择任何字段</p>
            )}
          </div>
        </div>
        
        <Divider />

        <div className="field-selector-select-all" style={{ margin: '12px 0' }}>
        <Checkbox
          indeterminate={
            selectedFields.length > 0 &&
            selectedFields.length < filteredFields.length
          }
          checked={selectedFields.length === filteredFields.length && filteredFields.length > 0}
          onChange={(e) => {
            const all = filteredFields.map(f => f.value);
            onChange(e.target.checked ? all : []);
          }}
        >
          全选 / Select All
        </Checkbox>
      </div>
        
        <div className="field-selector-available">
          <h3>可用字段</h3>
          
          {Object.entries(categorizedFields).map(([category, fields]) => (
            fields.length > 0 && (
              <div key={category} className="field-category">
                <h4>{category}</h4>
                <div className="field-options">
                  {fields.map(field => (
                    <div key={field.value} className="field-option">
                      <Checkbox
                        checked={selectedFields.includes(field.value)}
                        onChange={() => handleFieldToggle(field.value)}
                      >
                        <Tooltip title={field.description}>
                          <span>{field.label}</span>
                        </Tooltip>
                      </Checkbox>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
      
      <div className="field-selector-custom">
        <h3>添加自定义字段</h3>
        <div className="custom-field-input">
          <Input
            placeholder="输入自定义字段名称"
            value={customField}
            onChange={(e) => setCustomField(e.target.value)}
            style={{ width: 'calc(100% - 90px)', marginRight: '8px' }}
          />
          <Button 
            type="primary" 
            onClick={addCustomField}
            disabled={!customField.trim()}
          >
            添加
          </Button>
        </div>
      </div>
      
      <div className="field-selector-actions">
        <Button 
          type="primary" 
          onClick={onSubmit}
          disabled={isLoading || selectedFields.length === 0 || !apiKey}
          loading={isLoading}
        >
          {isLoading ? '处理中...' : '开始研究'}
        </Button>
      </div>
    </Card>
  );
};

export default FieldSelector;