package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.BenefitCheck;
import com.aibuffet.service.MemberBenefitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/member/benefits")
public class MemberBenefitController {

    @Autowired
    private MemberBenefitService memberBenefitService;

    // 权益校验接口
    @BenefitCheck("api:benefit:check")
    @GetMapping("/check")
    public ApiResponse<Boolean> checkBenefit(
            @RequestParam String identifier,
            Principal principal) {
        Long userId = Long.valueOf(principal.getName());
        boolean hasBenefit = memberBenefitService.checkBenefit(userId, identifier);
        return ApiResponse.success(hasBenefit);
    }

    // 使用权益
    @PostMapping("/use")
    public ApiResponse useBenefit(
            @RequestParam String identifier,
            @RequestParam int amount,
            Principal principal) {
        Long userId = Long.valueOf(principal.getName());
        return memberBenefitService.useBenefit(userId, identifier, amount);
    }
}
