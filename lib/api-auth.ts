/**
 * API 鉴权：X-API-KEY 校验
 * 供 API Routes 调用，或由 middleware 统一校验
 */
export function getApiKeyFromHeader(headers: Headers): string | null {
  return headers.get("x-api-key") ?? headers.get("X-API-KEY");
}

export function validateApiKey(headers: Headers): { valid: boolean; error?: string } {
  const key = getApiKeyFromHeader(headers);
  const expected = process.env.API_KEY;

  if (!expected) {
    return { valid: false, error: "服务端未配置 API_KEY" };
  }
  if (!key) {
    return { valid: false, error: "缺少 X-API-KEY 请求头" };
  }
  if (key !== expected) {
    return { valid: false, error: "API Key 无效" };
  }
  return { valid: true };
}
