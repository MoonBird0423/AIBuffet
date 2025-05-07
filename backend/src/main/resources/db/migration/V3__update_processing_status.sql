-- 步骤1：先将非法状态设为PENDING
UPDATE doc_files 
SET processing_status = 'PENDING' 
WHERE processing_status NOT IN ('PENDING', 'CHUNKING', 'VECTORIZING', 'COMPLETED', 'FAILED');

-- 步骤2：修改字段定义，增加新状态
ALTER TABLE doc_files MODIFY COLUMN processing_status 
VARCHAR(20) NOT NULL DEFAULT 'PENDING';

ALTER TABLE doc_files MODIFY COLUMN processing_status ENUM(
    'PENDING',
    'EXTRACTING_TEXT',
    'CHUNKING',
    'VECTORIZING',
    'COMPLETED',
    'FAILED'
) NOT NULL DEFAULT 'PENDING';

-- 步骤3：更新处于分块状态但还没有分块的文档为文本提取状态
UPDATE doc_files 
SET processing_status = 'EXTRACTING_TEXT'
WHERE processing_status = 'CHUNKING' 
AND (SELECT COUNT(*) FROM doc_chunks WHERE doc_chunks.file_id = doc_files.id) = 0;
