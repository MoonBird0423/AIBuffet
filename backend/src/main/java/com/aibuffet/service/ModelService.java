package com.aibuffet.service;

import com.aibuffet.model.Model;
import java.util.List;

public interface ModelService {
    /**
     * Query models by name and purpose
     * @param name Optional model name for filtering
     * @param purpose Optional model purpose for filtering
     * @return List of matching models
     */
    List<Model> queryModels(String name, String purpose);
}