package com.aibuffet.dto;

import com.aibuffet.model.DocFile;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UploadResult {
    private String fileName;
    private DocFile file;    // 成功时的文件信息
    private String error;    // 失败时的错误信息

    public static UploadResult success(String fileName, DocFile file) {
        return new UploadResult(fileName, file, null);
    }

    public static UploadResult error(String fileName, String error) {
        return new UploadResult(fileName, null, error);
    }
}
