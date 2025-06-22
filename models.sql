-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: aibuffet
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `models`
--

DROP TABLE IF EXISTS `models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `models` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `base_url` varchar(255) NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `rating` decimal(3,2) DEFAULT NULL,
  `description` text,
  `purpose` varchar(255) DEFAULT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `is_open_source` tinyint(1) DEFAULT NULL,
  `invocation_method` varchar(255) DEFAULT 'openAPI' COMMENT '调用方式，可从字典值中选择，默认值为openAPI',
  `emoji` varchar(10) DEFAULT NULL,
  `invoke_config` text,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `models`
--

LOCK TABLES `models` WRITE;
/*!40000 ALTER TABLE `models` DISABLE KEYS */;
INSERT INTO `models` VALUES (1,'deepseek-chat','https://api.deepseek.com/v1/chat/completions','sk-96d8dd7f729747e295d896b7eb4c8da0',4.00,'DeepSeek-V3 多项评测成绩超越了 Qwen2.5-72B 和 Llama-3.1-405B 等其他开源模型，并在性能上和世界顶尖的闭源模型 GPT-4o 以及 Claude-3.5-Sonnet 不分伯仲。','deepseek对话','deepseek',1,'openAPI','🐙','{\n    \"model\": \"deepseek-chat\",\n    \"stream\": true,\n    \"temperature\": 0.7\n}'),(3,'qwen-max','https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions','sk-04007808e2cc45e5b259d1cc3d23c8e0',4.00,'通义千问2.5系列千亿级别超大规模语言模型，支持中文、英文等不同语言输入。','对话','阿里云',1,'openAPI','🥞','{\n    \"model\": \"qwen-max\",\n    \"stream\": true,\n    \"temperature\": 0.7\n}'),(5,'text-embedding-v3','https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings','sk-04007808e2cc45e5b259d1cc3d23c8e0',NULL,NULL,'向量化','阿里云',NULL,'openAPI',NULL,NULL),(6,'qwen-long-latest','https://dashscope.aliyuncs.com/compatible-mode/v1','sk-04007808e2cc45e5b259d1cc3d23c8e0',NULL,NULL,'发布','阿里云',NULL,'openAPI',NULL,NULL),(7,'sambert-zhiting-v1','sambert-zhiting-v1','sk-04007808e2cc45e5b259d1cc3d23c8e0',NULL,NULL,'语音合成','阿里云',NULL,'openAPI',NULL,NULL),(8,'cosyvoice-v2','cosyvoice-v2','sk-04007808e2cc45e5b259d1cc3d23c8e0',NULL,NULL,'多角色语音合成','阿里云',NULL,'openAPI',NULL,NULL),(9,'qwen3-32b','https://dashscope.aliyuncs.com/compatible-mode/v1','sk-04007808e2cc45e5b259d1cc3d23c8e0',NULL,NULL,'语音合成SSML标记生成','阿里云',NULL,'openAPI',NULL,NULL);
/*!40000 ALTER TABLE `models` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-22  9:40:57
