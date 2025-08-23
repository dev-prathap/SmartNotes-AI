// URL 构建调试工具
export function debugUrlConstruction(endpoint: string, params?: Record<string, string>) {
    console.log('🔍 [URL DEBUG] 原始参数:', { endpoint, params });
    
    if (!params) {
      console.log('🔍 [URL DEBUG] 无参数，返回:', endpoint);
      return endpoint;
    }
    
    console.log('🔍 [URL DEBUG] 开始构建 URLSearchParams...');
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    console.log('🔍 [URL DEBUG] 查询字符串:', queryString);
    
    const finalUrl = `${endpoint}?${queryString}`;
    console.log('🔍 [URL DEBUG] 最终URL:', finalUrl);
    
    // 检查是否有异常字符
    if (finalUrl.includes(';')) {
      console.error('🚨 [URL DEBUG] 发现分号！URL中包含分号字符');
    }
    
    return finalUrl;
  } 