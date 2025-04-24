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
 * Field selection component
 * Allows users to select company data fields for research
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
  
  // Filter fields based on search term
  const filteredFields = searchTerm 
    ? availableFields.filter(field => 
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        field.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableFields;
  
  // Handle field selection/deselection
  const handleFieldToggle = (fieldValue) => {
    const newSelection = selectedFields.includes(fieldValue)
      ? selectedFields.filter(f => f !== fieldValue)
      : [...selectedFields, fieldValue];
    
    onChange(newSelection);
  };
  
  // Add custom field
  const addCustomField = () => {
    if (customField && !availableFields.some(f => f.value === customField)) {
      const newField = {
        label: customField,
        value: customField,
        custom: true
      };
      
      // Notify parent component to add new field
      onChange([...selectedFields, customField]);
      setCustomField('');
      message.success(`Custom field added: ${customField}`);
    } else {
      message.warning('Field already exists or input is empty');
    }
  };
  
  // Categorize fields
  const categorizedFields = {
    'Company Basic Information': filteredFields.filter(f => 
      f.value.includes('Company') || 
      f.value.includes('Website') ||
      f.value.includes('Industry') || 
      f.value.includes('Business') || 
      f.value.includes('Employee')
    ),
    'Customer Service': filteredFields.filter(f => 
      f.value.includes('Customer') || 
      f.value.includes('Service')
    ),
    'Market and Finance': filteredFields.filter(f => 
      f.value.includes('Revenue') || 
      f.value.includes('Financial') || 
      f.value.includes('Market') || 
      f.value.includes('Rank') || 
      f.value.includes('PE Backing')
    ),
    'Technology Stack': filteredFields.filter(f => 
      f.value.includes('Platform') || 
      f.value.includes('System') || 
      f.value.includes('Tool')
    ),
    'Others': filteredFields.filter(f => 
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
        <h2>Select Company Data Fields for Research</h2>
        <p>Choose the data fields to collect for each company. More fields mean longer processing time.</p>
      </div>
      
      <Form layout="vertical">
        <Form.Item 
          label="OpenRouter API Key" 
          required
          tooltip={{
            title: 'You need a valid OpenRouter API key to use the perplexity/sonar-pro model',
            icon: <InfoCircleOutlined />
          }}
        >
          <Input.Password
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Enter your OpenRouter API key"
          />
          <div className="field-selector-api-hint">
            <InfoCircleOutlined style={{ marginRight: '8px' }} />
            <span>You can get an API key from the <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">OpenRouter website</a></span>
          </div>
        </Form.Item>
      </Form>
      
      <div className="field-selector-search">
        <Input
          placeholder="Search fields"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>
      
      <div className="field-selector-selection">
        <div className="field-selector-selected">
          <h3>Selected ({selectedFields.length})</h3>
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
              <p className="field-selector-empty">No fields selected</p>
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
          Select All
        </Checkbox>
      </div>
        
        <div className="field-selector-available">
          <h3>Available Fields</h3>
          
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
        <h3>Add Custom Field</h3>
        <div className="custom-field-input">
          <Input
            placeholder="Enter custom field name"
            value={customField}
            onChange={(e) => setCustomField(e.target.value)}
            style={{ width: 'calc(100% - 90px)', marginRight: '8px' }}
          />
          <Button 
            type="primary" 
            onClick={addCustomField}
            disabled={!customField.trim()}
          >
            Add
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
          {isLoading ? 'Processing...' : 'Start Research'}
        </Button>
      </div>
    </Card>
  );
};

export default FieldSelector;