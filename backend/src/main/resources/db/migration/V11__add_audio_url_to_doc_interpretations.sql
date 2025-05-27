-- 为doc_interpretations表添加音频文件URL字段
ALTER TABLE doc_interpretations ADD COLUMN audio_url VARCHAR(500) COMMENT '音频文件URL';
