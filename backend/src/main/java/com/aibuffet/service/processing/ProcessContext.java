package com.aibuffet.service.processing;

import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Data
@Getter
@Setter
public class ProcessContext {
    private final DocFile docFile;
    private String extractedText;
    private List<DocChunk> chunks;
    private Map<String, Object> metadata;
    private boolean success;
    private String errorMessage;

    public ProcessContext(DocFile docFile) {
        this.docFile = docFile;
        this.success = true;
    }

    public void setError(String message) {
        this.success = false;
        this.errorMessage = message;
    }

    public boolean isSuccessful() {
        return success;
    }
}
