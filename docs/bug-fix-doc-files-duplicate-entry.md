# 文档处理重复记录问题修复记录

## 问题描述

在文档处理过程中，遇到数据库唯一性约束冲突错误：

```
SQL Error: 1062, SQLState: 23000
Duplicate entry '8d5b9b3689ad7893b33cccc63d9eacb6' for key 'doc_files.uk_md5_hash'
```

错误发生在`TextExtractionStage`的文本提取阶段，具体是在处理队列线程中执行时发生的。

## 原因分析

### 1. 问题定位

错误出现在`TextExtractionStage`类的`process`方法中：

```java
// 更新文档状态为文本提取中
docFile.setProcessingStatus(DocFile.ProcessingStatus.EXTRACTING_TEXT);
docFileRepository.save(docFile);  // 问题出在这里
```

### 2. 根本原因

1. 使用JPA的`save`方法时，由于新的事务（@Transactional注解），实体可能处于游离(detached)状态
2. 在这种情况下，JPA可能会尝试执行INSERT而不是UPDATE
3. 这导致系统试图插入一条新记录而不是更新现有记录
4. 由于`md5_hash`字段有唯一性约束，因此出现了冲突错误

## 解决方案

### 1. 代码修改

1. 在`DocFileRepository`中添加明确的更新方法：

```java
@Repository
public interface DocFileRepository extends JpaRepository<DocFile, Long> {
    @Modifying
    @Transactional
    @Query("UPDATE DocFile d SET d.processingStatus = :status WHERE d.id = :id")
    void updateProcessingStatus(Long id, DocFile.ProcessingStatus status);
    
    @Modifying
    @Transactional
    @Query("UPDATE DocFile d SET d.processingStatus = :status, d.errorMessage = :errorMessage WHERE d.id = :id")
    void updateProcessingStatusAndError(Long id, DocFile.ProcessingStatus status, String errorMessage);
}
```

2. 修改`TextExtractionStage`中的状态更新代码：

```java
// 更新文档状态为文本提取中
docFileRepository.updateProcessingStatus(docFile.getId(), DocFile.ProcessingStatus.EXTRACTING_TEXT);
```

3. 修改错误处理方法：

```java
private void handleExtractionError(ProcessContext context, Exception e) {
    String errorMessage = "文本提取失败: " + e.getMessage();
    log.error(errorMessage, e);
    
    DocFile docFile = context.getDocFile();
    docFileRepository.updateProcessingStatusAndError(docFile.getId(), DocFile.ProcessingStatus.FAILED, errorMessage);
    
    throw new ProcessingException(errorMessage, e)
        .withStage(this)
        .withContext(context);
}
```

### 2. 改进说明

1. 使用直接的UPDATE语句而不是save方法
   - 避免了JPA的实体状态问题
   - 更明确的操作意图
   - 减少了不必要的数据库操作

2. 每个操作都在各自的事务中执行
   - 减少了事务冲突的可能性
   - 提高了并发处理能力

3. 明确指定更新字段
   - 避免了不必要的字段更新
   - 提高了代码的可维护性
   - 减少了潜在的并发问题

## 相关问题

1. 日志编码问题
   - 发现日志中存在中文乱码现象
   - 建议在application.properties中添加正确的编码设置：
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/your_db?characterEncoding=UTF-8
   server.servlet.encoding.charset=UTF-8
   server.servlet.encoding.force=true
   ```

## 后续建议

1. 考虑添加更多的日志记录，特别是在状态转换的关键节点
2. 考虑添加监控指标，跟踪文档处理各个阶段的成功率和耗时
3. 可以考虑添加重试机制，对于非致命性错误进行自动重试
4. 建议定期检查文档状态的一致性，确保没有处理卡在中间状态
