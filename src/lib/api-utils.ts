// Local API utilities for SmartNotes AI - Local Storage Implementation

import { NextRequest } from 'next/server';

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
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

// Local storage CRUD operations
export class LocalCrudOperations {
  constructor(private storageKey: string) {}

  private getData(): any[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private saveData(data: any[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  async findMany(filters?: Record<string, any>, limit?: number, offset?: number) {
    let data = this.getData();

    // 应用过滤器
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          data = data.filter(item => item[key] === value);
        }
      });
    }

    // 应用分页
    if (limit && offset !== undefined) {
      data = data.slice(offset, offset + limit);
    }

    return data;
  }

  async findById(id: string | number) {
    const data = this.getData();
    return data.find(item => item.id === id) || null;
  }

  async create(itemData: Record<string, any>) {
    const data = this.getData();
    const newItem = {
      ...itemData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    data.push(newItem);
    this.saveData(data);

    return newItem;
  }

  async update(id: string | number, updateData: Record<string, any>) {
    const data = this.getData();
    const index = data.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error('Item not found');
    }

    const updatedItem = {
      ...data[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    data[index] = updatedItem;
    this.saveData(data);

    return updatedItem;
  }

  async delete(id: string | number) {
    const data = this.getData();
    const filteredData = data.filter(item => item.id !== id);

    if (filteredData.length === data.length) {
      throw new Error('Item not found');
    }

    this.saveData(filteredData);
    return { id };
  }
}

// Legacy alias for backward compatibility
export const CrudOperations = LocalCrudOperations;

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