"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const STORAGE_OPENAI = "alchemy_openai_key";
const STORAGE_JINA = "alchemy_jina_key";
const STORAGE_CUSTOM = "alchemy_custom_key";

export function SettingsView() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [jinaKey, setJinaKey] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [showOpenai, setShowOpenai] = useState(false);
  const [showJina, setShowJina] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOpenaiKey(localStorage.getItem(STORAGE_OPENAI) ?? "");
    setJinaKey(localStorage.getItem(STORAGE_JINA) ?? "");
    setCustomKey(localStorage.getItem(STORAGE_CUSTOM) ?? "");
    setWebhookUrl(`${window.location.origin}/api/capture`);
  }, []);

  const save = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  };

  return (
    <motion.div
      className="max-w-md mx-auto rounded-[24px] p-6 bg-white/40 backdrop-blur-md shadow-lg border border-white/50"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-lg font-semibold text-[#2d3748] mb-4">API 与 Webhook</h2>
      <p className="text-sm text-[#718096] mb-6">
        以下 Key 仅保存在本机浏览器中，用于展示与快捷配置。服务端抓取与炼金仍以 .env 配置为准。
      </p>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-[#4a5568]">OpenAI API Key</span>
          <div className="relative mt-1">
            <input
              type={showOpenai ? "text" : "password"}
              value={openaiKey}
              onChange={(e) => {
                setOpenaiKey(e.target.value);
                save(STORAGE_OPENAI, e.target.value);
              }}
              placeholder="sk-..."
              className="w-full rounded-xl px-4 py-3 bg-white/80 border border-gray-200 text-[#2d3748] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e9d8fd]"
            />
            <button
              type="button"
              onClick={() => setShowOpenai((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#805ad5]"
            >
              {showOpenai ? "隐藏" : "显示"}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-[#4a5568]">Jina API Key</span>
          <div className="relative mt-1">
            <input
              type={showJina ? "text" : "password"}
              value={jinaKey}
              onChange={(e) => {
                setJinaKey(e.target.value);
                save(STORAGE_JINA, e.target.value);
              }}
              placeholder="jina_..."
              className="w-full rounded-xl px-4 py-3 bg-white/80 border border-gray-200 text-[#2d3748] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e9d8fd]"
            />
            <button
              type="button"
              onClick={() => setShowJina((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#805ad5]"
            >
              {showJina ? "隐藏" : "显示"}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-[#4a5568]">Custom API Key（iflow / 快捷指令）</span>
          <div className="relative mt-1">
            <input
              type={showCustom ? "text" : "password"}
              value={customKey}
              onChange={(e) => {
                setCustomKey(e.target.value);
                save(STORAGE_CUSTOM, e.target.value);
              }}
              placeholder="与 .env API_KEY 一致时生效"
              className="w-full rounded-xl px-4 py-3 bg-white/80 border border-gray-200 text-[#2d3748] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e9d8fd]"
            />
            <button
              type="button"
              onClick={() => setShowCustom((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#805ad5]"
            >
              {showCustom ? "隐藏" : "显示"}
            </button>
          </div>
        </label>

        <div className="pt-2">
          <span className="text-sm font-medium text-[#4a5568]">Webhook 地址</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 rounded-xl px-4 py-3 bg-white/60 border border-gray-200 text-[#4a5568] text-sm"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
              }}
              className="px-3 py-2 rounded-lg bg-[#e9d8fd] text-[#805ad5] text-sm font-medium hover:bg-[#ddd6fe]"
            >
              复制
            </button>
          </div>
          <p className="text-xs text-[#718096] mt-1">POST 请求时请携带 Header: X-API-KEY</p>
        </div>
      </div>
    </motion.div>
  );
}
