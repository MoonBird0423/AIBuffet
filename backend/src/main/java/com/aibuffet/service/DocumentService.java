package com.aibuffet.service;

import com.aibuffet.model.DocFile;
import com.aibuffet.model.KnowledgeBaseFile;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.repository.KnowledgeBaseFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

@Service
public class DocumentService {
    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    @Autowired
    private DocFileRepository docFileRepository;

    @Autowired
    private KnowledgeBaseFileRepository knowledgeBaseFileRepository;

    @Autowired
    private OSSService ossService;

    /**
     * 上传文档并保存到知识库
     */
    @Transactional
    public List<DocFile> uploadDocuments(MultipartFile[] files, Long knowledgeBaseId, Long userId, Consumer<Long> progressCallback) throws IOException {
        List<DocFile> savedFiles = new ArrayList<>();

        for (MultipartFile file : files) {
            if (!ossService.isValidKnowledgeDoc(file)) {
                throw new IllegalArgumentException("Invalid document: " + file.getOriginalFilename());
            }

            String md5Hash = calculateMD5(file);
            DocFile existingFile = docFileRepository.findByMd5Hash(md5Hash);
            if (existingFile != null) {
                // 文件已存在，直接关联到知识库
                knowledgeBaseFileRepository.save(new KnowledgeBaseFile(knowledgeBaseId, existingFile.getId(), userId));
                savedFiles.add(existingFile);
                continue;
            }

            // 上传文件到OSS
            String fileUrl = ossService.uploadKnowledgeDoc(file, userId, progress -> {
                if (progressCallback != null) {
                    progressCallback.accept(file.getSize() * progress / 100);
                }
            });

            // 保存文件信息
            DocFile docFile = new DocFile();
            docFile.setFileName(file.getOriginalFilename());
            docFile.setFileType(getFileExtension(file.getOriginalFilename()));
            docFile.setFileSize(file.getSize());
            docFile.setFileUrl(fileUrl);
            docFile.setUploadedBy(userId);
            docFile.setMd5Hash(md5Hash);
            docFile = docFileRepository.save(docFile);

            // 关联到知识库
            knowledgeBaseFileRepository.save(new KnowledgeBaseFile(knowledgeBaseId, docFile.getId(), userId));
            savedFiles.add(docFile);
        }

        return savedFiles;
    }

    /**
     * 删除文档
     */
    @Transactional
    public void deleteDocument(Long docId, Long userId) {
        DocFile docFile = docFileRepository.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!docFile.getUploadedBy().equals(userId)) {
            throw new IllegalArgumentException("No permission to delete this document");
        }

        // 从OSS删除文件
        String objectName = extractObjectNameFromUrl(docFile.getFileUrl());
        ossService.deleteFile(objectName);

        // 删除数据库记录
        knowledgeBaseFileRepository.deleteByFileId(docId);
        docFileRepository.deleteById(docId);
    }

    /**
     * 获取知识库的文档列表
     */
    public Page<DocFile> getDocuments(Long knowledgeBaseId, int page, int size) {
        return docFileRepository.findByKnowledgeBaseId(knowledgeBaseId, PageRequest.of(page, size));
    }

    private String getFileExtension(String filename) {
        int lastDotPos = filename.lastIndexOf('.');
        return lastDotPos == -1 ? "" : filename.substring(lastDotPos).toLowerCase();
    }

    private String calculateMD5(MultipartFile file) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(file.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | IOException e) {
            throw new RuntimeException("Failed to calculate MD5", e);
        }
    }

    private String extractObjectNameFromUrl(String fileUrl) {
        int questionMarkIndex = fileUrl.indexOf('?');
        String urlWithoutParams = questionMarkIndex == -1 ? fileUrl : fileUrl.substring(0, questionMarkIndex);
        return urlWithoutParams.substring(urlWithoutParams.indexOf("/documents/"));
    }
}
