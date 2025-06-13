-- 更新图书分类枚举
-- 首先修改现有数据的分类映射
UPDATE doc_files SET category = 'MINDFULNESS' WHERE category = 'SCIENCE_TECH' AND (file_name LIKE '%心理%' OR file_name LIKE '%心灵%' OR description LIKE '%心理%' OR description LIKE '%心灵%');
UPDATE doc_files SET category = 'FAMILY_PARENTING' WHERE category = 'CHILDREN_EDUCATION';
UPDATE doc_files SET category = 'HUMANITIES_HISTORY' WHERE category = 'EDUCATION' AND (file_name LIKE '%历史%' OR file_name LIKE '%文化%' OR description LIKE '%历史%' OR description LIKE '%文化%');
UPDATE doc_files SET category = 'CAREER_DEVELOPMENT' WHERE category = 'EDUCATION' AND (file_name LIKE '%职场%' OR file_name LIKE '%工作%' OR file_name LIKE '%管理%' OR description LIKE '%职场%' OR description LIKE '%工作%' OR description LIKE '%管理%');
UPDATE doc_files SET category = 'HEALTHY_LIVING' WHERE category = 'LIFE_ENCYCLOPEDIA';
UPDATE doc_files SET category = 'PREMIUM_FICTION' WHERE category = 'NOVEL';
UPDATE doc_files SET category = 'PERSONAL_GROWTH' WHERE category = 'EDUCATION' AND category != 'HUMANITIES_HISTORY' AND category != 'CAREER_DEVELOPMENT';

-- 删除旧的枚举类型并创建新的
ALTER TABLE doc_files MODIFY category ENUM(
    'MINDFULNESS',
    'PERSONAL_GROWTH', 
    'FAMILY_PARENTING',
    'HUMANITIES_HISTORY',
    'FINANCE',
    'COMPUTER',
    'CAREER_DEVELOPMENT',
    'BIOGRAPHY',
    'HEALTHY_LIVING',
    'PREMIUM_FICTION',
    'OTHER'
) COMMENT '分类';
