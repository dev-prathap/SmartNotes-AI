import { NextRequest } from 'next/server';
import { postgrestClient } from './postgrest';

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 环境变量验证
export function validateEnv(): void {
  const requiredVars = ['POSTGREST_URL', 'POSTGREST_SCHEMA', 'POSTGREST_API_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// 标准化错误响应
export function errorResponse(error: string, status: number = 500): Response {
  console.error('API Error:', error);
  return Response.json(
    { success: false, error } as ApiResponse,
    { status }
  );
}

// 标准化成功响应
export function successResponse<T>(data: T, status: number = 200): Response {
  return Response.json(
    { success: true, data } as ApiResponse<T>,
    { status }
  );
}

// 解析查询参数
export function parseQueryParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return {
    limit: parseInt(searchParams.get('limit') || '10'),
    offset: parseInt(searchParams.get('offset') || '0'),
    id: searchParams.get('id'),
    search: searchParams.get('search'),
  };
}

// 验证请求体
export async function validateRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }
    
    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in request body');
    }
    throw error;
  }
}

// 通用CRUD操作包装器
export class CrudOperations {
  constructor(private tableName: string) {}

  async findMany(filters?: Record<string, any>, limit?: number, offset?: number) {
    validateEnv();
    
    let query = postgrestClient.from(this.tableName).select('*');
    
    // 应用过滤器
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    
    // 应用分页
    if (limit && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    }
    
    return data;
  }

  async findById(id: string | number) {
    validateEnv();
    
    const { data, error } = await postgrestClient
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到记录
      }
      throw new Error(`Failed to fetch ${this.tableName} by id: ${error.message}`);
    }
    
    return data;
  }

  async create(data: Record<string, any>) {
    validateEnv();
    
    const { data: result, error } = await postgrestClient
      .from(this.tableName)
      .insert([data])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }
    
    return result;
  }

  async update(id: string | number, data: Record<string, any>) {
    validateEnv();
    
    const { data: result, error } = await postgrestClient
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }
    
    return result;
  }

  async delete(id: string | number) {
    validateEnv();
    
    const { error } = await postgrestClient
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
    
    return { id };
  }
}

// API 路由处理器包装器
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('Unhandled API error:', error);
      
      if (error instanceof Error) {
        return errorResponse(error.message);
      }
      
      return errorResponse('Internal server error');
    }
  };
} 