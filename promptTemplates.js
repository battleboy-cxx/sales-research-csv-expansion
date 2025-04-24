const prompt = ``;

/**
 * 生成公司研究提示词
 * @param {string} company - 要研究的公司名称
 * @param {string[]} fields - 要研究的字段数组
 * @returns {string} - 格式化的提示词
 */
export const generateResearchPrompt = (company, fields) => {
    return `请针对公司 "${company}" 进行研究，提供以下信息:
  
  ${fields.map(field => `- ${field}`).join('\n')}
  
  请以CSV格式提供结果，每个字段一行，格式为"字段名,值"。如无法找到信息，请标记为"Unknown"。
  请确保回复仅包含CSV格式的数据，无需任何额外的解释或前言。`;
  };