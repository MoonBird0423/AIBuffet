package com.aibuffet.service.impl;

import com.aibuffet.model.Model;
import com.aibuffet.repository.ModelRepository;
import com.aibuffet.service.ModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModelServiceImpl implements ModelService {

    private final ModelRepository modelRepository;

    @Autowired
    public ModelServiceImpl(ModelRepository modelRepository) {
        this.modelRepository = modelRepository;
    }

    @Override
    public List<Model> queryModels(String name, String purpose) {
        // If both parameters are null, return all models
        if (name == null && purpose == null) {
            return modelRepository.findAll();
        }
        // Use custom query method for filtering
        return modelRepository.findByNameAndPurpose(name, purpose);
    }
}