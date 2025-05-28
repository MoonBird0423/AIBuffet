-- 添加提问对象相关字段到chat_sessions表
ALTER TABLE chat_sessions 
ADD COLUMN question_target_type VARCHAR(20) NULL COMMENT '提问对象类型：book, knowledge',
ADD COLUMN question_target_id VARCHAR(50) NULL COMMENT '提问对象ID',
ADD COLUMN question_target_name VARCHAR(255) NULL COMMENT '提问对象名称';

-- 添加索引提高查询性能
CREATE INDEX idx_question_target ON chat_sessions(question_target_type, question_target_id);
