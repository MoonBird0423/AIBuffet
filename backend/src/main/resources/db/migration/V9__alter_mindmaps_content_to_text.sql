ALTER TABLE doc_mindmaps 
MODIFY COLUMN content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
COMMENT '脑图Markdown数据';
