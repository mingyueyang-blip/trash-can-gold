-- 炼金炉 · 补全 fragments 表缺失字段
-- 若你已手动建过表但缺少 tag_ids / status 等，在 Supabase SQL Editor 中执行本文件

-- 以下列若已存在会跳过（PostgreSQL 9.5+ 支持 IF NOT EXISTS）
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS tag_ids TEXT[] DEFAULT '{}';
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'inbox';
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 补约束（若表是新建的且没有约束，可取消下面注释）
-- ALTER TABLE fragments DROP CONSTRAINT IF EXISTS fragments_source_type_check;
-- ALTER TABLE fragments ADD CONSTRAINT fragments_source_type_check CHECK (source_type IN ('text', 'link', 'image', 'audio'));
-- ALTER TABLE fragments DROP CONSTRAINT IF EXISTS fragments_status_check;
-- ALTER TABLE fragments ADD CONSTRAINT fragments_status_check CHECK (status IN ('inbox', 'archived', 'burned'));

-- 已有数据的行：把 status 设为 inbox（仅当刚新增该列且存在空值时才需类似更新）
-- UPDATE fragments SET status = 'inbox' WHERE status IS NULL;

-- 索引（可选，便于查询）
CREATE INDEX IF NOT EXISTS idx_fragments_status ON fragments (status);
CREATE INDEX IF NOT EXISTS idx_fragments_created_at ON fragments (created_at DESC);
