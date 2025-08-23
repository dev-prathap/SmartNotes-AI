import { NextRequest } from 'next/server';
import { 
  CrudOperations, 
  withErrorHandling, 
  parseQueryParams, 
  validateRequestBody,
  successResponse,
  errorResponse 
} from '@/lib/api-utils';
import { logApiRequest } from '@/lib/debug-log';

// 创建 examples 表的 CRUD 操作实例
const examplesCrud = new CrudOperations('examples');

// GET 请求 - 获取数据示例
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { limit, offset, search } = parseQueryParams(request);
  logApiRequest(request, { limit, offset, search });

  // 构建过滤条件
  const filters: Record<string, any> = {};
  if (search) {
    // 这里可以根据实际需求添加搜索逻辑
    // 注意：PostgREST 不支持复杂搜索，需要在应用层处理
    filters.name = search; // 假设按 name 字段搜索
  }

  const data = await examplesCrud.findMany(filters, limit, offset);
  return successResponse(data);
});

// POST 请求 - 创建数据示例
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await validateRequestBody(request);
  logApiRequest(request, { body });
  
  // 这里可以添加具体的数据验证逻辑
  // 例如：检查必填字段、数据格式等
  if (!body.name) {
    return errorResponse('Name is required', 400);
  }

  const data = await examplesCrud.create(body);
  return successResponse(data, 201);
});

// PUT 请求 - 更新数据示例
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);
  
  if (!id) {
    return errorResponse('ID parameter is required', 400);
  }

  const body = await validateRequestBody(request);
  
  // 检查记录是否存在
  const existing = await examplesCrud.findById(id);
  if (!existing) {
    return errorResponse('Record not found', 404);
  }

  const data = await examplesCrud.update(id, body);
  return successResponse(data);
});

// DELETE 请求 - 删除数据示例
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { id } = parseQueryParams(request);

  if (!id) {
    return errorResponse('ID parameter is required', 400);
  }

  // 检查记录是否存在
  const existing = await examplesCrud.findById(id);
  if (!existing) {
    return errorResponse('Record not found', 404);
  }

  const data = await examplesCrud.delete(id);
  return successResponse(data);
}); 