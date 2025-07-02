-- 添加生成状态字段到相关表

-- 为 doc_interpretations 表添加状态字段
ALTER TABLE doc_interpretations 
ADD COLUMN interpretation_status ENUM('生成中', '结束') DEFAULT NULL COMMENT '文字解读生成状态',
ADD COLUMN audio_status ENUM('生成中', '结束') DEFAULT NULL COMMENT '音频生成状态';

-- 为 doc_mindmaps 表添加状态字段
ALTER TABLE doc_mindmaps 
ADD COLUMN generation_status ENUM('生成中', '结束') DEFAULT NULL COMMENT '脑图生成状态';

-- 为 doc_quizzes 表添加状态字段
ALTER TABLE doc_quizzes 
ADD COLUMN generation_status ENUM('生成中', '结束') DEFAULT NULL COMMENT '测试生成状态';
