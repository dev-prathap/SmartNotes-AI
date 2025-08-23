import { NextRequest, NextResponse } from "next/server";

const POSTGREST_API_KEY = process.env.POSTGREST_API_KEY || "";
const ZOER_HOST = process.env.ZOER_HOST || "https://zoer.ai";

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const url = request.nextUrl;
  const pathSegments = url.pathname.replace(/^\/zoer_chatbot\//, "").split("/").filter(Boolean);
  try {
    // 获取原始 URL
    // const url = new URL(request.url); // This line is removed as per the new_code

    // 构建目标路径
    const targetPath = "/" + pathSegments.join("/");

    // 构建目标 URL
    const targetUrl = `${ZOER_HOST}${targetPath}${url.search}`;

    // 准备请求头
    const headers = new Headers();

    // 复制原始请求头
    request.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    // 添加 Authorization 头
    headers.set("Authorization", `Bearer ${POSTGREST_API_KEY}`);

    // 更新 Host 头
    headers.set("Host", ZOER_HOST.split("://")[1]);

    // 准备请求体
    let body: BodyInit | undefined;
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      body = await request.arrayBuffer();
    }

    // 发送代理请求
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    // 准备响应头
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    // 返回代理响应
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
