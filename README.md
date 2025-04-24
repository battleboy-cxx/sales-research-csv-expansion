# AI公司研究工具

这是一个利用AI自动研究和填充公司信息的工具，能够将仅包含公司名称的CSV文件转换为包含丰富业务情报的详细报告。

## 功能特点

- 上传CSV文件进行批量公司研究
- 自定义选择需要的研究字段
- 使用OpenRouter API接入DeepSeek等AI模型
- 实时展示处理进度
- 导出包含研究结果的丰富CSV文件

## 技术栈

- **前端**：React + AntDesign UI
- **后端**：Node.js + Express
- **AI集成**：OpenRouter API (DeepSeek模型)
- **数据处理**：PapaParse (CSV解析)

## 快速开始

### 前提条件

- Node.js (v14+)
- OpenRouter API密钥 (https://openrouter.ai)

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/company-research-tool.git
cd company-research-tool
```

2. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
npm run client-install
```

3. 配置环境变量

创建`.env`文件在根目录，添加以下内容：

```
PORT=5001
NODE_ENV=development
```

4. 启动开发服务器

```bash
# 同时运行前端和后端
npm run dev

# 只运行后端
npm run server

# 只运行前端
npm run client
```

应用将在 [http://localhost:3000](http://localhost:3000) 运行，API服务器在 [http://localhost:5001](http://localhost:5001).

## 使用方法

1. **准备CSV文件**：CSV文件至少需要包含一列公司名称
2. **上传文件**：在应用中上传CSV文件
3. **选择研究字段**：从可用字段列表中选择要研究的公司数据点
4. **输入API密钥**：提供您的OpenRouter API密钥
5. **开始研究**：点击"开始研究"按钮开始处理
6. **查看结果**：处理完成后查看研究结果
7. **下载结果**：下载包含所有研究数据的CSV文件

## 研究字段说明

工具可支持的研究字段包括但不限于：

- **公司基本信息**：成立年份、行业、业务覆盖(B2B/B2C)等
- **财务信息**：公司收入、财务状况、私募支持等
- **市场信息**：竞争格局、市场份额、排名等
- **技术栈**：电子商务平台、客服工单系统等
- **客服相关**：客服代理数量、客服挑战等

## 部署

### 生产环境构建

```bash
# 生成生产构建
npm run build
```

### 部署到Heroku

```bash
# 登录到Heroku
heroku login

# 创建应用
heroku create your-app-name

# 推送到Heroku
git push heroku main
```

## 定制与扩展

### 添加新研究字段

1. 在`App.jsx`中的`researchFields`数组添加新字段
2. 在后端`server.js`中的AI提示词模板中包含新字段

### 更换AI模型

在`server.js`文件中，修改OpenRouter API请求的`model`参数：

```javascript
// 使用不同的AI模型
const response = await axios.post(openRouterUrl, {
  model: 'anthropic/claude-3-haiku-20240307', // 更改为所需模型
  // ...其他参数
});
```

## 许可证

MIT