-- 修改现有字段的默认值和注释（字段已存在，只需修改定义）
ALTER TABLE doc_files MODIFY COLUMN favorite_count INT DEFAULT 0 COMMENT '收藏次数';

-- 初始化现有数据的收藏计数（包括NULL值和0值）
UPDATE doc_files SET favorite_count = (
    SELECT COUNT(*) 
    FROM knowledge_base_files kbf 
    WHERE kbf.file_id = doc_files.id 
    AND kbf.relation_type = 'FAVORITE'
) WHERE favorite_count IS NULL OR favorite_count = 0;

-- 添加索引优化查询性能（MySQL不支持IF NOT EXISTS，直接创建，已存在会报错但不影响整体迁移）
CREATE INDEX idx_favorite_count ON doc_files (favorite_count);
CREATE INDEX idx_published_docs ON doc_files (status, publish_status, uploaded_at);
CREATE INDEX idx_category_published ON doc_files (category, publish_status, uploaded_at);
CREATE INDEX idx_kb_relation ON knowledge_base_files (kb_id, relation_type, created_at);
CREATE INDEX idx_file_relation ON knowledge_base_files (file_id, relation_type);
