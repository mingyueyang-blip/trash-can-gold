-- 炼金炉 Sprint 1 · 表结构
-- 在 Supabase SQL Editor 中执行

-- 碎片表
CREATE TABLE IF NOT EXISTS fragments (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('text', 'link', 'image', 'audio')),
  source_url TEXT,
  tag_ids TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'archived', 'burned')),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 便于按状态与时间查询
CREATE INDEX IF NOT EXISTS idx_fragments_status ON fragments (status);
CREATE INDEX IF NOT EXISTS idx_fragments_created_at ON fragments (created_at DESC);

-- 标签表（Sprint 1 可先只用 tag_ids 存名称；后续可扩展为独立表 + 层级）
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES tags(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fragments IS '用户投喂的碎片（待处理池 / 归档 / 已清除）';
COMMENT ON TABLE tags IS '动态标签库，支持层级';
