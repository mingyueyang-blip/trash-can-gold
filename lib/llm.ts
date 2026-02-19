/**
 * 大模型客户端 · 通义千问（DashScope OpenAI 兼容接口）
 * 用于打标、后续 Embedding/Whisper 若接通义再扩展
 */
import OpenAI from "openai";

const apiKey = process.env.DASHSCOPE_API_KEY;
const baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

if (!apiKey) {
  console.warn("[通义千问] 缺少 DASHSCOPE_API_KEY，AI 打标等功能将不可用");
}

export const llm = new OpenAI({
  apiKey: apiKey ?? "",
  baseURL,
});

/** 当前使用的模型（通义千问 turbo，速度与成本均衡） */
export const CHAT_MODEL = "qwen-turbo";
