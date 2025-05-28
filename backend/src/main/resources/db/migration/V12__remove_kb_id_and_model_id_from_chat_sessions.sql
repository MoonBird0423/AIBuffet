-- 删除chat_sessions表中的kb_id和model_id字段及相关约束

-- 删除外键约束
ALTER TABLE `chat_sessions` DROP FOREIGN KEY `fk_sessions_kb`;
ALTER TABLE `chat_sessions` DROP FOREIGN KEY `fk_sessions_model`;

-- 删除索引
ALTER TABLE `chat_sessions` DROP INDEX `fk_sessions_kb`;
ALTER TABLE `chat_sessions` DROP INDEX `fk_sessions_model`;

-- 删除字段
ALTER TABLE `chat_sessions` DROP COLUMN `kb_id`;
ALTER TABLE `chat_sessions` DROP COLUMN `model_id`;
