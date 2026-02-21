-- 为 fragments 表增加抓取结果字段（与用户写的 title/content 分开）
-- 在 Supabase SQL 编辑器中执行一次即可

ALTER TABLE fragments
  ADD COLUMN IF NOT EXISTS source_title TEXT,
  ADD COLUMN IF NOT EXISTS source_content TEXT;

-- 可选：将已有记录的 title/content 回填到 source_*，便于旧数据展示
-- UPDATE fragments SET source_title = title, source_content = content WHERE source_title IS NULL AND (title IS NOT NULL OR content IS NOT NULL);
