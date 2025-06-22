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
-- Table structure for table `prompt_templates`
--

DROP TABLE IF EXISTS `prompt_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prompt_templates` (
  `name` varchar(100) NOT NULL COMMENT '提示词名称，如book.interpretation.user-prompt',
  `version` int NOT NULL COMMENT '版本号，纯数字',
  `content` text NOT NULL COMMENT '提示词内容',
  `description` varchar(500) DEFAULT NULL COMMENT '提示词描述',
  `is_active` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否生效，相同名称的提示词只能有一个为生效',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`name`,`version`),
  KEY `idx_name_active` (`name`,`is_active`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='提示词模板表，用于版本管理和动态配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prompt_templates`
--

LOCK TABLES `prompt_templates` WRITE;
/*!40000 ALTER TABLE `prompt_templates` DISABLE KEYS */;
INSERT INTO `prompt_templates` VALUES ('audio.ssml.generation.prompt',1,'请将下面的对话转换成阿里云CosyVoice大模型的SSML标记语言（基于W3C的语音合成标记语言版本1.0）让对话的每个角色都有不同的音色。\n可使用标签：\n1、<speak>标签是所有待支持SSML标签的根节点。一切需要调用SSML标签的文本都要包含在<speak></speak>中；\n2、支持多个 <speak> 标签并列使用（如：<speak></speak><speak></speak>），但不支持嵌套结构（如：<speak><speak></speak></speak>）；\n3、<break>用于在文本中插入停顿，该标签是可选标签；\n4、<phoneme>用于控制标签内文本的读音，该标签是可选标签；\n5、<say-as>用于指示出标签内文本的信息类型，进而按照该类型的默认发音方式发音；\n使用例子：\n<speak><say-as interpret-as=\"telephone\">114</say-as>查询号码 <say-as interpret-as=\"cardinal\">123</say-as>开始干。加起来为<say-as interpret-as=\"digits\">1234</say-as>。<say-as interpret-as=\"name\">张三</say-as>的快递。<say-as interpret-as=\"address\">富路国际1号楼3单元304</say-as><say-as interpret-as=\"nick\">李四6689</say-as></speak>\n角色音色选择指南：（通过<speak>标签属性voice来指定）\n-longxiaoxia_v2：适合主持人\n-longcheng_v2：适合会议男嘉宾\n-longxiaochun_v2：适合会议女嘉宾\n-longwan_v2：适合观众代表\n特别注意：\n-除了转换内容不要输出其他内容，需要保证输出内容可直接被CosyVoice大模型识别。\n-需要对输出内容进行检查，确保格式满足规范要求。\n-对话流畅，信息完整。\n对话内容\n%s','用于将对话内容转换为阿里云CosyVoice大模型的SSML标记语言的提示词',1,'2025-06-19 16:10:12','2025-06-20 02:18:59'),('book.interpretation.user-prompt',1,'请根据上传图书生成一段对话\n\n场景：一场多角色参与的图书分享会。\n\n角色：\n-主持人：年轻女性，负责开场、结束致辞，对嘉宾提问。\n-嘉宾：专家，负责解读图书，回答主持人提问。\n-观众代表：中年女性，负责分享感悟。\n\n输出模板：\n### 主持人:\n【（欢迎语）欢迎大家来到书意平台的图书分享会，我是主持人默默。】\n【\n- （开场三选一）  \n  - （悬念痛点）比如：\"你所相信的（什么）真理，可能全是虚构——这本书彻底颠覆了我的认知\"\n  - （金句冲击）列举书中的金句 + \"这仅仅是开始...\"  \n  -（ 场景共鸣）比如：\"深夜焦虑（什么）问题？作者用亲身经历给出了震撼答案\"\n】\n【 \"从本书你将获得：\n① (核心思想X个 )···\n②( 独家解法 )···\n③ （现实启发）···\n】\n【（过渡语）比如：今天我们有幸邀请到了本书的作者/译者/编辑（名字），接下来···】\n### 嘉宾：\n【分享写作动机、时代背景、领域发展现状，例：《人类简史》诞生于全球化与科技爆炸的反思期。】\n【本书试图回答xxx问题？（工具书：解决什么痛点？小说：探讨什么主题？）】\n### 主持人：\n【（分享感悟）比如：针对（什么）社会现象，这本书将发挥非常大的作用···】\n---\n### 主持人：\n【（主持人核心观点提问1）能聊一聊本书的第核心观点（xx具体观点）吗？···】\n### 嘉宾：\n【 \n -  \"用书中的内容来解释观点···\"（先直接引用书中原句，在进行解释说明）\n -   \"对比xxx观点，在xxx方面，更具优势或是赢得更多人的赞同···\"（进行观点对比）\n - \"举个书中案例或故事：...\"(选最具象的1个进行详细描述，用讲故事的手法包含起承转合。)\n】\n### 主持人：\n【（分享感悟）\"这能帮解决现实中的XX困境···\" (必须关联痛点，可列举现象、分析本质、描述观点如何发挥作用)】\n---\n### 主持人：\n【（主持人核心观点提问2）比如：能聊一聊本书的核心观点（xx具体观点）吗？···】\n### 嘉宾：\n【 回答内容结构同上】\n### 主持人：\n【分享感悟结构同上】\n---\n### 主持人：\n【（主持人核心观点提问3）比如：能聊一聊本书的核心观点（xx具体观点）吗？···】\n### 嘉宾：\n【 回答内容结构同上】\n### 主持人：\n【分享感悟结构同上】\n---\n### 主持人：\n【（主持人核心观点提问4）比如：能聊一聊本书的核心观点（xx具体观点）吗？···】\n### 嘉宾：\n【 回答内容结构同上】\n### 主持人：\n【分享感悟结构同上】\n---\n### 主持人：\n【（主持人核心观点提问5）比如：能聊一聊本书的核心观点（xx具体观点）吗？···】\n### 嘉宾：\n【 回答内容结构同上】\n### 主持人：\n【分享感悟结构同上】\n---\n### 主持人：\n【（主持人创新点提问1）比如：刚才有观众提问，想知道本书有哪些创新点，能分享一下吗？···】\n### 嘉宾：\n【\n据书籍类型选择创新点\n| 类型       | 剖析方向                  | 关键动作               |\n|------------|------------------|------------------------|\n| 工具书 | 亲测方法论有效性       | 曝实践效果+踩坑经验    |\n| 小说   | 角色复杂性/隐喻解析     | 撕开人性矛盾层         |\n| 社科   | 颠覆性争议点          | 摆正反观点+你的立场    |\n| 传记  | 人性高光/至暗时刻     | 还原真实细节+冲击感    |\n| 科普   | 科学到生活的转化链    | 演示知识应用场景       |\n】\n### 主持人：\n【（分享感悟）今天第一次听到这样的观点，真让我醍醐灌顶啊···】\n---\n### 主持人：\n【（主持人创新点追问）比如：通过刚才的交流，相信台下的观众和我一样备受震撼，你能继续分享一些创新点吗？···】\n### 嘉宾：\n【创新点回答结构同上】\n---\n### 主持人：\n【（选取观众分享感悟）刚才的分享非常精彩，有观众已经跃跃欲试想来分享感悟了，现在有请观众代表分享感悟】\n### 观众代表：\n【 \"我是（背景，比如2个孩子的妈妈），我遇到了（什么）问题，偶然的机会读到这本书，书中的观点让我（感受，比如备受鼓舞），这本书让我从（XX）变成了（XX）···\" (介绍背景+遭遇问题+观点冲击+具象行为变化+本书的意义)】\n---\n### 主持人：\n【（主持人过度）比如：最后让（嘉宾名字）老师来总结一下本书的价值吧】\n### 嘉宾：\n【从个人/社会两个方面来总结本书的价值，（个人价值）比如技能提升、认知刷新、情感共鸣等，请详细展开。（社会价值）比如揭示问题、推动讨论、提供解决方案，请详细展开。】\n【书中未解决的矛盾或学界批评。保持批判性：即使是经典，也可指出其时代局限。】\n---\n### 主持人：\n【(结束致辞)比如：感谢大家参加这次分享会，我们共同经历了非常美妙的时刻，相信各位听众也和我一样收获颇多，····】\n【\n（推荐图书）  \n  -（适合人群）比如：正在为孩子的教育而困扰的家长，尤其是那些希望用更科学、更人性化的教育方法来引导孩子的父母。\n  -（必读理由）比如：书中提供的方法和工具不仅实用，而且能够从根本上改变亲子关系，让孩子在充满爱与尊重的环境中健康成长。\n】\n【（给读者的话）比如：可引用名人名言/名人事迹对书籍主题进行升华，鼓励用户进行实践，让解读更具备感染力。】\n\n特别注意：\n-不要直接输出\"【】\"符号以及其中的提示内容，根据图书内容进行总结替换。\n-输出对话8-12轮，除了对话不要输出任何其他多余的内容或提示。\n-输出内容使用口语化，生活化的语言。\n-输出不少于3000tokens。','用于生成图书解读对话的提示词，生成多角色参与的图书分享会形式的内容',1,'2025-06-19 15:50:09','2025-06-20 02:18:59'),('book.mindmap.user-prompt',1,'你是一个脑图专家。请解析用户上传的书籍内容生成脑图，按下面的流程进行解析：\n一、类型识别\n判定为以下类型之一：\n[工具类｜小说类｜人文社科类｜传记与纪实类｜科普类｜学术类]\n\n二、信息提取\n1. 基础信息（必填）：\n- 书籍名称（精确提取）\n- 作者（含国籍，如：马尔克斯（哥伦比亚））\n- 主类型 & 子类型（如：工具类→时间管理；小说类→科幻小说）\n-书籍主题（一句话深度总结)\n2. 章节解析（确保覆盖所有章节内容，如果章节内容过多可将多个章节按文章逻辑合成一个章节）：\n[章节名称] \n├─ 核心观点（每个观点独立节点，论点支持多层级嵌套，一个观点的子观点、案例、结论都放成这个观点的子节点）\n├─ 支撑案例（含数据/实验/故事）\n└─ 推导结论（说明与论点的逻辑关系）\n3. 关键信息（根据文章内容和类型梳理关键信息，至少选2个内容项进行梳理）：\n■ 工具类：\n- 待解决问题（3-5个痛点）\n- 方法论体系（步骤流程）\n- 应用工具（清单化呈现）\n■ 小说类：\n- 角色档案（姓名+核心特征）\n- 关系图谱（可视化箭头连接）\n- 情节里程碑（含关键转折点）\n■ 传记类：\n- 人生坐标轴（时间线标注重大事件，时间：事件）\n- 成就清单（量化呈现）\n- 关键抉择点（影响命运的选择）\n■ 科普类：\n- 核心概念树（专业术语层级化）\n- 实验/现象档案（原理+意义）\n- 现实应用场景（案例说明）\n\n三、请按照下面的格式要求输出前面提取的基础信息、章节信息、关键信息，层级结构分支数量根据提取的信息进行动态调整，格式要求为markdown。\n# 书名\n## 基础信息\n### 作者\n- **姓名**: xxxxx\n- **国籍**: xxx\n### 分类\n- **主分类**: xxx\n- **子分类**: xx\n### 书籍主题\n- **主题**: xxxx\n## 章节解析\n### 章节名称\n#### xx观点xx\n- **xx子观点xx**：xx说明xx\n- **xx案例xx**：xx说明xx\n- **xx结论xx**：xx说明xx\n## 关键信息\n### xxxx信息名称，比如待解决问题xxx\n- **xx说明xx**\n\n特别注意：\n-类型识别和信息提取过程不用输出，直接输出结构化markdown就行了，切记保证md格式的准确性。\n-严格参照上传内容，确保输出的真实性和完整性。','用于生成图书思维导图的提示词，支持多种图书类型的结构化分析',1,'2025-06-19 15:50:11','2025-06-20 02:18:59'),('book.quiz.user-prompt',1,'你作为一个出题专家，请根据文档出10道题目。\n1、信息提取：请先从文档中提取10个核心观点，和支撑该观点的案例、推导出的结论；\n2、出题：围绕每个观点出一道选择题，题目以提取的观点来编写一个案例让用户做出选择，每道题4个选项，只有一个选项是符合作者核心观点的。\n3、解析：给出正确答案选项，并解释该选项为什么是正确的。并给出其他选项错误的原因。\n4、结构化输出markdown格式如下：\n### 001. [题干]\n**选项：** \nA. 内容 \nB. 内容 \nC. 内容 \nD. 内容 \n**答案：** \n[字母] \n**解析：** \n✓ 正确项说明（含观点关联分析）\n✗ 错误项原因（每个选项1句，引用文档矛盾点） \n\n特别注意：\n1、信息提取过程不用输出，直接输出结构化markdown就行了，切记保证md格式的准确性。\n2、严格参照上传内容，确保输出的真实性和完整性。','用于生成图书测试题的提示词，围绕核心观点生成选择题',1,'2025-06-19 15:50:13','2025-06-19 15:50:13');
/*!40000 ALTER TABLE `prompt_templates` ENABLE KEYS */;
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
