# 炼金炉 · The Alchemy Cube

> 只管投喂，剩下的交给 AI。个人知识中转站。

全栈 Next.js 14 项目，Sprint 1：Text/Link 录入 + AI 打标 + Supabase 存储 + API Key 鉴权。

## 快速开始

```bash
# 安装依赖（已完成可跳过）
npm install

# 复制环境变量并填入真实值
cp .env.example .env

# 本地开发
npm run dev
```

在 Supabase 控制台执行 `supabase/schema.sql` 创建表结构后，即可使用投喂接口。

## 目录结构（Sprint 1）

```
├── app/
│   ├── api/
│   │   └── capture/route.ts   # POST 投喂接口（Text/Link）
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── api-auth.ts            # X-API-KEY 校验
│   ├── llm.ts                 # 通义千问（DashScope）客户端
│   └── supabase.ts            # Supabase 服务端客户端
├── services/
│   ├── capture.service.ts     # 捕获：打标 + 落库
│   └── tagging.service.ts     # AI 打标（GPT-4o-mini）
├── types/
│   └── index.ts               # Fragment、Tag、CapturePayload 等
├── supabase/
│   └── schema.sql             # 表结构（fragments、tags）
├── middleware.ts              # /api/* 统一 API Key 鉴权
└── .env.example
```

## API

- **POST /api/capture**  
  - Header: `X-API-KEY: <你的 API_KEY>`  
  - Body: `{ "type": "text" | "link", "content": "内容或 URL" }`  
  - 返回: `{ fragmentId, suggestedTags }`

## 环境变量

| 变量 | 说明 |
|------|------|
| `API_KEY` | 接口鉴权密钥，iflow/快捷指令请求头带此值 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥 |
| `DASHSCOPE_API_KEY` | 通义千问 API Key（打标用，阿里云 DashScope 获取） |

## 后续 Sprint

- **Sprint 2**：小宇宙/小红书深度解析、图片 Vision
- **Sprint 3**：语义搜索界面、周度 AI 聚类报告
