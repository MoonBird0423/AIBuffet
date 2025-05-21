-- 创建文档脑图表
CREATE TABLE `doc_mindmaps` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `doc_id` bigint NOT NULL COMMENT '关联的文档ID',
  `content` JSON COMMENT '脑图JSON数据',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doc_id` (`doc_id`),
  CONSTRAINT `fk_mindmaps_doc` FOREIGN KEY (`doc_id`) REFERENCES `doc_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文档脑图表';

-- 创建文档测试题表
CREATE TABLE `doc_quizzes` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `doc_id` bigint NOT NULL COMMENT '关联的文档ID',
  `questions` JSON COMMENT '测试题JSON数据',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doc_id` (`doc_id`),
  CONSTRAINT `fk_quizzes_doc` FOREIGN KEY (`doc_id`) REFERENCES `doc_files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文档测试题表';
