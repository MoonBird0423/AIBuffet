package com.aibuffet.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeBaseFileId implements Serializable {
    private Long kbId;
    private Long fileId;
}
