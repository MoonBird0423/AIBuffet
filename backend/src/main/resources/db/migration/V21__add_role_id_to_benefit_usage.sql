-- 为benefit_usage表添加role_id字段
ALTER TABLE benefit_usage 
ADD COLUMN role_id BIGINT DEFAULT NULL COMMENT '关联角色ID';

-- 添加复合索引提高查询性能
CREATE INDEX idx_user_role_benefit ON benefit_usage(user_id, role_id, benefit_id);

-- 更新现有记录的role_id（如果有需要关联角色的记录）
-- UPDATE benefit_usage SET role_id = ? WHERE ...;
