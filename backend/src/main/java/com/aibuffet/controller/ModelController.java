package com.aibuffet.controller;

import com.aibuffet.model.Model;
import com.aibuffet.service.ModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/model")
public class ModelController {

    private final ModelService modelService;

    @Autowired
    public ModelController(ModelService modelService) {
        this.modelService = modelService;
    }

    @GetMapping("/query")
    public List<Model> queryModels(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String purpose) {
        return modelService.queryModels(name, purpose);
    }
}