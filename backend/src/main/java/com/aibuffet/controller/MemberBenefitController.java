package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.BenefitCheck;
import com.aibuffet.common.BenefitUsage;
import org.springframework.transaction.annotation.Transactional;
import com.aibuffet.service.MemberBenefitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/member/benefits")
public class MemberBenefitController {

    @Autowired
    private MemberBenefitService memberBenefitService;

    /**
     * @deprecated 权益校验已通过{@link BenefitCheck}切面实现，保留此方法仅作为示例
     */
    @Deprecated
    @BenefitCheck("api:benefit:check")
    @GetMapping("/check")
    public ApiResponse<Boolean> checkBenefit(
            @RequestParam String identifier,
            Principal principal) {
        // 实际校验已由切面完成，此处直接返回true
        return ApiResponse.success(true);
    }

    // 使用权益（实际权益记录由BenefitUsageAspect处理）
    @BenefitUsage(identifier = "api:benefit:use", amount = 1)
    @Transactional
    @PostMapping("/use")
    public ApiResponse useBenefit(
            @RequestParam String identifier,
            @RequestParam int amount,
            Principal principal) {
        // 业务逻辑已移至切面处理
        return ApiResponse.success();
    }
}
