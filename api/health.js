// 健康检查 API 端点
module.exports = async (req, res) => {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // 处理 OPTIONS 请求（预检）
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只处理 GET 请求
  if (req.method === 'GET') {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } else {
    // 处理非 GET 请求
    res.status(405).json({ error: 'Method not allowed' });
  }
};