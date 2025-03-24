package com.aibuffet.service;

import com.aibuffet.model.ExampleResponse;
import org.springframework.stereotype.Service;

@Service
public class ExampleService {

    public ExampleResponse getExampleData() {
        return new ExampleResponse("Hello from AIBuffet backend!");
    }
}
