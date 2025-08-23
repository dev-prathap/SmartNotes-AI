import { PostgrestClient } from "@supabase/postgrest-js";

// 直接从环境变量读取配置
const POSTGREST_URL = process.env.POSTGREST_URL || "http://localhost:3000";
const POSTGREST_SCHEMA = process.env.POSTGREST_SCHEMA || "public";
const POSTGREST_API_KEY = process.env.POSTGREST_API_KEY || "";

// 此客户端仅在服务器端（API 路由）使用
export const postgrestClient = new PostgrestClient(POSTGREST_URL, {
  schema: POSTGREST_SCHEMA,
  fetch: (...args) => {
    let [url, options] = args;

    // 检查并修复 URL 中的 columns 参数
    if (url instanceof URL || typeof url === "string") {
      const urlObj = url instanceof URL ? url : new URL(url);
      const columns = urlObj.searchParams.get("columns");

      if (columns && columns.includes('"')) {
        // 移除所有双引号
        const fixedColumns = columns.replace(/"/g, "");
        urlObj.searchParams.set("columns", fixedColumns);
        url = urlObj.toString();
      }
    }

    // 确保请求头包含认证信息
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${POSTGREST_API_KEY}`,
      ...((options as RequestInit)?.headers || {}),
    };

    return fetch(url, {
      ...options,
      headers,
    } as RequestInit);
  },
});
