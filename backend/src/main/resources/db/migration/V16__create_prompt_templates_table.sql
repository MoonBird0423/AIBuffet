-- 创建提示词模板表
CREATE TABLE prompt_templates (
    name VARCHAR(100) NOT NULL COMMENT '提示词名称，如book.interpretation.user-prompt',
    version INT NOT NULL COMMENT '版本号，纯数字',
    content TEXT NOT NULL COMMENT '提示词内容',
    description VARCHAR(500) COMMENT '提示词描述',
    is_active BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否生效，相同名称的提示词只能有一个为生效',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (name, version),
    INDEX idx_name_active (name, is_active),
    INDEX idx_created_at (created_at)
) COMMENT='提示词模板表，用于版本管理和动态配置';
